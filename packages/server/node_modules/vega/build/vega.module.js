import { extend } from 'vega-util';
export * from 'vega-util';
import { transforms } from 'vega-dataflow';
export { Dataflow, EventStream, MultiPulse, Operator, Parameters, Pulse, Transform, changeset, definition, ingest, isTuple, transform, transforms, tupleid } from 'vega-dataflow';
import * as tx from 'vega-transforms';
import * as vtx from 'vega-view-transforms';
import * as encode from 'vega-encode';
import * as geo from 'vega-geo';
import * as force from 'vega-force';
import * as tree from 'vega-hierarchy';
import * as label from 'vega-label';
import * as reg from 'vega-regression';
import * as voronoi from 'vega-voronoi';
import * as wordcloud from 'vega-wordcloud';
import * as xf from 'vega-crossfilter';
export * from 'vega-statistics';
export * from 'vega-time';
export * from 'vega-loader';
export * from 'vega-scenegraph';
export { interpolate, interpolateColors, interpolateRange, quantizeInterpolator, scale, scheme } from 'vega-scale';
export { projection } from 'vega-projection';
export { View } from 'vega-view';
export { defaultLocale, numberFormatDefaultLocale as formatLocale, locale, resetDefaultLocale, timeFormatDefaultLocale as timeFormatLocale } from 'vega-format';
export { expressionFunction } from 'vega-functions';
export { parse } from 'vega-parser';
export { context as runtimeContext } from 'vega-runtime';
export { codegenExpression, parseExpression } from 'vega-expression';
export { parseSelector } from 'vega-event-selector';

var name = "vega";
var version$1 = "5.21.0";
var description = "The Vega visualization grammar.";
var keywords = [
	"vega",
	"visualization",
	"interaction",
	"dataflow",
	"library",
	"data",
	"d3"
];
var license = "BSD-3-Clause";
var author = "UW Interactive Data Lab (http://idl.cs.washington.edu)";
var main = "build/vega-node.js";
var module = "build/vega.module.js";
var unpkg = "build/vega.min.js";
var jsdelivr = "build/vega.min.js";
var types = "index.d.ts";
var repository = "vega/vega";
var scripts = {
	bundle: "rollup -c --config-bundle",
	prebuild: "rimraf build && rimraf build-es5",
	build: "rollup -c --config-core --config-bundle --config-ie",
	postbuild: "node schema-copy",
	pretest: "yarn build --config-test",
	test: "TZ=America/Los_Angeles tape 'test/**/*-test.js'",
	prepublishOnly: "yarn test && yarn build",
	postpublish: "./schema-deploy.sh"
};
var dependencies = {
	"vega-crossfilter": "~4.0.5",
	"vega-dataflow": "~5.7.4",
	"vega-encode": "~4.8.3",
	"vega-event-selector": "~3.0.0",
	"vega-expression": "~5.0.0",
	"vega-force": "~4.0.7",
	"vega-format": "~1.0.4",
	"vega-functions": "~5.12.1",
	"vega-geo": "~4.3.8",
	"vega-hierarchy": "~4.0.9",
	"vega-label": "~1.1.0",
	"vega-loader": "~4.4.1",
	"vega-parser": "~6.1.4",
	"vega-projection": "~1.4.5",
	"vega-regression": "~1.0.9",
	"vega-runtime": "~6.1.3",
	"vega-scale": "~7.1.1",
	"vega-scenegraph": "~4.9.4",
	"vega-statistics": "~1.7.10",
	"vega-time": "~2.0.4",
	"vega-transforms": "~4.9.4",
	"vega-typings": "~0.22.0",
	"vega-util": "~1.17.0",
	"vega-view": "~5.10.1",
	"vega-view-transforms": "~4.5.8",
	"vega-voronoi": "~4.1.5",
	"vega-wordcloud": "~4.1.3"
};
var devDependencies = {
	"vega-schema": "*"
};
var gitHead = "774165e29850b66ec8b79ba52a7955f1ab936ea6";
var pkg = {
	name: name,
	version: version$1,
	description: description,
	keywords: keywords,
	license: license,
	author: author,
	main: main,
	module: module,
	unpkg: unpkg,
	jsdelivr: jsdelivr,
	types: types,
	repository: repository,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	gitHead: gitHead
};

// -- Transforms -----
extend(transforms, tx, vtx, encode, geo, force, label, tree, reg, voronoi, wordcloud, xf); // -- Exports -----

const version = pkg.version;

export { version };
