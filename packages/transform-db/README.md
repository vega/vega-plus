# vega-transform-db
Data transform to load data from a database in [Vega](https://vega.github.io/vega/).

This package extends Vega's set of data transforms to support loading data from a database in Vega version 5.0 and higher. 

## Usage Instructions

Install the transform with

```
yarn add vega-transform-db
```

To use the transform, you must initially set the `type`. We currently aim to support 2 types of interaction with a database either via a middleware server or directly through a query function.
So if you intend to use a server set the type to `Server` or `Serverless` if you're passing a query function, then register the transform as `dbtransform`.

```js
import VegaTransformDB from "vega-transform-db"

VegaTransformDB.type('Serverless'); 
transforms["dbtransform"] = VegaTransformDB;
```

Further examples for using the package with a [middleware server](https://github.com/vega/vega-plus/tree/master/packages/demo/demo-server) and with a [serverless query function](https://github.com/vega/vega-plus/tree/master/packages/demo/demo-duckdb).

## API Reference
<a name="type" href="#type">#</a>
<i>VegaTransformDB.</i><b>type</b>(<i>type: string = "Serverless"</i>)
* This function is used to indicate whether the transform will be interacting with a middleware server `VegaTransformDB.type('Server')` or not `VegaTransformDB.type('Serverless')`


<a name="QueryFunction" href="#QueryFunction">#</a>
<i>VegaTransformDB.</i><b>QueryFunction</b>(<i>function</i>)
* If the type has been set to `Serverless`, this function is used to indicate which query function is to be used when a sql query is encountered.

<a name="setHttpOptions" href="#setHttpOptions">#</a>
<i>VegaTransformDB.</i><b>setHttpOptions</b>(<i>object</i>)
* If the type has been set to `Server`, this function is used to set the Http POST request options, i.e,
```
const httpOptions = {
    'url': 'http://localhost:3000/query',
    'mode': 'cors',
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
VegaTransformDB.type('Server');
vega.transforms["dbtransform"] = VegaTransformDB;
VegaTransformDB.setHttpOptions(httpOptions);
```
This example indicates that when a query is to be executed it will send a POST request at <i>http://localhost:3000/query</i> with sql query.
