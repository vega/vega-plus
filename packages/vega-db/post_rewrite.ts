import { Transforms, AggregateTransform, FilterTransform, ProjectTransform, StackTransform, CollectTransform, View } from "vega"
import { aggregate, extent, bin } from "vega-transforms";
import { encode, pie } from "vega-encode";
import VegaTransformPostgres from "vega-transform-pg";
import { parse } from "vega-expression"


// FixMe: write JSdocs for this file.

function percentileContSql(field: string, fraction: number, db: string) {
  // creates a percentile predicate for a SQL query
  if (!db) return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
  switch (db.toLowerCase()) {
    case "postgres":
      return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
    case "duckdb":
      return `QUANTILE(${field}, ${fraction})`;
    default:
      throw Error(`Unsupported database: ${db}`);
  }
}

function aggregateOpToSql(op: string, field: string, db: string) {
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
      return `COUNT(*)`;
    case "valid":
      return `SUM(CASE WHEN ${field} IS NULL THEN 0 ELSE 1 END)`;
    case "missing":
      return `SUM(CASE WHEN ${field} IS NULL THEN 1 ELSE 0 END)`;
    case "distinct":
      return `COUNT(DISTINCT ${field}) + COUNT(DISTINCT CASE WHEN ${field} IS NULL THEN 1 END)`;
    case "sum":
      return `SUM(${field})`;
    case "variance":
      return `VAR_SAMP(${field})`;
    case "variancep":
      return `VAR_POP(${field})`;
    case "stdev":
      return `STDDEV_SAMP(${field})`;
    case "stdevp":
      return `STDDEV_POP(${field})`;
    case "stderr":
      return `STDDEV_SAMP(${field})/SQRT(COUNT(${field}))`;
    case "median":
      return percentileContSql(field, 0.5, db);
    case "q1":
      return percentileContSql(field, 0.25, db);
    case "q3":
      return percentileContSql(field, 0.75, db);
    case "min":
      return `MIN(${field})`;
    case "max":
      return `MAX(${field})`;
    default:
      throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

function generatePostgresQueryForAggregateNode(node: any, from) {
  // Given an aggregation node and a relation name, generates
  // a Postgres query.

  const fields = node._argval.fields.map((f: any) => f.fname);
  const groupbyFields = node._argval.groupby.map((f: any) => f.fname);
  const ops = node._argval.ops;
  const as = node._argval.as;
  const selectionList = groupbyFields.slice();
  if (typeof from !== 'string') {
    console.log(node)
    console.log(from)
    from = `(${from._sql}) node_${from.id}`
    console.log(from)
  }

  for (const [index, field] of (fields as string[]).entries()) {

    const opt: string = ops[index]
    const out: string = as[index]

    selectionList.push(field === null ? `${opt}(*) as ${out}` : aggregateOpToSql(opt, field, node._db) + ` as ${out}`)
  }

  return `SELECT ${selectionList.join(",")}\
        FROM ${from}\
        GROUP BY ${groupbyFields.join(",")}`;

}

function generatePostgresQueryForBinNode(node: any, _) {
  // Given a bin node and a relation name, generates
  // a Postgres query.
  // FixMe: support anchor.
  // FixMe: support step.
  console.log(node)

  const bins = node.source.value
  const tableName = node._argval.from // for now
  const fields = bins.fields.join(",")
  // if (typeof from !== 'string') {
  // console.log(node)
  // from = `(${from._sql}) node_${from.id}`
  // }

  const binning = `select bin0 + ${bins.step} as bin1 , * from (select ${bins.step} * floor(cast(${fields} as float)/ ${bins.step}) as bin0, * from ${tableName} where ${fields} between ${bins.start} and ${bins.stop}) as sub UNION ALL select NULL as bin0, NULL as bin1, * from ${tableName} where ${fields} is null`

  const from = `(${binning}) node_${node.id}`

  return generatePostgresQueryForAggregateNode(node, from)
}
function generatePostgresQueryForExtentNode(node: any, from) {
  return `select min(${node._argval.field.fname}), max(${node._argval.field.fname}) from ${from} `
}

function generatePostgresQueryForFilterNode(node: any, from) {
  const filter = expr2sql(parse(node._argval.expr_str))

  return `select * from ${from} where ${filter}`
}

function expr2sql(expr: string) {
  var memberDepth = 0
  function visit(ast) {
    const generator = Generators[ast.type];
    return generator(ast);
  }
  const Generators = {
    Literal: n => n.raw,

    Identifier: n => {
      const id = n.name;
      if (memberDepth > 0) {
        return id;
      }
    },

    MemberExpression: n => {
      const d = !n.computed,
        o = visit(n.object);
      if (d) memberDepth += 1;
      const p = visit(n.property);

      if (d) memberDepth -= 1;
      return p;
    },

    BinaryExpression: n => {
      const right = visit(n.right)
      if (right === 'null') {
        n.operator = (n.operator === '==' || n.operator === '===') ? 'IS' : 'IS NOT'
      } else {
        if (n.operoter === '==' || n.operoter === '===') {
          n.operator = '='
        } else if (n.operator === '!=' || n.operator === '!==') {
          n.operator = '!='
        }
      }
      return visit(n.left) + ' ' + n.operator + ' ' + right
    },

    LogicalExpression: n => {
      n.operator = n.operator === '&&' ? 'AND' : 'OR'
      return visit(n.left) + ' ' + n.operator + ' ' + visit(n.right)
    },
  }
  return visit(expr)
}

function generatePostgresQueryForStackNode(node: any, from) {
  // Fixme: sort and order could be array or single string
  const fields = node._argval.field.fname
  const groupby = node._argval.groupby.map((f: any) => f.fname);
  const sort = node._argval.sort.fields;
  const as = node._argval.as ? node._argval.as : ["y0", "y1"]
  const order = node._argval.order
  const orderList = []

  for (const [index, field] of (sort as string[]).entries()) {

    orderList.push(index < order.length ? (order[index] === 'descending' ? `${field} DESC` : `${field}`) : `${field}`)

  }

  return `select *, ${as[1]} - ${fields} as ${as[0]} from (select *, sum(${fields}) over (partition by ${groupby.join(",")} order by ${orderList.join(",")}) ${as[1]} from ${from}) t`
}

function generatePostgresQueryForProjectNode(node: any, from) {
  const fields = node._argval.fields.map((f: any) => f.fname)
  const as = node._argval.as
  const selectionList = []

  for (const [index, field] of (fields as string[]).entries()) {
    const out: string = as[index]
    selectionList.push(`${field} as ${out}`)
  }

  return `select ${selectionList.join(",")} from ${from}`
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

function typeCheck(node: any, type: string) {
  return node.__proto__.constructor.Definition && node.__proto__.constructor.Definition.type === type
}

function rewriteTopLevelTransformNodesFor(currentNode: any, pgNode: any, dataOutputs, from) {
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
  if (currentNode._query) {
    // output position for a data item that's not followed by any transform
    // or has been visited and rewritten
    console.log(currentNode.id, "visited")
    return;
  }

  // if (!isDbTransform(currentNode) && !currentNode._query && dataOutputs.includes(currentNode.id)) {
  //   // output position for a data item that's not followed by any transform
  //   // it also has not to be the declared dbtransform node in spec
  //   console.log(currentNode.id, "end")
  //   return;
  // }

  if (typeCheck(currentNode, "Aggregate") && currentNode._argval.fields) {
    console.log(currentNode.id, "query top")
    currentNode._argval.from = from !== null ? from : pgNode._argval.relation
    console.log(from, "from")
    //currentNode._sql = generatePostgresQueryForAggregateNode(currentNode, currentNode._argval.from);
    currentNode._query = generatePostgresQueryForAggregateNode
    currentNode.transform = pgNode.__proto__.transform;
    from = currentNode // the FROM clause of the target point to the current node to extract the updated subquery string stored in from._sql
    console.log(currentNode, "aggreg")
  }

  else if (typeCheck(currentNode, "Filter")) {
    currentNode._argval.from = from !== null ? from : pgNode._argval.relation
    currentNode._query = generatePostgresQueryForFilterNode
    currentNode.transform = pgNode.__proto__.transform;
    from = currentNode
    console.log(currentNode, "filter")

  }

  // For bin nodes, we overwrite the target aggregate node successors'
  // transform function with a pg transform whose query corresponds to the
  // bin query.
  // FixMe: if a bin node has multiple target aggregate nodes, it's inefficient
  // to execute the query multiple times. We should find a way to do the query
  // (and store the results) only once. Putting the transform function
  // directly in the bin node doesn't seem to work, for reasons I don't yet
  // understand.

  else if (typeCheck(currentNode, "Bin")) {
    console.log(currentNode)

    for (const target of currentNode._targets.filter(t => typeCheck(t, "Aggregate"))) {
      target._argval.from = from !== null ? from : pgNode._argval.relation
      target._query = generatePostgresQueryForBinNode
      target.transform = pgNode.__proto__.transform;
      from = target
    }
  }

  else if (typeCheck(currentNode, "Extent")) {
    currentNode._argval.from = from !== null ? from : pgNode._argval.relation
    currentNode._query = generatePostgresQueryForExtentNode
    currentNode.transform = pgNode.__proto__.transform;
    console.log(currentNode)
  }

  else if (typeCheck(currentNode, "Stack")) {
    currentNode._argval.from = from !== null ? from : pgNode._argval.relation
    currentNode._query = generatePostgresQueryForStackNode
    currentNode.transform = pgNode.__proto__.transform;
    console.log(currentNode)
    from = currentNode
  }

  else if (typeCheck(currentNode, "Project")) {
    currentNode._argval.from = from !== null ? from : pgNode._argval.relation
    currentNode._query = generatePostgresQueryForProjectNode
    currentNode.transform = pgNode.__proto__.transform;
    console.log(currentNode)
    from = currentNode
  }

  if (!currentNode._targets) {
    console.log(currentNode.id)
    return;
  }

  for (const target of currentNode._targets) {
    if (isDbTransform(currentNode) || !dataOutputs.includes(currentNode.id)) {
      console.log(currentNode, "source")
      rewriteTopLevelTransformNodesFor(target, pgNode, dataOutputs, from);
    }

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

function generatePostgresQueriesForNode(pgNode: any, dataOutputs) {
  // For the given pg node, generates Postgres queries to be
  // executed at runtime, based on that node's dependents.

  if (pgNode.__proto__.constructor.Definition.type !== "dbtransform") {
    throw Error("generatePostgresQueriesForNode called on non-postgres");
  }

  // Rewrite top-level aggregate nodes.
  var subquery = pgNode._argval.relation
  rewriteTopLevelTransformNodesFor(pgNode, pgNode, dataOutputs, null);

  // Collect into a simple SELECT query all fields from non-transform nodes
  // that are on a downstream path from the pg node such that there is no
  // intervening transform node on the path.
  // FixMe: we need to filter out fields that aren't in the pg node's relation.
  // const markFields: string[] = Array.from(new Set(collectNonTransformFieldsFor(pgNode, pgNode)));
  // if (markFields.length) {
  //   pgNode._query = generatePostgresQueryForMarkFields(markFields, pgNode._argval.relation);
  // }
}

export function removeNodesFromDataflow(nodes: any, dataflow: any) {
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

export function isDbTransform(node: any) {
  // returns whether the given node is a Postgres transform node
  return node.__proto__.constructor.Definition
    && node.__proto__.constructor.Definition.type === "dbtransform"
}
export function dataflowRewritePostgres(view: View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents.
  const nodes = (view as any)._runtime.nodes;
  const pgNodes = [];

  const data = (view as any)._runtime.data
  const dataOutputs = []
  for (var key in data) {
    if (key != "root" && data.hasOwnProperty(key)) {
      dataOutputs.push(data[key].values.id)
      dataOutputs.push(data[key].output.id)
    }
  }
  console.log(dataOutputs)

  for (var name in data) {
    const node = data[name].input;

    if (name != "root" && isDbTransform(node)) {
      console.log(node, "data")

      generatePostgresQueriesForNode(node, dataOutputs);
      pgNodes.push({ node: node, idx: node.id });
    }
  }

  removeNodesFromDataflow(pgNodes.filter((e: any) => !e.node._query), view);
}
