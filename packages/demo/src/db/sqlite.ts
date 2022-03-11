var initSqlJs = require('./sql-wasm.js');

export class SqliteDB<Id extends string> {    
  private db;

  constructor(private database_url: string) {
  }

  public async initialize() {
    console.log("Initialize SQLite and create view for parquet file.");

    const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
    const dataPromise = await fetch(this.database_url).then(res => res.arrayBuffer());
    this.db = await new SQL.Database(new Uint8Array(dataPromise));
  }

  async queries(q: string): Promise<any> {
    var temp = this.db.prepare(q);
    for(var result = []; temp.step();) result.push(temp.getAsObject());
    return result;
  }
}
