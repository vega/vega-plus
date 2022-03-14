import { specRewrite, runtimeRewrite } from '../packages/vega-plus-core/index';
import VegaTransformDB from "vega-transform-db"
import * as vega from "vega"
var initSqlJs = require('./sql-wasm.js');
const fs = require("fs");


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
      expect(Math.abs(parseFloat(act[i][a_key]) - parseFloat(mod[i][m_key]))).toBeCloseTo(0, 3);
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



describe("serverless duckdb test", () => {
    test("spec", async () => {
        console.log("Initialize SQLite and create view for parquet file.");

        const SQL = await initSqlJs({
            locateFile: file => `./test/${file}`
          });
          const filebuffer = fs.readFileSync('./sample_data/data/cars.db');
        var db = await new SQL.Database(new Uint8Array(filebuffer));

        function queries(q: string){
            if (q[0]=="(" && q.includes("query_")){
                var t = q.lastIndexOf("query_");
                q = q.substring(1, t) + ";"
            }
            var temp = db.prepare(q);
            for(var result = []; temp.step();) result.push(temp.getAsObject());
            return result;
        }
        var spec_vg = require(`../sample_data/specs/vega_specs/cars_average_sourced.json`);
        var loader = vega.loader();
    
        var view = new vega.View(vega.parse(spec_vg), {
          loader: loader,
          renderer: 'none'
        });
        await view.runAsync();
    
        var result_vg = view.data("cars");     


        var spec = require(`../sample_data/specs/specs/cars_average_sourced.json`);
        VegaTransformDB.type('Serverless');
        vega.transforms["dbtransform"] = VegaTransformDB;
        VegaTransformDB.QueryFunction(queries);

        const newSpec = specRewrite(spec)
        const runtime = runtimeRewrite(vega.parse(newSpec))
    
        var view_s = new vega.View(runtime, {
          renderer: 'none'
        })
          .logLevel(vega.Info)
    
        await view_s.runAsync();
    
        var result_s = view_s.data("cars");
        compare_tolerance(result_vg, result_s);
    });
  });

  