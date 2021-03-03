import 'regenerator-runtime/runtime'
import { run } from '../main'
import { specRewrite } from "../lib/spec_rewrite"
import * as vega from "vega"
import VegaTransformPostgres from "vega-transform-pg"





// var dataflow = require('vega-dataflow'),
//     util = require('vega-util'),
// transforms = util.extend({}, require('vega-transforms'), require('vega-encode')),
// runtime = require('vega-runtime'),
// vega = require('vega'),
// var loader = vega.loader({ baseURL: 'test/' })


function sortObj(list, key) {
    function compare(a, b) {
        a = a[key];
        b = b[key];
        var type = (typeof (a) === 'string' ||
            typeof (b) === 'string') ? 'string' : 'number';
        var result;
        if (type === 'string') result = a.localeCompare(b);
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
        console.log(Math.abs(parseFloat(act[i][a_key]) - parseFloat(mod[i][m_key])));
        if (Math.abs(parseFloat(act[i][a_key]) - parseFloat(mod[i][m_key])) > tolerance) {
            return false;
        }
    }
    return true;
}

function compare_tolerance(actual, modified) {
    var a_k = Object.keys(actual[0]);
    var m_k = Object.keys(modified[0]);
    var i, j;

    for (i = 0; i < a_k.length; i++) {
        for (j = 0; j < m_k.length; j++) {
            if (a_k[i].toUpperCase() == m_k[j].toUpperCase()) {
                if (sort_compare(actual, modified, a_k[i], m_k[j])) {
                    console.log("Worked");
                }
                else {
                    console.log("Issue");
                }
                continue;
            }
        }
    }


}


test('car_avg_sourced vega', async () => {

    // var vega = require('vega');
    var spec = require('../Specs/vega_specs/cars_average_sourced.json');

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

    spec = require('../Specs/specs/cars_average_sourced.json');
    const newspec = specRewrite(spec)
    console.log(newspec.data[0].transform, "rewrite");

    const runtime = vega.parse(newspec);
    //console.log(runtime, "runtime");

    var view_s = new vega.View(runtime, {
        loader: loader,
        renderer: 'none'
    })
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    // dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();

    var vega_pg_result = view_s.data("cars");
    console.log(vega_pg_result);
    // console.log(view_s._runtime.data);


    compare_tolerance(vega_result, vega_pg_result);

});

test('car_avg_count transform', async () => {

    var vega = require('vega');
    var spec = require('../Specs/vega_specs/cars_count_transform_successor.json');

    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"));
    var vega_result = view.data("cars");
    // console.log(view._runtime.data);

    vega.transforms["postgres"] = VegaTransformPostgres;
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

    spec = require('../Specs/specs/cars_count_transform_successor.json');
    var runtime = vega.parse(specRewrite(spec));
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    // dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();

    var vega_pg_result = view_s.data("cars");
    console.log(view_s._runtime.data);
    // console.log(view_s._runtime.data);
    compare_tolerance(vega_result, vega_pg_result);
});

test('car_distinct transform', async () => {

    var vega = require('vega');
    var spec = require('../Specs/vega_specs/cars_distinct_transform_successor.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"), "distinct");
    // console.log(view._runtime.data);

    vega.transforms["postgres"] = VegaTransformPostgres;
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

    spec = require('../Specs/specs/cars_distinct_transform_successor.json');
    var runtime = vega.parse(specRewrite(spec));
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    // dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"));
    // console.log(view_s._runtime.data);
});
test('car_histogram', async () => {

    var vega = require('vega');
    var spec = require('../Specs/vega_specs/cars_histogram.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("binned"), "histogram");
    // console.log(view._runtime.data);

    vega.transforms["postgres"] = VegaTransformPostgres;
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

    spec = require('../Specs/specs/cars_histogram.json');
    var runtime = vega.parse(specRewrite(spec));
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    // dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("binned"), "histogram sv");
    // console.log(view_s._runtime.data);
});

test('car_missing', async () => {

    var vega = require('vega');
    var spec = require('../Specs/vega_specs/cars_missing_transform_successor.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"), "missing");
    // console.log(view._runtime.data);

    vega.transforms["postgres"] = VegaTransformPostgres;
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

    spec = require('../Specs/specs/cars_missing_transform_successor.json');
    var runtime = vega.parse(specRewrite(spec));
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    // dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"), "missing sv");
    // console.log(view_s._runtime.data);
});