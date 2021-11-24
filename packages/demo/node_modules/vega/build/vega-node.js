'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vegaUtil = require('vega-util');
var vegaDataflow = require('vega-dataflow');
var tx = require('vega-transforms');
var vtx = require('vega-view-transforms');
var encode = require('vega-encode');
var geo = require('vega-geo');
var force = require('vega-force');
var tree = require('vega-hierarchy');
var label = require('vega-label');
var reg = require('vega-regression');
var voronoi = require('vega-voronoi');
var wordcloud = require('vega-wordcloud');
var xf = require('vega-crossfilter');
var vegaStatistics = require('vega-statistics');
var vegaTime = require('vega-time');
var vegaLoader = require('vega-loader');
var vegaScenegraph = require('vega-scenegraph');
var vegaScale = require('vega-scale');
var vegaProjection = require('vega-projection');
var vegaView = require('vega-view');
var vegaFormat = require('vega-format');
var vegaFunctions = require('vega-functions');
var vegaParser = require('vega-parser');
var vegaRuntime = require('vega-runtime');
var vegaExpression = require('vega-expression');
var vegaEventSelector = require('vega-event-selector');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var tx__namespace = /*#__PURE__*/_interopNamespace(tx);
var vtx__namespace = /*#__PURE__*/_interopNamespace(vtx);
var encode__namespace = /*#__PURE__*/_interopNamespace(encode);
var geo__namespace = /*#__PURE__*/_interopNamespace(geo);
var force__namespace = /*#__PURE__*/_interopNamespace(force);
var tree__namespace = /*#__PURE__*/_interopNamespace(tree);
var label__namespace = /*#__PURE__*/_interopNamespace(label);
var reg__namespace = /*#__PURE__*/_interopNamespace(reg);
var voronoi__namespace = /*#__PURE__*/_interopNamespace(voronoi);
var wordcloud__namespace = /*#__PURE__*/_interopNamespace(wordcloud);
var xf__namespace = /*#__PURE__*/_interopNamespace(xf);

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
var module$1 = "build/vega.module.js";
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
	module: module$1,
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
vegaUtil.extend(vegaDataflow.transforms, tx__namespace, vtx__namespace, encode__namespace, geo__namespace, force__namespace, label__namespace, tree__namespace, reg__namespace, voronoi__namespace, wordcloud__namespace, xf__namespace); // -- Exports -----

const version = pkg.version;

Object.defineProperty(exports, 'Dataflow', {
  enumerable: true,
  get: function () {
    return vegaDataflow.Dataflow;
  }
});
Object.defineProperty(exports, 'EventStream', {
  enumerable: true,
  get: function () {
    return vegaDataflow.EventStream;
  }
});
Object.defineProperty(exports, 'MultiPulse', {
  enumerable: true,
  get: function () {
    return vegaDataflow.MultiPulse;
  }
});
Object.defineProperty(exports, 'Operator', {
  enumerable: true,
  get: function () {
    return vegaDataflow.Operator;
  }
});
Object.defineProperty(exports, 'Parameters', {
  enumerable: true,
  get: function () {
    return vegaDataflow.Parameters;
  }
});
Object.defineProperty(exports, 'Pulse', {
  enumerable: true,
  get: function () {
    return vegaDataflow.Pulse;
  }
});
Object.defineProperty(exports, 'Transform', {
  enumerable: true,
  get: function () {
    return vegaDataflow.Transform;
  }
});
Object.defineProperty(exports, 'changeset', {
  enumerable: true,
  get: function () {
    return vegaDataflow.changeset;
  }
});
Object.defineProperty(exports, 'definition', {
  enumerable: true,
  get: function () {
    return vegaDataflow.definition;
  }
});
Object.defineProperty(exports, 'ingest', {
  enumerable: true,
  get: function () {
    return vegaDataflow.ingest;
  }
});
Object.defineProperty(exports, 'isTuple', {
  enumerable: true,
  get: function () {
    return vegaDataflow.isTuple;
  }
});
Object.defineProperty(exports, 'transform', {
  enumerable: true,
  get: function () {
    return vegaDataflow.transform;
  }
});
Object.defineProperty(exports, 'transforms', {
  enumerable: true,
  get: function () {
    return vegaDataflow.transforms;
  }
});
Object.defineProperty(exports, 'tupleid', {
  enumerable: true,
  get: function () {
    return vegaDataflow.tupleid;
  }
});
Object.defineProperty(exports, 'interpolate', {
  enumerable: true,
  get: function () {
    return vegaScale.interpolate;
  }
});
Object.defineProperty(exports, 'interpolateColors', {
  enumerable: true,
  get: function () {
    return vegaScale.interpolateColors;
  }
});
Object.defineProperty(exports, 'interpolateRange', {
  enumerable: true,
  get: function () {
    return vegaScale.interpolateRange;
  }
});
Object.defineProperty(exports, 'quantizeInterpolator', {
  enumerable: true,
  get: function () {
    return vegaScale.quantizeInterpolator;
  }
});
Object.defineProperty(exports, 'scale', {
  enumerable: true,
  get: function () {
    return vegaScale.scale;
  }
});
Object.defineProperty(exports, 'scheme', {
  enumerable: true,
  get: function () {
    return vegaScale.scheme;
  }
});
Object.defineProperty(exports, 'projection', {
  enumerable: true,
  get: function () {
    return vegaProjection.projection;
  }
});
Object.defineProperty(exports, 'View', {
  enumerable: true,
  get: function () {
    return vegaView.View;
  }
});
Object.defineProperty(exports, 'defaultLocale', {
  enumerable: true,
  get: function () {
    return vegaFormat.defaultLocale;
  }
});
Object.defineProperty(exports, 'formatLocale', {
  enumerable: true,
  get: function () {
    return vegaFormat.numberFormatDefaultLocale;
  }
});
Object.defineProperty(exports, 'locale', {
  enumerable: true,
  get: function () {
    return vegaFormat.locale;
  }
});
Object.defineProperty(exports, 'resetDefaultLocale', {
  enumerable: true,
  get: function () {
    return vegaFormat.resetDefaultLocale;
  }
});
Object.defineProperty(exports, 'timeFormatLocale', {
  enumerable: true,
  get: function () {
    return vegaFormat.timeFormatDefaultLocale;
  }
});
Object.defineProperty(exports, 'expressionFunction', {
  enumerable: true,
  get: function () {
    return vegaFunctions.expressionFunction;
  }
});
Object.defineProperty(exports, 'parse', {
  enumerable: true,
  get: function () {
    return vegaParser.parse;
  }
});
Object.defineProperty(exports, 'runtimeContext', {
  enumerable: true,
  get: function () {
    return vegaRuntime.context;
  }
});
Object.defineProperty(exports, 'codegenExpression', {
  enumerable: true,
  get: function () {
    return vegaExpression.codegenExpression;
  }
});
Object.defineProperty(exports, 'parseExpression', {
  enumerable: true,
  get: function () {
    return vegaExpression.parseExpression;
  }
});
Object.defineProperty(exports, 'parseSelector', {
  enumerable: true,
  get: function () {
    return vegaEventSelector.parseSelector;
  }
});
exports.version = version;
Object.keys(vegaUtil).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return vegaUtil[k];
    }
  });
});
Object.keys(vegaStatistics).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return vegaStatistics[k];
    }
  });
});
Object.keys(vegaTime).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return vegaTime[k];
    }
  });
});
Object.keys(vegaLoader).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return vegaLoader[k];
    }
  });
});
Object.keys(vegaScenegraph).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return vegaScenegraph[k];
    }
  });
});
