# Scalable Vega

A demo of how to run Vega with a database. This is a fork of [this project](https://github.com/heavyairship/scalable-vega) by @heavyairship, which is a fork of [another project](https://github.com/vega/scalable-vega) by @domoritz.

## Workspace Packages
### vega-db
The primary Scalable Vega library component to be used in your application.

### demo
An interactive web demo of Scalable Vega components with examples of updating data and chart variables.

### server
The middleware server required for running the Scalable Vega code and interacting with the user chosen database.


## Installation
1. Install and start PostgreSQL.
2. Create a PostgreSQL database named `scalable_vega`, e.g., `createdb scalable_vega`. You don't need to do anything if you use DuckDB.
3. Run `cd /path/to/dev/repos`.
4. Run `git clone git@github.com:leibatt/scalable-vega.git`.
5. Run `yarn build` to install scalable-vega library dependencies.
6. For using prepopulated database, look at additional notes.

## Running Application Server
1. Run `yarn build:server` to install scalable-vega server dependencies.
2. Run `yarn start:server_pg` to start the application server with postgres, for DuckDB run `yarn start:server_duck`
2. All the config information for the databases and server (including user, password and ports to be used) is currently stored in the `./packages/server/server.js` file and can be customized.

## Running the Web Demo
1. Make sure you have the application server running.
2. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`.
3. Run `yarn start:app` to start the web server.
4. Open a browser tab to localhost:1234.
5. Upload the cars dataset from `./sample_data/cars.json` to the data input.
6. Upload the cars Vega spec from `./test/specs/specs/cars_average_transform_successor.json` to the specs input and see the visualization.

## Running Unit Tests
1. Again make sure you have the application server running. 
2. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`. 
3. The Unit Tests assume a prepopulated database, either do so by uploading data using the web demo or use the provided database (look at additional notes).
4. For running the unit tests:
    1. For PostgreSQL, `yarn test transform_pg`
    2. For DuckDB, `yarn test transform_duckdb`

## Additional Notes
1. Prepopulated Database, We have provided prepopulated databases and scripts for PostgreSQL and DuckDB in `./packages/server/database`
    1. For PostgreSQL, use a command like `psql dbname < infile`. For example, `psql postgresql://postgres@localhost/scalable_vega < ./packages/server/database/scalable_vega.sql`
    2. For DuckDB you can run `yarn start:duckdb-sample` which will populate a duckdb database file with 5 tables. You can customize the name of the db file being used by making changes in `./packages/server/server.js` and `./packages/server/database/duckdb_insertion.js`
2. If you face `Cannot find name 'expect'` type error while running tests
    1. Run `yarn add @types/jest -D`
