# Scalable Vega with PostgreSQL

A demo of how to run Vega with a PostgreSQL backend. This is a fork of [this project](https://github.com/heavyairship/scalable-vega) by @heavyairship, which is a fork of [another project](https://github.com/vega/scalable-vega) by @domoritz.

## Installation
1. Install and start PostgreSQL.
2. Create a PostgreSQL database named `scalable_vega`, e.g., `createdb scalable_vega`
3. Run `cd /path/to/dev/repos`.
4. Run `git clone git@github.com:leibatt/scalable-vega.git`.
5. Run `git clone https://github.com/leibatt/vega-transform-pg.git`
6. Yarn link vega-transform-pg in scalable vega (https://classic.yarnpkg.com/en/docs/cli/link/) <br>
&nbsp;&nbsp;&nbsp;&nbsp; a. `cd vega-transform-pg` <br>
&nbsp;&nbsp;&nbsp;&nbsp; b. `yarn link` <br>
&nbsp;&nbsp;&nbsp;&nbsp; c. `cd ../scalable-vega` <br>
&nbsp;&nbsp;&nbsp;&nbsp; d. `yarn link vega-transform-pg` <br> 
7. Install Jest (for running Tests): `yarn add --dev jest`

## Demo
1. Run `cd scalable-vega`.
2. Run `yarn` to install dependences.
3. Run `pip install requirements.txt`
4. Run `python server.py server.config.json postgresql.config.json` to start the application server. (For Postgres)
&nbsp;&nbsp;&nbsp;&nbsp; a. To run DuckDB instead of Postgres, set "dbms-config" in `server.config.json` to "duckdb.config.json" and run `python server.py server.config.json duckdb.config.json` <br>
5. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`.
6. Run `yarn start` to start the web server.
7. Open a browser tab to localhost:1234.
8. Upload the cars dataset from `/path/to/dev/repos/scalable-vega/data/cars.json`.
9. Upload the cars Vega spec from `/path/to/dev/repos/scalable-vega/specs/cars_average_transform_successor.json`.

## Unit Tests (Only do it after Installation and Demo)
1. Close down web and application server. 
2. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`. 
3. Switch to the tests branch by running: <br> 
&nbsp;&nbsp;&nbsp;&nbsp; a. `git checkout tests` <br>
&nbsp;&nbsp;&nbsp;&nbsp; b. `git pull` <br>
&nbsp;&nbsp;&nbsp;&nbsp; b. In case you come across conflicts just do `git reset --hard origin/tests` <br>
4. Follow Steps 1-4 from Demo
5. Run `jest` or `npm test`

## Additional Notes
1. If you face `fe_sendauth: no password supplied error` for postgres in server.py, <br>
&nbsp;&nbsp;&nbsp;&nbsp; a. You might have to update the postgresql config to change the authentication methods for local/host connections (change from scram-sha-256/peer to trust)
