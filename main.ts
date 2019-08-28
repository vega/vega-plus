import * as vega from "vega";
import VegaTransformPostgres from "vega-transform-pg";

function run(spec:vega.Spec) {
  VegaTransformPostgres.setPostgresConnectionString('postgres://localhost:5432/voyager');
  VegaTransformPostgres.setHttpOptions({
    hostname: 'localhost',
    port: 3000,
    method: 'POST',
    path: '/query',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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

document.getElementById("vega-spec").addEventListener("change", handleVegaSpec, false);
