# vega-plus-server
[Vega-plus](https://www.npmjs.com/package/vega-plus) extends the Vega dataflow to a client-server architecture to utilize the scalability advantage of DBMSs, we automatically translate Vega transform operators to SQL queries. To offload intensive calculations to the DBMS, combine vega-plus with one of our customized Vega transform that accepts SQL queries and requests data from a database. 

Vega-plus-server is a lightweight Node.js Express middleware server that forwards requests from a brower client to a DBMS backend (we now support PostgreSQL and DuckDB). The users can use our DBMS wapper API to load datasets and send queries. 

## Usage Instructions

Install the package with

```
yarn add vega-plus-server
```

Here is a [complete example](https://github.com/leibatt/scalable-vega/blob/master/packages/server/server.ts) that uses `vega-plus-server`. The server exposes two routes, `/createSql` and
`/query`. The route `/createSql` is a utility route used during development and testing that creates and
populates a relation from a list of JSON tuples. The `/query` route forwards an SQL query to a backend database. 

You can write a similar server.ts and run it with 
```
tsc --esModuleInterop server.ts
node server.js pg
```
Or, equavalently, you can import and use our default server code equavalent to the above example using our `run_server()` function. 

## API Reference
<a name="run_server" href="#run_server">#</a>
<b>run_server</b>(<i>type: string = "pg"</i>)
* type: a string indicating which DBMS to use. We currently support PostgreSQL("pg") and DuckDB("duckdb"). And the default type is "pg".

<a name="Postgres_Db" href="#Postgres_Db">#</a>
<i>(type: Database) </i><b>Postgres_Db</b>()
* This loads connection for a default config postgres database, to use a custom postgres config instead of default config, set the `Postgres_Db.pool` to your connection pool for node-postgres. For example,
```
var pg_db = Postgres_Db();
pg_db.pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'scalable_vega',
        password: 'postgres',
        port: 5432,
    });
```

<a name="Duck_Db" href="#Duck_Db">#</a>
<i>(type: Database) </i><b>Duck_Db</b>()
* This loads a DuckDB database from a default file location, to assign a DuckDB database from a custom file location, assign it to `Duck_Db.db`. For example,
```
var duck_db = Duck_Db();
duck_db.db = new duckdb.Database("scalable-vega.db");
```

<a name="createTable" href="#createTable">#</a>
<i>Database.</i><b>createTable</b>(<i>body : any</i>)
* This function is used to create a Table in the selected database using an object called body which contains an attribute called name which is the table name and another attribute called data whose first array contains a sample json row from the data for which the table is to be inserted i.e body.name = "Test" and body.data = [{"A":1, "B":2}]

<a name="importDatafile" href="#importDatafile">#</a>
<i>Database.</i><b>importDatafile</b>(<i>name: any, filePath: string</i>)
* This function is used to create a Table in the selected database using the table name and filepath of the csv file sent by the user, the filepath used in an abolute path and not relative.

<a name="runQuery" href="#runQuery">#</a>
<i>Database.</i><b>runQuery</b>(<i>sql: string, params?: any</i>)
* This function is used to run a query on the selected database.


