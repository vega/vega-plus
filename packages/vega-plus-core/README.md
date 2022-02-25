# vega-plus

Vega-plus extends the Vega dataflow to a client-server architecture to utilize the scalability advantage of DBMSs, we automatically translate Vega transform operators to SQL queries. To offload intensive calculations to the DBMS, combine vega-plus with one of our customized Vega transform that accepts SQL queries and requests data from a database.

## Usage Instructions

Install the package with

```
yarn add vega-plus
```

Here is a complete example that uses `vega-plus` and custom transform `vega-transform-db`.

To use `vega-transform-db`, install it with:
```
yarn add vega-plus
```


```js
import { parse } from "vega-plus";
import VegaTransformPostgres from "vega-transform-db";
import vega from "vega";

const httpOptions = {
    'url': 'http://localhost:3000/query',
    'mode': 'cors',
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

// register "dbtransform" transform
(vega as any).transforms['dbtransform'] = VegaTransformPostgres;
VegaTransformPostgres.setHttpOptions(httpOptions);

// use vega-plus API to parse a vega spec
// it will rewrite the original spec by extract the transforms to SQL queries
// and generates the rewriten dataflow runtime
const runtime = parse(spec, "dbtransform", VegaTransformPostgres)

const view = new vega.View(runtime)
    .logLevel(vega.Info)
    .renderer('svg')
    .initialize(document.querySelector('#view'));

view.runAsync();
```

### Vega Specifications

Once `vega-transform-db` has been imported and registered, Vega specs can reference the transform and get data from PostgreSQL like this:

```json
{
  "data": [{
    "type": "dbtransform",
    "db": "postgres",
    "relation": "cars"
  }]
}
```

## API Reference

<a name="parse" href="#parse">#</a>
<b>parse</b>(<i>specification</i>, <i>type</i>, <i>transform</i>[, <i>config</i>, <i>option</i>])

Similar to Vega's [parse API](https://vega.github.io/vega/docs/api/parser/), our parser requires two additional parameters:

* type: a string which is the type(name) of the custom transform you registered
* transform: a custome transform object that you registered

