import { StackTransform } from "vega";
import { array } from "vega-util";

export const stackTransformToSql = (tableName: string, transform: StackTransform, db: string) => {
    const groupby = (transform.groupby as string[])
    const as = transform.as ? transform.as : ['y0', 'y1']
    const sort = array(transform.sort.field)
    const order = array(transform.sort.order)
    order.map(x => x === 'descending' ? 'DESC' : 'ASC')
    const orderList = []
    
    
    for (const [index, field] of (sort as string[]).entries()) {
        
        orderList.push(index < order.length ? (order[index] === 'descending' ? `${field} DESC` : `${field}`) : `${field}`)
        
    }
    
    const sql =
    `"SELECT *, \
    SUM(${transform.field}) OVER ( PARTITION BY ${groupby.join(",")} ORDER BY ${orderList.join(",")}) ${as[1]} \
    FROM ${tableName}"`
    
    return sql
}
