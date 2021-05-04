import 'regenerator-runtime/runtime'
import * as vega from "vega";
// defines the VTP node type
import VegaTransformPostgres from "vega-transform-db"
// includes the actual rewrite rules for the vega dataflow and translation to SQL
import { specRewrite } from "../scalable_vega/spec_rewrite"
import { view2dot } from '../scalable_vega/view2dot'
var hpccWasm = window["@hpcc-js/wasm"];
const querystring = require('querystring');
const http = require('http');


export function run(spec: vega.Spec) {
  // (re-)run vega using the scalable vega version
  // FixMe: should we define these attributes in the spec somehow?
  const httpOptions = {
    "url": 'http://localhost:3000/query',
    "mode": "cors",
    "method": "POST",
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

  (vega as any).transforms["dbtransform"] = VegaTransformPostgres;
  VegaTransformPostgres.setHttpOptions(httpOptions);

  loadOriginalSpec("original", spec, "Original Specification");

  // make a vega execution object (runtime) from the spec
  const newspec = specRewrite(spec)
  console.log(newspec, "rewrite");

  const runtime = vega.parse(newspec);
  // const runtime = vega.parse(spec);
  console.log(runtime, "runtime");


  // bind the execution to a dom element as a view
  var view = new vega.View(runtime)
    .logLevel(vega.Info)
    .renderer("svg")
    .initialize(document.querySelector("#view"));

  console.log(view, "df");

  // execute the rewritten dataflow for the view
  view.runAsync();

  loadOriginalSpec("rewrite", spec.data, "Rewritten Transforms With SQL");

  view.runAfter(view => {
    console.log(view2dot(view));
    const dot = `${view2dot(view)}`
    hpccWasm.graphviz.layout(dot, "svg", "dot").then(svg => {
      const placeholder = document.getElementById("graph-placeholder");
      placeholder.innerHTML = svg;
    });
  })

  return view;
}

function loadOriginalSpec(id, spec, title) {

  const container = document.getElementById(id);
  // Insert original vega spec
  const ogSpecContainer = document.createElement("div");
  ogSpecContainer.id = id;
  const ogSpecCode = document.createElement("pre");
  ogSpecCode.classList.add("prettyprint");
  ogSpecCode.innerHTML = JSON.stringify(spec, null, 4);

  ogSpecContainer.innerHTML = `<h3>${title}</h3>`;
  ogSpecContainer.appendChild(ogSpecCode);
  container.parentNode.replaceChild(ogSpecContainer, container)
}

function handleVegaSpec() {
  // when a new spec is uploaded, re-run vega
  const reader = new FileReader();
  reader.onload = function (e: any) {
    const spec = JSON.parse(e.target.result);
    run(spec);


  };
  reader.readAsText(this.files[0]);
  (<HTMLInputElement>document.getElementById("vega-spec")).value = "";
}

function uploadSqlDataHelper(data: Object[], rowsPerChunk: number, startOffset: number, relationName: string) {
  // send the uploaded data in batches to the server
  const endOffset = Math.min(startOffset + rowsPerChunk, data.length);
  const chunk = data.slice(startOffset, endOffset);
  const postData = querystring.stringify({
    name: relationName,
    data: JSON.stringify(chunk)
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
      if (res.statusCode === 400) {
        throw Error(`${res.statusMessage}: ${result}`);
      }
    });
  });
  req.write(postData);
  req.end();
  if (endOffset < data.length) {
    uploadSqlDataHelper(data, rowsPerChunk, endOffset, relationName);
  }
}

function uploadSqlData(data: Object[], relationName: string) {
  // when a new spec is uploaded, re-run vega
  const chunkBytes: number = 10 * 1024 * 1024; // 10MB
  const rowBytesSample: number = data.length > 0 ? JSON.stringify(data[0]).length : 1;
  const rowsPerChunk: number = Math.floor(chunkBytes / rowBytesSample);
  uploadSqlDataHelper(data, rowsPerChunk, 0, relationName);
}

function handleData() {
  // when a data file is uploaded, send it to the server and load into PostgreSQL
  const reader = new FileReader();
  let filename: string;
  reader.onload = function (e: any) {
    if (filename.slice(filename.length - '.json'.length) != '.json') {
      throw Error(`file ${filename} must have .json extension`);
    }
    const relationName = filename.slice(0, (filename.length - '.json.'.length) + 1).replace("-", "_");
    const data = JSON.parse(e.target.result);
    uploadSqlData(data, relationName);
  }
  filename = this.files[0].name;
  reader.readAsText(this.files[0]);
  (<HTMLInputElement>document.getElementById("data")).value = "";
}

document.getElementById("vega-spec").addEventListener("change", handleVegaSpec, false);
document.getElementById("data").addEventListener("change", handleData, false);
