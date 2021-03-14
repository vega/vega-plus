import * as Vega from "vega"
import { Transforms, AggregateTransform, None } from "vega"
import { aggregate, extent, bin } from "vega-transforms";
import { parse } from "vega-expression"
//import expr2sql from "./expr2sql"
import { error, hasOwnProperty } from 'vega-util';



function percentileContSql(field: string, fraction: number, db: string) {
  // creates a percentile predicate for a SQL query
  switch (db.toLowerCase()) {
    case "postgres":
      return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
    case "duckdb":
      return `QUANTILE(${field}, ${fraction})`;
    default:
      throw Error(`Unsupported database: ${db}`);
  }
}

function aggregateOpToSql(op: string, field: string, db: string) {
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
      return `VAR_SAMP(${field})`;
    case "variancep":
      return `VAR_POP(${field})`;
    case "stdev":
      return `STDDEV_SAMP(${field})`;
    case "stdevp":
      return `STDDEV_POP(${field})`;
    case "stderr":
      return `STDDEV_SAMP(${field})/SQRT(COUNT(${field}))`;
    case "median":
      return percentileContSql(field, 0.5, db);
    case "q1":
      return percentileContSql(field, 0.25, db);
    case "q3":
      return percentileContSql(field, 0.75, db);
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

export const aggregateTransformToSql = (tableName: string, transform: any, db: string) => {
  const groupby = (transform.groupby as string[])
  const selectionList = groupby.slice()
  const validOpIdxs = [];

  for (const [index, field] of (transform.fields as string[]).entries()) {
    const opt: string = transform.ops[index]
    const out: string = transform.as[index]
    if (opt === "valid") {
      validOpIdxs.push(`${field} IS NOT NULL`);
    }
    selectionList.push(field === null ? `${opt}(*) as ${out}` : aggregateOpToSql(opt, field, db) + ` as ${out}`)
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

export function dataRewrite(tableName: string, transform: any, db: string, dbTransforms, newData) {

  if (transform.type === "extent") {
    // converting signal to a new data item
    newData.push({
      name: transform.signal,
      transform: [{
        type: "dbtransform",
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
      type: "dbtransform",
      query: {
        signal: `'select ' + bins.step + ' * floor(cast(${transform.field} as float)/' + bins.step + ') as "bin0", count(*) as "count" from ${tableName} where ${transform.field} between ' + bins.start + ' and ' + bins.stop + ' group by bin0 UNION ALL select NULL as "bin0", count(*) as "count" from ${tableName} where ${transform.field} is null'`
      }
    })
    dbTransforms.push({
      type: "formula",
      expr: "datum.bin0?datum.bin0 + bins.step:null",
      as: "bin1"
    })

    return true // skip the next aggregate transform
  }

  if (transform.type === "aggregate") {
    dbTransforms.push({
      type: "dbtransform",
      query: {
        signal: aggregateTransformToSql(tableName, transform, db)
      }
    })
  }

  if (transform.type === "filter") {
    console.log(parse(transform.expr))

    dbTransforms.push(
      transform
    )
  }

  if (transform.type === "components") {
    dbTransforms.push({
      type: "dbtransform",
      query: {
        signal: componentsToSql(tableName, transform, db)
      }
    })
  }

}

function expr2sql(expr) {
  var memberDepth = 0
  function visit(ast) {
    const generator = Generators[ast.type];
    return generator(ast);
  }
  const Generators = {
    Literal: n => n.raw,

    Identifier: n => {
      const id = n.name;
      if (memberDepth > 0) {
        return id;
      }
    },

    MemberExpression: n => {
      const d = !n.computed,
        o = visit(n.object);
      if (d) memberDepth += 1;
      const p = visit(n.property);

      if (d) memberDepth -= 1;
      return p;
    },

    BinaryExpression: n =>
      visit(n.left) + ' ' + n.operator + ' ' + visit(n.right),
  }
  return visit(expr)
}

export const componentsToSql = (tableName: string, transform: any, db: string) => {
  console.log(transform)
  const groupby = (transform.aggregate[0].groupby as string[])
  const selectionList = groupby.slice()
  const filters = transform.filter ? transform.fllter.map(x => expr2sql(parse(x.expr))) : []
  var whereList = []


  for (const [index, field] of (transform.aggregate[0].fields as string[]).entries()) {
    const opt: string = transform.aggregate[0].ops[index]
    const out: string = transform.aggregate[0].as[index]
    if (opt === "valid") {
      whereList.push(`${field} IS NOT NULL`);
    }
    selectionList.push(field === null ? `${opt}(*) as ${out}` : aggregateOpToSql(opt, field, db) + ` as ${out}`)
  }
  whereList = whereList.concat(filters)

  var sql = ''
  if (whereList.length > 0) {
    sql = [
      `SELECT ${selectionList.join(",")}`,
      `FROM ${tableName}`,
      `WHERE ${whereList.join(" AND ")}`,
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
export function specRewrite(vgSpec) {
  const dataSpec = vgSpec.data
  const dbTransformInd = []   //the data item to be removed
  var table = ""
  const newData = []
  var db = "postgres"

  for (const [index, spec] of dataSpec.entries()) {
    if (spec.transform && spec.transform.length > 0 && spec.transform[0].type === "dbtransform") {
      if (spec.transform.length == 1) {
        dbTransformInd.push(index)
      }
      table = spec.transform[0]["relation"]
      db = spec.transform[0].db ? spec.transform[0].db : db

      // if the data spec doesn't contain any explicit transform, collect all useful fields as data
      const markFileds: string[] = collectNonTransformFields(spec.name, vgSpec.marks);
      if (markFileds.length > 0) {
        spec.transform[0] = {
          type: "dbtransform",
          query: {
            signal: vegaNonTransformToSql(table, markFileds)
          }
        }
      }

      // successor transform
      if (spec.transform.length > 1) {
        const dbTransforms = []
        console.log("here >1")
        const components = { type: "components" }
        var skip = false;
        for (var i = 1; i < spec.transform.length; i++) {
          if (!skip && (spec.transform[i].type === 'filter' || spec.transform[i].type === 'aggregate')) {
            console.log(spec.transform[i], "check")
            if (!components[spec.transform[i].type]) components[spec.transform[i].type] = []
            components[spec.transform[i].type].push(spec.transform[i])
            continue
          }
          skip = dataRewrite(table, spec.transform[i], db, dbTransforms, newData)
          if (skip) break // skip the aggregate follwing bin
        }

        dataRewrite(table, components, db, dbTransforms, newData)
        dataSpec[index].transform = dbTransforms
      }
      continue;

    }

    // sourced transform
    if (spec.transform && spec.transform.length > 0 && dbTransformInd.length > 0) {

      const dbTransforms = []
      const components = { type: "components" }
      var skip = false;
      for (const transform of spec.transform) {

        for (const ind of dbTransformInd) {
          if (spec.source && spec.source === dataSpec[ind].name) {
            console.log(dataSpec[ind].transform[0])
            table = dataSpec[ind].transform[0].relation
            delete spec.source
          }
        }

        if (!skip && (transform.type === 'filter' || transform.type === 'aggregate')) {
          console.log(transform, "check")
          if (!components[transform.type]) components[transform.type] = []
          components[transform.type].push(transform)
          continue
        }

        skip = dataRewrite(table, transform, db, dbTransforms, newData)
        if (skip) break
      }

      dataRewrite(table, components, db, dbTransforms, newData)
      dataSpec[index].transform = dbTransforms
    }
  }
  console.log(dataSpec)
  console.log(dbTransformInd)

  // remove the original "dbtransform" transform that indicating using db
  for (var i = dbTransformInd.length - 1; dataSpec.length > 1 && i >= 0; i--) {
    console.log(dataSpec[i])
    dataSpec.splice(i, 1);
  }

  console.log(newData, "newdata")
  vgSpec.data = newData.concat(dataSpec)

  return vgSpec
}
