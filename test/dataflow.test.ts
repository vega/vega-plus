//import * as vega from "vega";
import { removeNodesFromDataflow, dataflowRewritePostgres, isPostgresTransform } from '../lib/dataflow-rewrite-pg'
import { run } from '../main'

var dataflow = require('vega-dataflow'),
    util = require('vega-util'),
    transforms = util.extend({}, require('vega-transforms'), require('vega-encode')),
    runtime = require('vega-runtime'),
    vega = require('vega'),
    loader = vega.loader({ baseURL: 'test/' })
import VegaTransformPostgres from "vega-transform-pg";

describe('removeNodesFromDataflow', () => {

    var spec = {
        'signals': [
            { 'name': 'color', 'value': 'steelblue' }
        ],
        'data': [
            {
                'name': 'table',
                'values': [{ 'x': 0.5 }]
            }
        ],
        'scales': [
            {
                'name': 'xscale',
                'domain': [0, 1],
                'range': [0, 500]
            }
        ],
        'marks': [
            {
                'type': 'rect',
                'from': { 'data': 'table' },
                'key': 'k',
                'sort': { 'field': ['x', 'y'] },
                'encode': {
                    'enter': {
                        'fill': { 'signal': 'color' },
                        'height': { 'field': { 'parent': 'h' } },
                        'y': { 'value': 0 },
                        'x1': { 'scale': 'xscale', 'value': 0 }
                    },
                    'update': {
                        'x2': { 'scale': 'xscale', 'field': 'x' }
                    }
                }
            }
        ]
    };


    it('delete nodes from view one by one', () => {
        var dfs = vega.parse(spec);
        const view = new vega.View(dfs, {
            loader: loader,
            renderer: 'none'
        }).finalize();

        const nodes = view._runtime.nodes;
        const copy = Object.keys(nodes);

        for (const idx in copy) {
            const toDelete = [];
            const node = nodes[idx];
            toDelete.push({ node: node, idx: idx });

            expect(idx in view._runtime.nodes).toBe(true);
            removeNodesFromDataflow(toDelete, view);
            expect(idx in view._runtime.nodes).toBe(false);
        }

    });

    it('delete array of nodes from view', () => {
        var dfs = vega.parse(spec);
        const view = new vega.View(dfs, {
            loader: loader,
            renderer: 'none'
        }).finalize();

        const nodes = view._runtime.nodes;
        const copy = Object.keys(nodes);
        const toDelete = [];

        for (const idx in copy) {
            const node = nodes[idx];
            toDelete.push({ node: node, idx: idx });
            expect(idx in view._runtime.nodes).toBe(true);
        }

        removeNodesFromDataflow(toDelete, view);

        for (const idx in copy) {
            expect(idx in view._runtime.nodes).toBe(false);
        }
    });
});


describe('average', () => {
    jest.mock('../../vega-transform-pg');
    vega.transforms["postgres"] = VegaTransformPostgres;

    let spec = require('../specs/cars_average_sourced.json');
    const runtime = vega.parse(spec);
    const view = new vega.View(runtime).logLevel(vega.Info);

    dataflowRewritePostgres(view);
    const nodes = (view as any)._runtime.nodes;
    for (const idx in nodes) {
        const node = nodes[idx];
        if (node._query) {
            console.log(node._query, "query")
            console.log(node, "query")
        }

    }



});

test('car_avg_sourced vega', async () => {

    var vega = require('vega');
    var spec = require('../vega_specs/cars_avg_sourced.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"));
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

    spec = require('../specs/cars_average_sourced.json');
    runtime = vega.parse(spec);
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"));
    // console.log(view_s._runtime.data);
});

test('car_avg_transform vega', async () => {

    var vega = require('vega');
    var spec = require('../vega_specs/cars_avg_sourced.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"));
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

    spec = require('../specs/cars_average_transform_successor.json');
    runtime = vega.parse(spec);
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"));
    // console.log(view_s._runtime.data);
});

test('car_avg_count transform', async () => {

    var vega = require('vega');
    var spec = require('../vega_specs/cars_count_transform_successor.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"));
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

    spec = require('../specs/cars_count_transform_successor.json');
    runtime = vega.parse(spec);
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"));
    // console.log(view_s._runtime.data);
});

test('car_distinct transform', async () => {

    var vega = require('vega');
    var spec = require('../vega_specs/cars_distinct_transform_successor.json');
    var loader = vega.loader();

    var view = new vega.View(vega.parse(spec), {
        loader: loader,
        renderer: 'none'
    });

    await view.runAsync();

    console.log(view.data("cars"));
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

    spec = require('../specs/cars_distinct_transform_successor.json');
    runtime = vega.parse(spec);
    var view_s = new vega.View(runtime)
        .logLevel(vega.Info);
    // rewrite the dataflow execution for the view
    dataflowRewritePostgres(view_s);
    // execute the rewritten dataflow for the view
    await view_s.runAsync();
    console.log(view_s.data("cars"));
    // console.log(view_s._runtime.data);
});