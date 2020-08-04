import * as vega from "vega";
import {removeNodesFromDataflow} from '../lib/dataflow-rewrite-pg'

describe('removeNodesFromDataflow', () => {
    var dataflow = require('vega-dataflow'),
    util = require('vega-util'),
    transforms = util.extend({}, require('vega-transforms'), require('vega-encode')),
    runtime = require('vega-runtime'),
    vega = require('vega'), 
    loader = vega.loader({baseURL: 'test/'})
    var spec = {
        'signals': [
            { 'name': 'color', 'value': 'steelblue' }
        ],
        'data': [
            {
            'name': 'table',
            'values': [{'x': 0.5}]
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
            'from': {'data': 'table'},
            'key': 'k',
            'sort': {'field': ['x', 'y']},
            'encode': {
                'enter': {
                'fill': {'signal': 'color'},
                'height': {'field': {'parent': 'h'}},
                'y': {'value': 0},
                'x1': {'scale': 'xscale', 'value': 0}
                },
                'update': {
                'x2': {'scale': 'xscale', 'field': 'x'}
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