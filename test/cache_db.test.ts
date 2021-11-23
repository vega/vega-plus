import { specRewrite } from "../packages/vega-db/spec_rewrite"
import VegaTransformPostgres from "vega-transform-db"
import * as vega from "vega"
global.fetch = require("node-fetch");


beforeAll(() => {
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
});

var test_cases = [
  ['cars_average_sourced', 'cars']
]

describe.each(test_cases)('comparing results', (spec_file, data_name) => {

  test(spec_file, async () => {

    var spec = require(`../sample_data/specs/specs/${spec_file}.json`);
    const newspec = specRewrite(spec)
    
    const runtime = vega.parse(newspec);

    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    var v1 = new Date();
    var n1 = v1.getTime();
    await view_s.runAsync();
    var result_s = view_s.data(data_name);
    var v2 = new Date();
    var n2 = v2.getTime();
    var diff = n2-n1;


    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    var v1 = new Date();
    var n1 = v1.getTime();
    await view_s.runAsync();
    var result_s = view_s.data(data_name);
    var v2 = new Date();
    var n2 = v2.getTime();
    var diff1 = n2-n1;
    var myVariable = diff - diff1;
    expect(myVariable).toBeGreaterThan(0);
    
  });
});
