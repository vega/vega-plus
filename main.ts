import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";
import { notDeepEqual } from "assert";
import { openSync } from "fs";
const querystring = require('querystring');
const http = require('http');

const postgresConnectionString = 'postgres://localhost:5432/scalable_vega';

function hasFields(node) {
  return node._argval 
    && node._argval.encoders 
    && node._argval.encoders.enter 
    && node._argval.encoders.enter.fields
    && node._argval.encoders.enter.fields.length
}

function hasSourcePathTo(node, dest) {
  if(node.source) {
    if(node.source.id === dest.id) {
      return true;
    }
    return hasSourcePathTo(node.source, dest);
  }
  return false;
}

function isCollectNode(node) {
  const def = node.__proto__.constructor.Definition;
  return def && def.type === "Collect";
}

function upstreamCollectNodeFor(node) {
  if(isCollectNode(node.source)) {
    return node.source;
  }
  return upstreamCollectNodeFor(node.source);
}

function collectFields(node, transform) {
  // FixMe: this function and its subroutines 
  // can be made more efficient. E.g. get the collect
  // node on the way to checking if there is a source path
  // to the transform.
  let out = {};

  if(hasFields(node) && hasSourcePathTo(node, transform)) {
    const upstreamCollectNode = upstreamCollectNodeFor(node);
    out[upstreamCollectNode.id] = {
      collectNode: upstreamCollectNode,
      fields: node._argval.encoders.enter.fields
    }
  }
  
  if(!node._targets) {
    return out;
  }
   
  for(const target of node._targets) {
    out = {...out, ...collectFields(target, transform)};
  }
  return out;
}

function opToSql(op:string) {
  if(op === "average") {
    return "AVG";
  } else {
    throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

function queryFor(node:any, relation:string) {
  // FixMe: support WHERE clause.

  let out = "SELECT ";
  const fields = node._argval.fields.map((f:any) => f.fname);
  const ops = node._argval.ops;
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

function generatePgQueryForNode(node: any) {
  // For the given node, generatesd a Postgres query to be
  // executed at runtime, based on that node's dependents.
  if(!node._targets || node._targets.length === 0) {
    return;
  }

  // Case 1: single downstream aggregate operator from same transform array.
  // Compute the aggregate query for the operator, overwrite the operator's
  // transform function, then remove the Postgres node as it is no longer needed.
  const query = queryFor(node._targets[0], node._argval.relation);
  node._targets[0]._query = query;
  node._targets[0].transform = node.__proto__.transform;
  node.transform = () => {}; // FixMe: delete entire node instead.

  // Case 2: multiple downstream aggregate operators from different transform arrays.
  // FixMe: fill in -- intermediate children are Relay nodes. 

  // Case 3: no aggregation at all. Marks depend directly on the pg data.
  // FixMe: fill in.
}

function generatePgQueriesForView(view: vega.View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents. 
  const nodes = (view as any)._runtime.nodes;
  for(const nodeId in nodes) {
    if(nodes[nodeId].__proto__.constructor.Definition
      && nodes[nodeId].__proto__.constructor.Definition.type === "postgres") {
      generatePgQueryForNode(nodes[nodeId]);
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
  generatePgQueriesForView(view);
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