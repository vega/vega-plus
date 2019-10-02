import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";
const querystring = require('querystring');
const http = require('http');

const postgresConnectionString = 'postgres://localhost:5432/scalable_vega';

function toPostgreSQL(spec:vega.Spec) {
  const supportedEncodings = ["x", "y"];
  for(var dataIdx=0; dataIdx<spec.data.length; dataIdx++) {
    const data:any = spec.data[dataIdx];
    if(!data.source || !data.source.trim().startsWith('postgres')) {
      continue;
    } 
    const tableName = data.source.split('/').slice(-1)[0];
    const mark: any = spec.marks.filter(m => m.from && m.from.data === data.name)[0];
    if(!mark) {
      continue;
    }
    const enterAttributes = Object.keys(mark.encode.enter)
      .filter(e => supportedEncodings.includes(e))
      .map(e => mark.encode.enter[e].field);
    const updateAttributes = Object.keys(mark.encode.update)
      .filter(e => supportedEncodings.includes(e))
      .map(e => mark.encode.update[e].field);
    const attributes = [...new Set(enterAttributes.concat(updateAttributes))];
    const tokens = ['SELECT'];
    for(var attrIdx=0; attrIdx<attributes.length; ++attrIdx) {
      if(attrIdx!=0) {
        tokens.push(',');
      }
      tokens.push(attributes[attrIdx]);
    }
    tokens.push('FROM');
    tokens.push(tableName);
    tokens.push(';');
    const query = tokens.join(' ');
    (spec.data[dataIdx] as any) = {
      name: data.name,
      transform: [
        {
          type: "postgres",
          // FixMe: figure out why red squiggles for type attribute.
          query: {
            signal: `'${query}'`
          }
        }
      ]
    }
  }
  return spec;
}

function run(spec:vega.Spec) {
  spec = toPostgreSQL(spec);
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
  window["vega"] = vega;
  window["view"] = view;
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
