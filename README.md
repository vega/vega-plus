# Scalable Vega with PostgreSQL

A demo of how to run Vega with a PostgreSQL backend. This is a fork of [this project](https://github.com/heavyairship/scalable-vega) by @heavyairship, which is a fork of [another project](https://github.com/vega/scalable-vega) by @domoritz.

## Installation
1. Install and start PostgreSQL.
2. Create a PostgreSQL database named `scalable_vega`, e.g., `createdb scalable_vega`
3. Run `cd /path/to/dev/repos`.
4. Run `git clone git@github.com:leibatt/scalable-vega.git`.
5. Run `pip install requirements.txt` to install python dependencies. (Python 3.x is preferable)
6. Run `yarn` to javacript install dependencies.
7. Install Jest (for running Tests): `yarn add --dev jest`. <br>
8. For using prepopulated database, look at additional notes.

## Running Application Server
1. Run `python server.py --CI --db [postgresql/duckdb]` <br>
&nbsp;&nbsp;&nbsp; a. `--CI` refers to the setup for github actions. <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; i. Also if you want to connect to postgres using a password (peer/md5/scram-sha-256 connection), use this flag. <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ii. If you don't want to use a password (trust connection), don't use this flag. <br>
&nbsp;&nbsp;&nbsp; b. `--db` refers to the DBMS currently being used, default is PostgreSQL. For DuckDB, use `--db duckdb`<br>
2. All the config information for the databases and server (including user, password and ports to be used) is currently stored in the `config` folder and can be customized.

## Running the Web Demo
1. Make sure you have the application server running.
2. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`.
3. Run `yarn start` to start the web server.
4. Open a browser tab to localhost:1234.
5. Upload the cars dataset from `./data/cars.json` to the data input.
6. Upload the cars Vega spec from `./Specs/specs/cars_average_transform_successor.json` to the specs input and see the visualization.

## Running Unit Tests
1. Again make sure you have the application server running. 
2. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`. 
3. The Unit Tests assume a prepopulated database, either do so by uploading data using the web demo or use the provided database (look at additional notes).
4. For running the unit tests: <br> 
&nbsp;&nbsp;&nbsp; a. For PostgreSQL, `npm test transform_pg` <br>
&nbsp;&nbsp;&nbsp; b. For DuckDB, `npm test transform_duckdb` <br>

## Additional Notes
1. Prepopulated Database:
&nbsp;&nbsp;&nbsp; a. We have provided prepopulated databases for PostgreSQL and DuckDB in `./data/database/` <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; i. For PostgreSQL, use a command like `psql dbname < infile`. For example, <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `psql postgresql://postgres@localhost/scalable_vega < ./data/database/scalable_vega.pgsql` <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ii. For DuckDB we by default use the prepopulated database. To change the database file being used, make changes in <br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`./config/duckdb.config.json`. <br>
2. If you face `fe_sendauth: no password supplied error` for postgres in server.py, <br>
&nbsp;&nbsp;&nbsp;&nbsp; a. You might have to update the postgresql config to change the authentication methods for local/host connections (change from `scram-sha-256/peer` to `trust` in `pga_conf.hba`)
3. If you face `Cannot find name 'expect'` type error while running tests <br>
&nbsp;&nbsp;&nbsp;&nbsp; a. Run `yarn add @types/jest -D`
