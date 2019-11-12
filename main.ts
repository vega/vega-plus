import * as vega from "vega";
import * as vegaTransforms from "vega-transforms";
import VegaTransformPostgres from "vega-transform-pg";
const querystring = require('querystring');
const http = require('http');
const postgresConnectionString = 'postgres://localhost:5432/scalable_vega';

function opToSql(op:string, field:string) {
  // Converts supported Vega operations to SQL
  // for the given field.
  switch(op.toLowerCase()) {
    case "average": 
      return `AVG(${field})`;
    case "count":
    case "valid":
    case "missing":
      return `COUNT(${field})`;
    case "distinct":
      return `COUNT(DISTINCT ${field})`;
    case "sum":
      return `SUM(${field})`;
    case "variance":
      return `VARIANCE(${field})`;
    default: 
      throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

function generatePostgresQueryForAggregateNode(node:any, relation:string) {
  // Given an aggregation node and a relation name, generates
  // a Postgres query.
  //
  // FixMe: support filters for WHERE clause. This requires supporting
  // expressions, which we are going to punt on for now.
   
  const fields = node._argval.fields.map((f:any) => f.fname);
  const ops = node._argval.ops;
  const as = node._argval.as;
  const validOpIdxs = [];
  const missingOpIdxs = [];
  
  // Select 
  let out = "SELECT ";
  for(let fieldIdx=0; fieldIdx<fields.length; ++fieldIdx) {
    if(fieldIdx !== 0) {
      out += ", ";
    }
    if(fieldIdx < ops.length) {
      const op = ops[fieldIdx];
      if(op === "valid") {
        validOpIdxs.push(fieldIdx);
      } 
      if(op === "missing") {
        missingOpIdxs.push(fieldIdx);
      }
      out += opToSql(op, fields[fieldIdx]);
    } else {
      out += fields[fieldIdx];
    }
    if(fieldIdx < as.length) {
      out += ` AS ${as[fieldIdx]}`
    }
  }

  // From
  out += ` FROM ${relation}`

  // Where
  if(validOpIdxs.length > 0 || missingOpIdxs.length > 0) {
    out += " WHERE ";
  }
  for(const [i, validOpIdx] of validOpIdxs.entries()) {
    if(i !== 0) {
      out += " AND ";
    }
    out += `${fields[validOpIdx]} IS NOT NULL`;
  }
  for(const [i, missingOpIdx] of missingOpIdxs.entries()) {
    if(i !== 0 || validOpIdxs.length > 0) {
      out += " AND ";
    }
    out += `${fields[missingOpIdx]} IS NULL`;
  }

  // Group by
  const groupby = node._argval.groupby.map((f:any) => f.fname);
  if(groupby.length > 0) {
    out += " GROUP BY ";
    for(let groupbyIdx=0; groupbyIdx<groupby.length; ++groupbyIdx) {
      if(groupbyIdx !== 0) {
        out += ", ";
      }
      out += groupby[groupbyIdx];
    }
  }

  out += ";";

  return out;
}

function rewriteTopLevelAggregateNodesFor(currentNode: any, pgNode: any) {
  // Rewrites all top-level aggregate nodes in the subtree starting at
  // currentNode. For each path starting from currentNode, a top-level 
  // aggregate node is the first aggregate node in that path.
  // 
  // Rewriting involves the following:
  // 1. Generate the Postgres query for the aggregate node.
  // 2. Ovewrwrite the aggregate node's transform function with
  //    the VegaTransformPostgres transform function.
  if(currentNode instanceof vegaTransforms.aggregate) {
    const query = generatePostgresQueryForAggregateNode(currentNode, pgNode._argval.relation);
    currentNode._query = query;
    currentNode.transform = pgNode.__proto__.transform;
    return;
  } 
  if(!currentNode._targets) {
    return;
  }
  for(const target of currentNode._targets) {
    rewriteTopLevelAggregateNodesFor(target, pgNode);
  }
}

function generatePostgresQueriesForNode(node: any) {
  // For the given node, generates Postgres queries to be
  // executed at runtime, based on that node's dependents.
  
  // Case 1: rewriting downstream aggregate nodes.
  rewriteTopLevelAggregateNodesFor(node, node);

  // Case 2: no aggregation at all. Marks depend directly on the pg data.
  // FixMe: fill in.
}

function removeNodesFromDataFlow(nodes: any, dataflow: any) {
  // Remove given nodes from dataflow.

  for(const node of nodes) {
    
    if(node._targets) {
      // Remove references from targets to node.
      for(const target of node._targets) {
        delete target.source;
      }
      // Remove references from node to targets.
      delete node._targets;
    }

    if(node.source) {
      // Remove reference from source to node.
      for(let sourceTargetIdx=0; sourceTargetIdx<node.source._targets.length; ++sourceTargetIdx) {
        if(node.source._targets[sourceTargetIdx].id === node.id) {
          node.source._targets.splice(sourceTargetIdx, 1);
          break;
        }
      }
      // Remove reference from node to source.
      delete node.source;
    }
  }

  const nodeIds = nodes.map((n: any) => n.id);

  // Remove references from dataflow to nodes.
  for(const id of nodeIds) {
    delete (dataflow as any)._runtime.nodes[id.toString()];
  }

  // Remove references from touched array to nodes.
  const touched = (dataflow as any)._touched;
  for(let touchedIdx=0; touchedIdx<touched.length; ++touchedIdx) {
    if(nodeIds.includes(touched[touchedIdx].id)) {
      touched.splice(touchedIdx, 1);
    }
  }
}

function generatePostgresQueriesForView(view: vega.View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents. 
  const nodes = (view as any)._runtime.nodes;
  const pgNodes = [];
  for(const nodeId in nodes) {
    const node = nodes[nodeId];
    if(node.__proto__.constructor.Definition
      && node.__proto__.constructor.Definition.type === "postgres") {
      generatePostgresQueriesForNode(node);
      pgNodes.push(node);
    }
  }
  removeNodesFromDataFlow(pgNodes, view);
}

function run(spec:vega.Spec) {
  // FixMe: should we define these attributes in the spec somehow?
  VegaTransformPostgres.setPostgresConnectionString(postgresConnectionString);
  VegaTransformPostgres.setHttpOptions({
    hostname: 'localhost',
    port: 3000,
    method: 'POST',
    path: '/query',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  (vega as any).transforms["postgres"] = VegaTransformPostgres;
  const runtime = vega.parse(spec);
  const view = new vega.View(runtime)
    .logLevel(vega.Info)
    .renderer("svg")
    .initialize(document.querySelector("#view"));
  generatePostgresQueriesForView(view);
  view.runAsync();
}

function handleVegaSpec() {
  const reader = new FileReader();
  reader.onload = function(e:any) {
    const spec = JSON.parse(e.target.result);
    run(spec);
  };
  reader.readAsText(this.files[0]);
  (<HTMLInputElement>document.getElementById("vega-spec")).value = "";
}

function uploadSqlDataHelper(data: Object[], rowsPerChunk: number, startOffset: number, relationName: string) {   
  const endOffset = Math.min(startOffset + rowsPerChunk, data.length);
  const chunk = data.slice(startOffset, endOffset);
  const endpoint = "insertSql";
  const postData = querystring.stringify({
    name: relationName,
    data: JSON.stringify(chunk),
    postgresConnectionString: postgresConnectionString
  });
  const httpOptions = {
    hostname: 'localhost',
    port: 3000,
    method: 'POST',
    path: '/createSql',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    'Content-Length': Buffer.byteLength(postData)
  };
  const req = http.request(httpOptions, res => {
    let result = '';
    res.on('data', chunk => {
      result += chunk;
    });
    res.on('end', () => {
      if(res.statusCode === 400) {
        throw Error(`${res.statusMessage}: ${result}`);
      }
    });
  });
  req.write(postData);
  req.end();
  if(endOffset < data.length) {
    uploadSqlDataHelper(data, rowsPerChunk, endOffset, relationName);
  }
}

function uploadSqlData(data: Object[], relationName: string) {
  const chunkBytes: number = 10*1024*1024; // 10MB
  const rowBytesSample: number = data.length > 0 ? JSON.stringify(data[0]).length : 1;
  const rowsPerChunk: number = Math.floor(chunkBytes/rowBytesSample);
  uploadSqlDataHelper(data, rowsPerChunk, 0, relationName);
}

function handleData() {
  const reader = new FileReader();
  let filename: string;
  reader.onload = function(e:any) {
    if(filename.slice(filename.length-'.json'.length) != '.json') {
      throw Error(`file ${filename} must have .json extension`);
    }
    const relationName = filename.slice(0,(filename.length-'.json.'.length)+1).replace("-", "_");
    const data = JSON.parse(e.target.result);
    uploadSqlData(data, relationName);
  }
  filename = this.files[0].name;
  reader.readAsText(this.files[0]);
  (<HTMLInputElement>document.getElementById("data")).value = "";
}

document.getElementById("vega-spec").addEventListener("change", handleVegaSpec, false);
document.getElementById("data").addEventListener("change", handleData, false);