# Scalable Vega with Postgres

A demo of how to run Vega with a Postgres backend.

## Installation
1. Install and start Postgres
2. Create a Postgres database named `scalable_vega`
3. Run `cd /path/to/dev/repos`
4. Run `git clone git@github.com:heavyairship/scalable-vega.git`

## Demo
1. Run `cd scalable-vega`
2. Run `yarn start` to start the web server
3. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`
4. Run `yarn start:server` to start the application server
5. Open a browser tab to localhost:1234
6. Upload the cars dataset from `/path/to/dev/repos/scalable-vega/data/cars.json`
7. Upload the cars Vega spec from `/path/to/dev/repos/scalable-vega/specs/cars.json`
