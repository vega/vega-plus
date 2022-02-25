import { AggregateTransform } from "vega";

function percentileContSql(field: string, fraction: number, db: string) {
    // creates a percentile predicate for a SQL query
    switch (db.toLowerCase()) {
        case "postgres":
        return `PERCENTILE_CONT(${fraction}) WITHIN GROUP (ORDER BY ${field})`;
        case "duckdb":
        return `QUANTILE_CONT(${field}, ${fraction})`;
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
        return `COUNT(*)`;
        case "valid":
        return `SUM(CASE WHEN ${field} IS NULL THEN 0 ELSE 1 END)`;
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

export const aggregateTransformToSql = (tableName: string, transform: AggregateTransform, db: string, prev: any) => {
    const groupby = (transform.groupby as string[])
    const selectionList = groupby.slice()
    const validOpIdxs = [];
    tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.name}` : tableName
    
    for (const [index, field] of (transform.fields as string[]).entries()) {
        
        const opt: string = transform.ops[index]
        const out: string = transform.as[index]
        if (transform.ops[index].hasOwnProperty('signal')) {
            const opt = transform.ops[index]['signal']
            console.log(opt)
            selectionList.push(field === null ? `${opt}(*) as ${out}` : `" + ${transform.ops[index]['signal']} + " (${field}) as ${out}`)
            continue;
        }
        selectionList.push(field === null ? `${opt}(*) as ${out}` : aggregateOpToSql(opt, field, db) + ` as ${out}`)
    }
    
    let sql = ''
    if (validOpIdxs.length > 0) {
        sql =
        `"SELECT ${selectionList.join(",")} \
        FROM ${tableName} \
        WHERE ${validOpIdxs.join(" AND ")} \
        GROUP BY ${groupby.join(",")}"`
    } else {
        sql =
        `"SELECT ${selectionList.join(",")} \
        FROM ${tableName} \
        GROUP BY ${groupby.join(",")}"`
    }
    
    
    return sql
}
