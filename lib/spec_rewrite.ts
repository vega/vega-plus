import * as Vega from "vega"
import { Transforms, AggregateTransform } from "vega"
import { aggregate, extent, bin } from "vega-transforms";

function percentileContSql(field: string, fraction: number) {
  // creates a percentile predicate for a SQL query
  return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
}

function aggregateOpToSql(op: string, field: string) {
  // Converts supported Vega operations to SQL
  // for the given field.
  // FixMe: we will need to eventually support the case where
  // the 'field' is actually a vega expression, which would
  // require translating vega expressions into SQL.
  // FixMe: decide what to do for argmax, argmin, and confidence intervals (ci0, ci1).
  switch (op.toLowerCase()) {
    case "average":
      return `AVG(${field})`;
    case "count":
    case "valid":
      return `COUNT(*)`;
    case "missing":
      return `SUM(CASE WHEN ${field} IS NULL THEN 1 ELSE 0 END)`;
    case "distinct":
      return `COUNT(DISTINCT ${field}) + COUNT(DISTINCT CASE WHEN ${field} IS NULL THEN 1 END)`;
    case "sum":
      return `SUM(${field})`;
    case "variance":
      return `VARIANCE(${field})`;
    case "variancep":
      return `VAR_POP(${field})`;
    case "stdev":
      return `STDDEV(${field})`;
    case "stdevp":
      return `STDDEV_POP(${field})`;
    case "stderr":
      return `STDDEV(${field})/SQRT(COUNT(${field}))`;
    case "median":
      return percentileContSql(field, 0.5);
    case "q1":
      return percentileContSql(field, 0.25);
    case "q3":
      return percentileContSql(field, 0.75);
    case "min":
      return `MIN(${field})`;
    case "max":
      return `MAX(${field})`;
    default:
      throw Error(`Unsupported aggregate operation: ${op}`);
  }
}

export const vegaTransformToSql = (tableName: string, transform: Transforms) => {
  if (transform.type === "aggregate") {
    return aggregateTransformToSql(tableName, transform)
  }
}

export const aggregateTransformToSql = (tableName: string, transform: AggregateTransform) => {
  const groupby = (transform.groupby as string[])
  const selectionList = groupby.slice()
  const validOpIdxs = [];

  for (const [index, field] of (transform.fields as string[]).entries()) {
    const opt: string = transform.ops[index]
    const out: string = transform.as[index]
    if (opt === "valid") {
      validOpIdxs.push(`${field} IS NOT NULL`);
    }
    selectionList.push(field === null ? `${opt}(*) as ${out}` : aggregateOpToSql(opt, field) + ` as ${out}`)
  }

  var sql = ''
  if (validOpIdxs.length > 0) {
    sql = [
      `SELECT ${selectionList.join(",")}`,
      `FROM ${tableName}`,
      `GROUP BY ${groupby.join(",")}`,
      `WHERE ${validOpIdxs.join(" AND ")}`
    ].join(" ")
  } else {
    sql = [
      `SELECT ${selectionList.join(",")}`,
      `FROM ${tableName}`,
      `GROUP BY ${groupby.join(",")}`
    ].join(" ")
  }


  return `'${sql}'`
}

export function specRewrite(vgSpec) {
  const dataSpec = vgSpec.data
  const dbTransformInd = []
  var table = ""

  for (const [index, spec] of dataSpec.entries()) {
    console.log(dataSpec[index].transform)
    if (spec.transform && spec.transform.length > 0 && spec.transform[0].type === "postgres") {
      if (spec.transform.length == 1) {
        dbTransformInd.push(index)
      }
      table = spec.transform[0]["relation"]

      // successor spec
      if (spec.transform.length > 1) {
        const dbTransforms = []
        for (var i = 1; i < spec.transform.length; i++) {
          dbTransforms.push({
            type: "postgres",
            relation: table,
            query: {
              signal: vegaTransformToSql(table, spec.transform[i])
            }
          })
        }
        dataSpec[index].transform = dbTransforms
      }

      continue;

    }

    // sourced spec
    if (spec.transform && spec.transform.length > 0 && dbTransformInd.length > 0) {

      const dbTransforms = []
      for (const transform of spec.transform) {

        for (const ind of dbTransformInd) {
          if (spec.source && spec.source === dataSpec[ind].name) {
            console.log(dataSpec[ind].transform[0])
            table = dataSpec[ind].transform[0].relation
            delete spec.source
          }
        }

        dbTransforms.push({
          type: "postgres",
          relation: table,
          query: {
            signal: vegaTransformToSql(table, transform)
          }
        })
      }
      dataSpec[index].transform = dbTransforms
    }
  }
  console.log(dataSpec)
  console.log(dbTransformInd)

  // remove the original db transforms that introduce the schema
  for (var i = dbTransformInd.length - 1; i >= 0; i--) {
    console.log(dataSpec[i])
    dataSpec.splice(i, 1);
  }

  return vgSpec
}