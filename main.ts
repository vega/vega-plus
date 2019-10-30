import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";
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

function queryFor(fields: any, table:string) {
  // FixMe: only projections are implemented right now.
  let out = "SELECT ";
  for(let fieldIdx=0; fieldIdx<fields.length; ++fieldIdx) {
    if(fieldIdx) {
      out += ", ";
    }
    out += fields[fieldIdx];
  }
  out += ` FROM ${table};`
  return out;
}

function generatePgQueryForNode(node: any) {
  // For the given node, generatesd a Postgres query to be
  // executed at runtime, based on that node's dependents.

  // FixMe: need to handle multiple entries, not just one.
  // To do that, I have to figure out a way to use async
  // calls in a loop without getting this error:
  // 
  // 'babel-plugin-transform-async-to-promises/helpers' is imported by index.js, but could not be resolved – treating it as an external dependency
  // Error: Could not load babel-plugin-transform-async-to-promises/helpers (imported by /Users/afichman/Desktop/Projects/scalable-vega/node_modules/vega-transform-pg/index.js): ENOENT: no such file or directory, open 'babel-plugin-transform-async-to-promises/helpers'
  //
  // Or, I can just chain promises with then().
  const fields = collectFields(node, node);
  const collectNodeId = Object.keys(fields)[0];
  const entry = fields[collectNodeId];
  const query = queryFor(entry.fields, node._argval.table); // FixMe: this will change to 'relation'.
  node._argval.query = query;
}

function generatePgQueriesForView(runtime: any, view: vega.View) {
  // For each Postgres transform node in the View's dataflow graph,
  // generates a Postgres query to be executed at runtime, based
  // on that node's dependents. 

  // FixMe: shouldn't need the runtime parameter or the below code.
  // But for now I don't know how to extract postgres nodes from the View, 
  // since the VegaTransformPostgres type is getting renamed with a 
  // generated type name ('s' for example), and the type name is 
  // the only way to identify a postgres node in the View. 
  const pgTransformIds = [];
  for(const operator of runtime.operators) {
    if(operator.type === "postgres") {
      pgTransformIds.push(operator.id);
    }
  }
  const nodes = (view as any)._runtime.nodes;
  for(const nodeId in nodes) {
    if(pgTransformIds.includes(parseInt(nodeId))) {
      generatePgQueryForNode(nodes[nodeId]);
    }
  }
}

function run(spec:vega.Spec) {
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
  generatePgQueriesForView(runtime, view);
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

function uploadSqlDataHelper(data: Object[], rowsPerChunk: number, startOffset: number, tableName: string) {   
  const endOffset = Math.min(startOffset + rowsPerChunk, data.length);
  const chunk = data.slice(startOffset, endOffset);
  const endpoint = "insertSql";
  const postData = querystring.stringify({
    name: tableName,
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
        throw `${res.statusMessage}: ${result}`;
      }
    });
  });
  req.write(postData);
  req.end();
  if(endOffset < data.length) {
    uploadSqlDataHelper(data, rowsPerChunk, endOffset, tableName);
  }
}

function uploadSqlData(data: Object[], tableName: string) {
  const chunkBytes: number = 10*1024*1024; // 10MB
  const rowBytesSample: number = data.length > 0 ? JSON.stringify(data[0]).length : 1;
  const rowsPerChunk: number = Math.floor(chunkBytes/rowBytesSample);
  uploadSqlDataHelper(data, rowsPerChunk, 0, tableName);
}

function handleData() {
  const reader = new FileReader();
  let filename: string;
  reader.onload = function(e:any) {
    if(filename.slice(filename.length-'.json'.length) != '.json') {
      throw `file ${filename} must have .json extension`;
    }
    const tableName = filename.slice(0,(filename.length-'.json.'.length)+1).replace("-", "_");
    const data = JSON.parse(e.target.result);
    uploadSqlData(data, tableName);
  }
  filename = this.files[0].name;
  reader.readAsText(this.files[0]);
  (<HTMLInputElement>document.getElementById("data")).value = "";
}

document.getElementById("vega-spec").addEventListener("change", handleVegaSpec, false);
document.getElementById("data").addEventListener("change", handleData, false);