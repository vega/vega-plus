import { specRewrite } from "../lib/spec_rewrite"
var vega = require('vega')
var VegaTransformPostgres = require('vega-transform-pg')

test('car_avg_sourced vega', async () => {

  // var vega = require('vega');
  var spec = require('../vega_specs/cars_average_sourced.json');

  var loader = vega.loader();

  var view = new vega.View(vega.parse(spec), {
    loader: loader,
    renderer: 'none'
  });

  await view.runAsync();
  var vega_result = view.data("cars");
  console.log(vega_result);
  //console.log(view._runtime.data);

  (vega as any).transforms["postgres"] = VegaTransformPostgres;
  const httpOptions = {
    "hostname": "localhost",
    "port": 3000,
    "method": "POST",
    "path": "/query",
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };
  VegaTransformPostgres.setHttpOptions(httpOptions);

  spec = require('../specs/cars_average_sourced.json');
  const newspec = specRewrite(spec)
  console.log(newspec.data[0].transform, "rewrite");

  const runtime = vega.parse(newspec);
  //console.log(runtime, "runtime");

  var view_s = new vega.View(runtime, {
    renderer: 'none'
  })
    .logLevel(vega.Info)
  // rewrite the dataflow execution for the view
  // dataflowRewritePostgres(view_s);
  // execute the rewritten dataflow for the view
  await view_s.runAsync();


  var vega_pg_result = view_s.data("cars");
  console.log(vega_pg_result);
  // console.log(view_s._runtime.data);


  //compare_tolerance(vega_result, vega_pg_result);

});