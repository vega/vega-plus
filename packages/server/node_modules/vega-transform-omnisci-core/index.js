import { inherits, ingest, Transform } from "vega";

/**
 * Generates a function to query data from an OmniSci Core database.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.query - The SQL query.
 */
export default function QueryCore(params) {
  Transform.call(this, [], params);
}

QueryCore.session = function(session) {
  if (session) {
    this._session = session;
    return this;
  }

  return this._session;
};

QueryCore.Definition = {
  type: "QueryCore",
  metadata: { changes: true, source: true },
  params: [{ name: "query", type: "string", required: true }]
};

const prototype = inherits(QueryCore, Transform);

prototype.transform = async function(_, pulse) {
    if (!QueryCore._session) {
    throw Error(
      "OmniSci Core session missing. Please assign it to the vega transform by calling `QueryCore.session(session).`"
    );
  }

  const result = await QueryCore._session.queryAsync(_.query);

  result.forEach(ingest);

  const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
  out.rem = this.value;
  this.value = out.add = out.source = result;

  return out;
};
