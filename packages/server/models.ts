export interface Database {
  runQuery: (sql: string, params?: any) => Promise<Record<string, unknown>[]>
}