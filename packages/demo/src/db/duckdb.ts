import * as duckdb from "@duckdb/duckdb-wasm";

export class DuckDB<Id extends string> {
  private db: duckdb.AsyncDuckDB;

  constructor(private dataUrl: string, private table: string) {
  }

  public async initialize() {
    console.log("Initialize DuckDB and create view for parquet file.");

    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = await duckdb.createWorker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();

    this.db = new duckdb.AsyncDuckDB(logger, worker);

    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    const c = await this.db.connect();

    await c.query(
      `CREATE VIEW '${this.table}' AS SELECT * FROM parquet_scan('${this.dataUrl}')`
    );

    c.close();
  }

  async queries(q: string): Promise<any> {
    var conn = await this.db.connect();
    const results = await conn.query(q);
    var temp = results.toArray().toString();
    temp = '[' + temp + ']'
    temp = JSON.parse(temp);
    return temp;
  }
}
