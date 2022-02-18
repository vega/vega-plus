import { ProjectTransform } from "vega";

export function projectTransformToSql(tableName: string, transform: ProjectTransform, db: string, prev: any) {
    const selectionList = [];
    const validOpIdxs = [];
    tableName = prev ? `(${prev.query.signal.slice(1, -1)}) ${prev.name}` : tableName
    
    for (const [index, field] of (transform.fields as string[]).entries()) {
        const out: string = transform.as[index]
        selectionList.push(`${field} as ${out}`)
    }
    
    const sql =
    `"SELECT ${selectionList.join(",")} \
    FROM ${tableName}"`
    
    return sql
}
