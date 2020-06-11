import * as vega from "vega";
import { aggregate, extent, bin } from "vega-transforms";
import { encode, pie } from "vega-encode";
import VegaTransformPostgres from "vega-transform-pg";

// FixMe: write JSdocs for this file.

function percentileContSql(field: string, fraction: number) {
  // creates a percentile predicate for a SQL query
  return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
}

function aggregateOpToSql(op: string, field: string) {
  // Converts supported Vega operations to SQL
  // for the given field.
  // FixMe: we will need to eventually support the case where
  // the 'field' is actually a vega expression, which would
  // require translating vega expressions into SQL.
  // FixMe: decide what to do for argmax, argmin, and confidence intervals (ci0, ci1).
  switch (op.toLowerCase()) {
    case "average":
      return `AVG(${field})`;
    case "count":
    case "valid":
    case "missing":
      return `COUNT(*)`;
    case "distinct":
      return `COUNT(DISTINCT ${field})`;
    case "sum":
      return `SUM(${field})`;
    case "variance":
      return `VARIANCE(${field})`;
    case "variancep":
      return `VAR_POP(${field})`;
    case "stdev":
      return `STDDEV(${field})`;
    case "stdevp":
      return `STDDEV_POP(${field})`;
    case "stderr":
      return `STDDEV(${field})/SQRT(COUNT(${field}))`;
    case "median":
      return percentileContSql(field, 0.5);
    case "q1":
      return percentileContSql(field, 0.25);
    case "q3":
      return percentileContSql(field, 0.75);
    case "min":
      return `MIN(${field})`;
    case "max":
      return `MAX(${field})`;
    default:
      throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

function generatePostgresQueryForAggregateNode(node: any, relation: string) {
  // Given an aggregation node and a relation name, generates
  // a Postgres query.
  //
  // FixMe: support filters for WHERE clause. This requires supporting
  // expressions, which we are going to punt on for now.
  const fields = node._argval.fields.map((f: any) => f.fname);
  const groupbyFields = node._argval.groupby.map((f: any) => f.fname);
  const ops = node._argval.ops;
  const as = node._argval.as;
  const validOpIdxs = [];
  const missingOpIdxs = [];

  //////////////////////////////////////////////////////////////////////////////
  // SELECT clause
  //////////////////////////////////////////////////////////////////////////////
  let out = "SELECT ";
  for (const [fieldIdx, field] of fields.entries()) {
    if (fieldIdx !== 0) {
      out += ", ";
    }
    if (fieldIdx < ops.length) {
      const op = ops[fieldIdx];
      if (op === "valid") {
        validOpIdxs.push(fieldIdx);
      }
      if (op === "missing") {
        missingOpIdxs.push(fieldIdx);
      }
      out += aggregateOpToSql(op, field);
    } else {
      out += field;
    }
    if (fieldIdx < as.length) {
      out += ` AS ${as[fieldIdx]}`
    }
  }
  for (const [groupbyFieldIdx, groupbyField] of groupbyFields.entries()) {
    if (fields.length > 0 || groupbyFieldIdx > 0) {
      out += ", ";
    }
    out += groupbyField;
  }

  //////////////////////////////////////////////////////////////////////////////
  // FROM clause
  //////////////////////////////////////////////////////////////////////////////
  out += ` FROM ${relation}`

  //////////////////////////////////////////////////////////////////////////////
  // WHERE clause
  //////////////////////////////////////////////////////////////////////////////
  if (validOpIdxs.length > 0 || missingOpIdxs.length > 0) {
    out += " WHERE ";
  }
  for (const [i, validOpIdx] of validOpIdxs.entries()) {
    if (i !== 0) {
      out += " AND ";
    }
    out += `${fields[validOpIdx]} IS NOT NULL`;
  }
  for (const [i, missingOpIdx] of missingOpIdxs.entries()) {
    if (i !== 0 || validOpIdxs.length > 0) {
      out += " AND ";
    }
    out += `${fields[missingOpIdx]} IS NULL`;
  }

  //////////////////////////////////////////////////////////////////////////////
  // GROUP BY clause
  //////////////////////////////////////////////////////////////////////////////
  if (groupbyFields.length > 0) {
    out += " GROUP BY ";
    for (const [groupbyFieldIdx, groupbyField] of groupbyFields.entries()) {
      if (groupbyFieldIdx !== 0) {
        out += ", ";
      }
      out += groupbyField;
    }
  }

  out += ";";

  return out;
}

function generatePostgresQueryForBinNode(node: any, relation: string) {
  // Given a bin node and a relation name, generates
  // a Postgres query.
  // FixMe: support anchor.
  // FixMe: support step.
  const field = node._argval.field.fname;
  const maxbins = node._argval.maxbins ? node._argval.maxbins : 10;
  return `with
  ${field}_stats as (
    select min(${field}) as min, max(${field}) as max
    from ${relation}
  ),
  histogram as (
    select width_bucket(${field}, min, max, ${maxbins}) as bucket,
      min(${field}) as bin0,
      max(${field}) as bin1,
      count(*)
    from ${relation}, ${field}_stats
    where ${field} is not null
    group by bucket
    order by bucket)
  select bin0, bin1, count from histogram;`
}


function encodeFieldsFor(node: any) {
  // Returns encode fields for the given node.
  return (node._argval
    && node._argval.encoders
    && node._argval.encoders.enter
    && node._argval.encoders.enter.fields
    && node._argval.encoders.enter.fields.length) ?
    node._argval.encoders.enter.fields : [];
}

function fieldsFor(node: any) {
  // Returns fields for the given node.
  return (node._argval
    && node._argval.field
    && node._argval.field.fields) ?
    node._argval.field.fields : [];
}

function generatePostgresQueryForMarkFields(fields: string[], relation: string) {
  // Generates a SELECT f1, f2, ..., fn FROM <relation> query for the given
  // list of fields and relation.
  //
  // FixMe: we should query the database for the relation schema
  // and only use those fields in the schema to build the select query.
  // FixMe: we should also handle aggregate transforms defined directly in marks.
  let out = "SELECT ";
  for (const [fieldIdx, field] of fields.entries()) {
    if (fieldIdx !== 0) {
      out += ", "
    }
    out += field;
  }
  out += ` FROM ${relation}`;
  return out;
}

function rewriteTopLevelTransformNodesFor(currentNode: any, pgNode: any) {
  // Rewrites all top-level transform nodes in the subtree starting at
  // currentNode. For each path starting from currentNode, a top-level
  // transform node is the first transform node in that path.
  //
  // Currenty supported transforms:
  // - aggregate
  // - bin
  //
  // Rewriting involves the following:
  // 1. Generate the Postgres query for the transform node.
  // 2. Ovewrwrite the transform node's transform function with
  //    the VegaTransformPostgres transform function.

  if (currentNode instanceof aggregate && currentNode._argval.fields) {
    currentNode._query = generatePostgresQueryForAggregateNode(currentNode, pgNode._argval.relation);
    currentNode.transform = pgNode.__proto__.transform;
    return;
  }

  // For bin nodes, we overwrite the target aggregate node successors'
  // transform function with a pg transform whose query corresponds to the
  // bin query.
  // FixMe: if a bin node has multiple target aggregate nodes, it's inefficient
  // to execute the query multiple times. We should find a way to do the query
  // (and store the results) only once. Putting the transform function
  // directly in the bin node doesn't seem to work, for reasons I don't yet
  // understand.
  if (currentNode instanceof bin) {
    for (const target of currentNode._targets.filter(t => t instanceof aggregate)) {
      target._query = generatePostgresQueryForBinNode(currentNode, pgNode._argval.relation);
      target.transform = pgNode.__proto__.transform;
    }
    return;
  }

  if (!currentNode._targets) {
    return;
  }

  for (const target of currentNode._targets) {
    rewriteTopLevelTransformNodesFor(target, pgNode);
  }
}

function hasSourcePathTo(node: any, dest: any) {
  // Returns true iff there is a source path from node to dest.
  // This means that dest is an ancestor to node along the path.
  if (node.source) {
    if (node.source.id === dest.id) {
      return true;
    }
    return hasSourcePathTo(node.source, dest);
  }
  return false;
}

function collectNonTransformFieldsFor(node: any, pgNode: any) {
  // Recursively collects the union of all fields mentioned in encode nodes
  // for which the following holds:
  // 1. The encode node is on a path from pgNode.
  // 2. There is no intervening supported transform node on the path from
  //    pgNode to the encode node.

  if (node instanceof aggregate || node instanceof bin) {
    // Transform nodes cut off the field search, since they nodes
    // are handled separately.
    return [];
  }

  if (!node._targets) {
    return [];
  }

  let out = [];

  if (node instanceof encode && hasSourcePathTo(node, pgNode)) {
    // FixMe: we use hasSourcePathTo() to avoid collecting field names
    // for some other nodes. The correct thing to do is to get the schema
    // from the server and use that to filter out unwanted field names.
    out = encodeFieldsFor(node);
  }

  if (node instanceof extent || node instanceof pie) {
    out = fieldsFor(node);
  }

  for (const target of node._targets) {
    out = out.concat(collectNonTransformFieldsFor(target, pgNode));
  }

  return out;
}

function generatePostgresQueriesForNode(pgNode: any) {
  // For the given pg node, generates Postgres queries to be
  // executed at runtime, based on that node's dependents.

  if (pgNode.__proto__.constructor.Definition.type !== "postgres") {
    throw Error("generatePostgresQueriesForNode called on non-postgres");
  }

  // Rewrite top-level aggregate nodes.
  rewriteTopLevelTransformNodesFor(pgNode, pgNode);

  // Collect into a simple SELECT query all fields from non-transform nodes
  // that are on a downstream path from the pg node such that there is no
  // intervening transform node on the path.
  // FixMe: we need to filter out fields that aren't in the pg node's relation.
  const markFields: string[] = Array.from(new Set(collectNonTransformFieldsFor(pgNode, pgNode)));
  if (markFields.length) {
    pgNode._query = generatePostgresQueryForMarkFields(markFields, pgNode._argval.relation);
  }
}

function removeNodesFromDataflow(nodes: any, dataflow: any) {
  // Remove given nodes from dataflow.
  for (const entry of nodes) {
    const node = entry.node;
    if (node._targets) {
      // Remove references from targets to node.
      for (const target of node._targets) {
        delete target.source;
      }
      // Remove references from node to targets.
      delete node._targets;
    }

    if (node.source) {
      // Remove reference from source to node.
      for (let sourceTargetIdx = 0; sourceTargetIdx < node.source._targets.length; ++sourceTargetIdx) {
        if (node.source._targets[sourceTargetIdx].id === node.id) {
          node.source._targets.splice(sourceTargetIdx, 1);
          break;
        }
      }
      // Remove reference from node to source.
      delete node.source;
    }
  }


  // Remove references from dataflow to nodes.
  const dataflowIdxs = nodes.map((e) => e.idx);
  for (const idx of dataflowIdxs) {
    delete (dataflow as any)._runtime.nodes[idx.toString()];
  }

  // Remove references from touched array to nodes.
  const nodeIds = nodes.map((e: any) => e.node.id);
  const touched = (dataflow as any)._touched;
  for (let touchedIdx = 0; touchedIdx < touched.length; ++touchedIdx) {
    if (nodeIds.includes(touched[touchedIdx].id)) {
      touched.splice(touchedIdx, 1);
    }
  }
}

function isPostgresTransform(node: any) {
  // returns whether the given node is a Postgres transform node
  return node.__proto__.constructor.Definition
    && node.__proto__.constructor.Definition.type === "postgres"
}
export function dataflowRewritePostgres(view: vega.View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents.
  const nodes = (view as any)._runtime.nodes;
  const pgNodes = [];
  // leilani: since the later functions are recursive, it seems redundant to
  // call generatePostgresQueriesForNode on every node in the dataflow.
  for (const idx in nodes) {
    const node = nodes[idx];
    if (isPostgresTransform(node)) {
      generatePostgresQueriesForNode(node);
      pgNodes.push({ node: node, idx: idx });
    }
  }
  removeNodesFromDataflow(pgNodes.filter((e: any) => !e.node._query), view);
}
