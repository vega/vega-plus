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
<b>Postgres_Db</b>()
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
<b>Duck_Db</b>()
* This loads a DuckDB database from a default file location, to assign a DuckDB database from a custom file location, assign it to `Duck_Db.db`. For example,
```
var duck_db = Duck_Db();
duck_db.db = new duckdb.Database("scalable-vega.db");
```


