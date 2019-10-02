# Scalable Vega with Postgres

A demo of how to run Vega with a Postgres backend.

## Installation
1. Install and start Postgres
2. Create a Postgres database named `scalable_vega`
3. Run `cd /path/to/dev/repos`
4. Run `git clone git@github.com:heavyairship/scalable-vega.git`
5. Make sure you have Python 2.7 installed (required by yarn)

## Demo
1. Run `cd scalable-vega`
2. Run `npm install` to install dependences
3. Run `yarn start` to start the web server
4. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`
5. Run `yarn start:server` to start the application server
6. Open a browser tab to localhost:1234
7. Upload the cars dataset from `/path/to/dev/repos/scalable-vega/data/cars.json`
8. Upload the cars Vega spec from `/path/to/dev/repos/scalable-vega/specs/cars.json`
