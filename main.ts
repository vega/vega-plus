import * as vega from "vega";
import * as vegaTransforms from "vega-transforms";
import VegaTransformPostgres from "vega-transform-pg";
const querystring = require('querystring');
const http = require('http');
const postgresConnectionString = 'postgres://localhost:5432/scalable_vega';

function opToSql(op:string) {
  if(op === "average") {
    return "AVG";
  } else {
    throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

function postgresQueryForAggregateNode(node:any, relation:string) {
  // FixMe: support WHERE clause.
  let out = "SELECT ";
  const fields = node._argval.fields.map((f:any) => f.fname);
  const ops = node._argval.ops;
  const opsStr = JSON.stringify(ops);
  if(opsStr !== '["mean"]' && opsStr !== '["average"]') {
    throw Error(`unsupported ops: ${ops}`);
  } 
  const as = node._argval.as;
  for(let fieldIdx=0; fieldIdx<fields.length; ++fieldIdx) {
    if(fieldIdx !== 0) {
      out += ", ";
    }
    if(fieldIdx < ops.length) {
      out += `${opToSql(ops[fieldIdx])}(${fields[fieldIdx]})`;
    } else {
      out += fields[fieldIdx];
    }
    if(fieldIdx < as.length) {
      out += ` AS ${as[fieldIdx]}`
    }
  }

  out += ` FROM ${relation}`

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

  out += ";"

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
    const query = postgresQueryForAggregateNode(currentNode, pgNode._argval.relation);
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

function generatePostgresQueriesForView(view: vega.View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents. 
  const nodes = (view as any)._runtime.nodes;
  for(const nodeId in nodes) {
    const node = nodes[nodeId]
    if(node.__proto__.constructor.Definition
      && node.__proto__.constructor.Definition.type === "postgres") {
      generatePostgresQueriesForNode(node);
      node.transform = () => {}; // FixMe: delete entire node instead.
    }
  }
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