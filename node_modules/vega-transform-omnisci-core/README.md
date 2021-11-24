# Vega Transform to Query OmniSciDB

[![npm version](https://img.shields.io/npm/v/vega-transform-omnisci-core.svg)](https://www.npmjs.com/package/vega-transform-omnisci-core)
[![Build Status](https://travis-ci.com/omnisci/vega-transform-omnisci-core.svg?branch=master)](https://travis-ci.com/omnisci/vega-transform-omnisci-core)

Data transform to load data from an [OmniSciDB](https://www.omnisci.com/platform/omniscidb) database in [Vega](https://vega.github.io/vega/).

This package extends Vega's set of data transforms to support loading data from a database in Vega version 5.0 and higher. 

Try this transform in our [Observable demo](https://beta.observablehq.com/@domoritz/vega-with-omnisci-core-transform) or the [scalable Vega demo app](https://github.com/vega/scalable-vega).

## Usage Instructions

Install the transform with

```
yarn add vega-transform-omnici-core
```

To use the core transform, you must set the `session`. To create a session, create a connection and connect to it. Then assign the session to the Core transform with `QueryCore.sesssion(session)`. the register the transform as `querycore`.

```js
QueryCore.session(session);
transforms["querycore"] = QueryCore;
```

Here is a complete example.

```js
import "@mapd/connector/dist/browser-connector";
import QueryCore from "vega-transform-omnisci-core";
import vega from "vega";

const connection = new window.MapdCon()
  .protocol("https")
  .host("metis.mapd.com")
  .port("443")
  .dbName("mapd")
  .user("mapd")
  .password("HyperInteractive");

// connect to core database and create a transform with a handle to the session
connection.connectAsync().then(session => {
  // pass the session to the core transform
  QueryCore.session(session);

  // register OmniSci Core transform
  vega.transforms["querycore"] = QueryCore;

  // now you can use the transform in a Vega spec
  const view = new vega.View(vega.parse(spec))
    .initialize(document.querySelector("#vis"));
  
  view.runAsync();
});
```

### Vega Specifications

Once `vega-transform-omnisci-core` has been imported and registered, Vega specs can reference the transform and get data from OmniSciDB like this:

```json
{
  "data": [
    {
      "name": "table",
      "transform": [{
        "type": "querycore",
        "query": "select count(*) from flights_donotmodify"
      }]
    }
  ]
}
```

Check out a complete demo at https://github.com/vega/scalable-vega. 
