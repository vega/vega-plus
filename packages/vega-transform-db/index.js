import { inherits, ingest, Transform } from "vega";
const querystring = require('querystring');
const http = require('http');

/**
 * Generates a function to query data from a database.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.query - The SQL query.
 */
export default function VegaTransformDB(params) {
  Transform.call(this, [], params);
}

/**
 * Set the Core session.
 * @param {*} QueryFunction
 * @param {*} type //Serverless or Server
 * @param {*} setHttpOptions
 */

 VegaTransformDB.type = function(type) {
  if (type == "Serverless") {
    this._type = type;
    return this;
  }
  else {
    this._type = "Server";
  }
  return this._type;
};


VegaTransformDB.setHttpOptions = function (httpOptions) {
  if (httpOptions) {
    this._httpOptions = httpOptions;
    return this;
  }
  return this._httpOptions;
};

VegaTransformDB.QueryFunction = function(query_function) {
  if (query_function) {
    this._QueryFunction = query_function;
    return this;
  }

  return this._QueryFunction;
};

VegaTransformDB.Definition = {
  type: "dbtransform",
  metadata: { changes: true, source: true },
  params: [{ name: "query", type: "string", required: true }]
};

const prototype = inherits(VegaTransformDB, Transform);

prototype.transform = async function(_, pulse) {
  if (!VegaTransformDB._httpOptions && !VegaTransformDB._QueryFunction) {
    throw Error(
      "Core session or http option is missing. Please assign it to the Vega transform"
    );
  }
  var result;
  if (VegaTransformDB._type=='Serverless'){
    pulse.dataflow.info(`DuckDB Core Query: ${_.query}`);
    result = await VegaTransformDB._QueryFunction(_.query);
  }
  else if (VegaTransformDB._type=='Server'){    
    const postQuery = async function () {
      const options = VegaTransformDB._httpOptions
      const response = await fetch(options.url, {
        method: options.method,
        mode: options.mode,
        headers: options.headers,
        body: querystring.stringify({
          query: _.query
        })
      });
  
      // fetch won’t reject on HTTP error status even if the response
      // is an HTTP 404 or 500. Instead, it will resolve normally with
      // ok status set to false
      if (response.ok)
        return await response.json();
      else {
        // capture the error message
        const err = await response.json();
        throw Error(
          (err.error + ': ' + err.message).replace(/(\r\n|\n|\r)/gm, "")
        );
      }
    };
  
    try {
      result = await postQuery();
    } catch (error) {
      console.log(error);
    }
  
  }
  else {
    throw Error(
      "Core type hasn't been assigned. Please assign it to the Vega transform"
    );
  }

  result.forEach(ingest);
  const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
  out.rem = this.value;

  if (this._argval.toArray) {
    // changing the result format for Extent transform
    // [{min:10, max, 100}] -> [10, 100]
    const temp = [result[0].min, result[0].max]
    result = temp
  }
  this.value = out.add = out.source = result;
  return out;
};
