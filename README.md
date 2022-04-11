# VegaPlus

A demo of how to run Vega by offloading computational-intensive operations to a separate database management system. 
We have written a [demo paper](https://arxiv.org/pdf/2201.06742.pdf) about the research behind. Please cite us if you use Vega Plus in a publication.

```bib 
@article{2201.06742,
Author = {Junran Yang and Hyekang Kevin Joo and Sai S. Yerramreddy and Siyao Li and Dominik Moritz and Leilani Battle},
Title = {Demonstration of VegaPlus: Optimizing Declarative Visualization Languages},
Year = {2022},
Eprint = {arXiv:2201.06742},
Doi = {10.1145/3514221.3520168},
}
```

## Demos
- 3M flights in the browser with [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm): https://vega.github.io/vega-plus/demo-duckdb
- 3M flights in the browser with [SQL.JS](https://github.com/sql-js/sql.js): https://vega.github.io/vega-plus/demo-sqlite

## Workspace Packages
We used [yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) to structure this repository. 
### [vega-plus-core](https://github.com/vega/vega-plus/tree/master/packages/vega-plus-core)
The primary VegaPlus library component to be used in your application. Install with `yarn add vega-plus-core`.

### [demo](https://github.com/vega/vega-plus/tree/master/packages/demo)
An interactive web demo of VegaPlus components with examples of updating data and chart variables.

### [server](https://github.com/vega/vega-plus/tree/master/packages/server)
The middleware server for using the VegaPlus with a DBMS backend (we now support PostgreSQL and DuckDB). Install wih `yarn add vega-plus-server`.

### [transform-db](https://github.com/vega/vega-plus/tree/master/packages/transform-db)
The customized Vega transform used by VegaPlus that sends queries to, and receives results from a DBMS. Install wih `yarn add vega-transform-db`.

## Developers
### Pre-Requisite
1. Install and start PostgreSQL.
2. Create a PostgreSQL database named `vega_plus`, e.g., `createdb vega_plus`. You don't need to do anything if you want to use DuckDB.

### Installation
1. Run `git clone https://github.com/vega/vega-plus.git`.
2. Run `yarn --frozen-lockfile` and `yarn build` to install VegaPlus library dependencies.
3. For using prepopulated database in demo, look at [additional notes](#additional-notes).

### Running Middleware Server
1. Run `yarn build:server` to install VegaPlus server dependencies.
2. Run `yarn start:server_pg` to start the application server with postgres, for DuckDB run `yarn start:server_duck`
2. All the config information for the databases and server (including user, password and ports to be used) is currently stored in the `./packages/server/duck_db.js`/`./packages/server/postgres_db.js` files and can be customized.

### Running the Web Demo
1. Make sure you have the [middleware server running](#running-middleware-server).
2. In another terminal window, run `cd /path/to/dev/repos/vega-plus`.
3. Run `yarn build:app` to build dependencies for the demo/application UI.
4. Run `yarn start:app` to start the web server.
5. Open a browser tab to localhost:1234.
6. Upload the cars dataset from `./sample_data/data/cars.json` to the data input or click on the `Upload Demo Data` button.
7. After uploading a dataset to database, upload a cars vega spec from `./sample_data/data/specs/specs/` to the specs inputor click on the `Show me a Demo Spec` button and see the visualization.

### Running Unit Tests
1. Again make sure you have the [middleware server running](#running-middleware-server). 
2. In another terminal window, run `cd /path/to/dev/repos/vega-plus`. 
3. The Unit Tests assume a prepopulated database, either do so by uploading data using the web demo or use the provided database (look at additional notes).
4. For running the unit tests:
    1. For PostgreSQL, `yarn test transform_pg`
    2. For DuckDB, `yarn test transform_duckdb`

### Additional Notes
1. Prepopulated Database, We have provided prepopulated databases and scripts for PostgreSQL and DuckDB in `./packages/server/database`
    1. For PostgreSQL, use a command like `psql dbname < infile`. For example, `psql postgresql://postgres@localhost/scalable_vega < ./packages/server/database/scalable_vega.sql`
    2. For DuckDB you can run `yarn start:duckdb-sample` which will populate a duckdb database file with 5 tables. You can customize the name of the db file being used by making changes in `./packages/server/server.js` and `./packages/server/database/duckdb_insertion.js`
2. If you face `Cannot find name 'expect'` type error while running tests
    1. Run `yarn add @types/jest -D`
