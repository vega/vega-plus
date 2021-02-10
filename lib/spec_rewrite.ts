import * as Vega from "vega"
import { Transforms, AggregateTransform, None } from "vega"
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

function vegaNonTransformToSql(tableName: string, markFields: string[]) {
  let out = `SELECT `;
  for (const [fieldIdx, field] of markFields.entries()) {
    if (fieldIdx !== 0) {
      out += ", "
    }
    out += field;
  }
  out += ` FROM ${tableName}`;
  return `'${out}'`;
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
      `WHERE ${validOpIdxs.join(" AND ")}`,
      `GROUP BY ${groupby.join(",")}`
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

function collectNonTransformFields(dataName: string, marks: any) {
  const fields: string[] = []
  for (const [index, mark] of marks.entries()) {
    if (mark.encode && mark.encode.enter && mark.from && mark.from.data === dataName) {
      for (var key of Object.keys(mark.encode.enter)) {
        if (mark.encode.enter[key].field) { fields.push(mark.encode.enter[key].field) }
      }
    }
  }
  return fields
}

export function dataRewrite(tableName: string, transform: Transforms, dbTransforms, newData) {

  if (transform.type === "extent") {
    // converting signal to a new data item
    newData.push({
      name: transform.signal,
      transform: [{
        type: "postgres",
        query: {
          signal: `'select min(${transform.field}) as "min", max(${transform.field}) as "max" from ${tableName}'`
        }
      }]
    })
  }

  if (transform.type === "bin") {
    const maxbins = transform.maxbins ? transform.maxbins : 10
    let extent = {}

    if (transform.extent.hasOwnProperty("signal")) {
      // getting "extent" from the data item that converted from signal
      const name = transform.extent["signal"]
      extent["signal"] = `[data('${name}')[0]['min'], data('${name}')[0]['max']]`
    } else {
      // extent is assigned explicitly as [min, max]
      extent = transform.extent
    }

    newData.push({
      name: "bin",
      transform: [
        {
          type: "bin",
          field: null,
          signal: "bins",
          maxbins: maxbins,
          extent: extent
        }
      ]
    })

    dbTransforms.push({
      type: "postgres",
      query: {
        signal: `'select ' + bins.step + ' * floor(cast(${transform.field} as float)/' + bins.step + ') as "bin0", count(*) as "count" from ${tableName} where ${transform.field} between ' + bins.start + ' and ' + bins.stop + ' group by bin0'`
      }
    })
    dbTransforms.push({
      type: "formula",
      expr: "datum.bin0 + bins.step",
      as: "bin1"
    })

    return true
  }

  if (transform.type === "aggregate") {
    dbTransforms.push({
      type: "postgres",
      query: {
        signal: aggregateTransformToSql(tableName, transform)
      }
    })
  }

}

export function specRewrite(vgSpec) {
  const dataSpec = vgSpec.data
  const dbTransformInd = []
  var table = ""
  const newData = []

  for (const [index, spec] of dataSpec.entries()) {
    if (spec.transform && spec.transform.length > 0 && spec.transform[0].type === "postgres") {
      if (spec.transform.length == 1) {
        dbTransformInd.push(index)
      }
      table = spec.transform[0]["relation"]

      // if the data spec doesn't contain any explicit transform, collect all useful fields as data
      const markFileds: string[] = collectNonTransformFields(spec.name, vgSpec.marks);
      if (markFileds.length > 0) {
        spec.transform[0] = {
          type: "postgres",
          relation: table,
          query: {
            signal: vegaNonTransformToSql(table, markFileds)
          }
        }
      }

      // successor transform
      if (spec.transform.length > 1) {
        const dbTransforms = []
        for (var i = 1; i < spec.transform.length; i++) {
          const skip = dataRewrite(table, spec.transform[i], dbTransforms, newData)
          if (skip) break // skip the aggregate follwing bin
        }
        dataSpec[index].transform = dbTransforms
      }
      continue;

    }

    // sourced transform
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

        const skip = dataRewrite(table, transform, dbTransforms, newData)
        if (skip) break
      }
      dataSpec[index].transform = dbTransforms
    }
  }
  console.log(dataSpec)
  console.log(dbTransformInd)

  // remove the original "postgres" transform that indicating using db
  for (var i = dbTransformInd.length - 1; dataSpec.length > 1 && i >= 0; i--) {
    console.log(dataSpec[i])
    dataSpec.splice(i, 1);
  }

  console.log(newData, "newdata")
  vgSpec.data = newData.concat(dataSpec)

  return vgSpec
}
