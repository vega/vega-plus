import { CollectTransform } from "vega";
import { array } from "vega-util";

export const collectTransformToSql = (tableName: string, transform: CollectTransform, db: string) => {
    const sort = array(transform.sort.field)
    const order = array(transform.sort.order)
    order.map(x => x === 'descending' ? 'DESC' : 'ASC')
    const orderList = []
  
  
    for (const [index, field] of (sort as string[]).entries()) {
  
      orderList.push(index < order.length ? (order[index] === 'descending' ? `${field} DESC` : `${field}`) : `${field}`)
  
    }
  
    const sql =
      `"SELECT * \
      FROM ${tableName} \
      ORDER BY ${orderList.join(",")}"`
  
    return sql
  }