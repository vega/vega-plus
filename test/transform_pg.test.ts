import { specRewrite } from "../scalable_vega/spec_rewrite"
import VegaTransformPostgres from "vega-transform-db"
import * as vega from "vega"
global.fetch = require("node-fetch");

function sortObj(list, key) {
  function compare(a, b) {
    a = a[key];
    b = b[key];

    var type = (typeof (a) === 'string' ||
      typeof (b) === 'string') ? 'string' : 'number';
    var result;
    if (type === 'string') result = parseFloat(a) - parseFloat(b);
    else result = a - b;
    return result;
  }
  return list.sort(compare);
}


function sort_compare(act, mod, a_key, m_key) {
  var tolerance = 0.0;
  var i;
  act = sortObj(act, a_key);
  mod = sortObj(mod, m_key);
  for (i = 0; i < act.length; i++) {
    if (mod[i][m_key] != act[i][a_key]) {
      expect(Math.abs(parseFloat(act[i][a_key]) - parseFloat(mod[i][m_key]))).toBeCloseTo(0, 5);
    }
  }
}

function compare_tolerance(actual, modified) {
  var a_k = Object.keys(actual[0]);
  var m_k = Object.keys(modified[0]);
  var i, j;

  for (i = 0; i < a_k.length; i++) {
    for (j = 0; j < m_k.length; j++) {
      if (a_k[i].toUpperCase() == m_k[j].toUpperCase()) {
        sort_compare(actual, modified, a_k[i], m_k[j])
      }
    }
  }


}
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
  ['cars_average_sourced', 'cars'],
  ['cars_count_transform_successor', 'cars'],
  ['cars_distinct_transform_successor', 'cars'],
  ['cars_histogram_extent', 'binned'],
  ['cars_histogram', 'binned'],
  ['cars_max_transform_successor', 'cars'],
  ['cars_median_transform_successor', 'cars'],
  ['cars_min_transform_successor', 'cars'],
  ['cars_missing_transform_successor', 'cars'],
  ['cars_q1_transform_successor', 'cars'],
  ['cars_stderr_transform_successor', 'cars'],
  ['cars_stdev_transform_successor', 'cars'],
  ['cars_stdevp_transform_successor', 'cars'],
  ['cars_sum_transform_successor', 'cars'],
  ['cars_valid_transform_successor', 'cars'],
  ['cars_variance_transform_successor', 'cars'],
  ['cars_variancep_transform_successor', 'cars'],

]

describe.each(test_cases)('comparing results', (spec_file, data_name) => {

  test(spec_file, async () => {
    var spec_vg = require(`./specs/vega_specs/${spec_file}.json`);
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec_vg), {
      loader: loader,
      renderer: 'none'
    });
    await view.runAsync();

    var result_vg = view.data(data_name);
    console.log(result_vg, spec_file);

    var spec = require(`./specs/specs/${spec_file}.json`);
    const newspec = specRewrite(spec)

    const runtime = vega.parse(newspec);

    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    await view_s.runAsync();

    var result_s = view_s.data(data_name);
    compare_tolerance(result_vg, result_s);
  });
});
