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

describe("simple stack transform example", () => {
  test("stack", async () => {
    var spec_vg = require(`./specs/vega_specs/stack.json`);
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec_vg), {
      loader: loader,
      renderer: 'none'
    });
    await view.runAsync();

    var result_vg = view.data('table');

    var spec = require(`./specs/specs/stack.json`);
    const newspec = specRewrite(spec)

    const runtime = vega.parse(newspec);

    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    await view_s.runAsync();

    var result_s = view_s.data('table');

    compare_tolerance(result_vg, result_s);
  });
});

const stack_transform1 = {
  "type": "stack",
  "groupby": ["region"],
  "field": "sale",
  "sort": { "field": ["product", "Q"], "order": ["descending"] }
}

const stack_transform2 = {
  "type": "stack",
  "groupby": ["region", "product"],
  "field": "sale",
  "sort": { "field": ["Q"], "order": ["descending"] }
}

var test_cases = [
  ['sort by array 1', stack_transform1],
  ['sort by array 2', stack_transform2],

]

describe.each(test_cases)('stack transform with table product', (name, transform) => {
  test(`${name}`, async () => {
    var spec_vg = require('./specs/vega_specs/product.json');
    spec_vg.data[0].transform[0] = transform
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec_vg), {
      loader: loader,
      renderer: 'none'
    });
    await view.runAsync();

    var result_vg = view.data('table');



    var spec = require('./specs/specs/product.json');
    const dbtransform = {
      "type": "dbtransform",
      "relation": "product"
    }

    spec.data[0].transform = [dbtransform, transform]

    const newspec = specRewrite(spec)
    const runtime = vega.parse(newspec);

    var view_s = new vega.View(runtime, {
      renderer: 'none'
    })
      .logLevel(vega.Info)

    await view_s.runAsync();

    var result_s = view_s.data('table');

    compare_tolerance(result_vg, result_s);
  })
});

