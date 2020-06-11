# Scalable Vega with PostgreSQL

A demo of how to run Vega with a PostgreSQL backend. This is a fork of [this project](https://github.com/heavyairship/scalable-vega) by @heavyairship, which is a fork of [another project](https://github.com/vega/scalable-vega) by @domoritz.

## Installation
1. Install and start PostgreSQL.
2. Create a PostgreSQL database named `scalable_vega`, e.g., `createdb scalable_vega`
3. Run `cd /path/to/dev/repos`.
4. Run `git clone git@github.com:leibatt/scalable-vega.git`.
5. Make sure you have Python 2.7 installed (required by yarn).

## Demo
1. Run `cd scalable-vega`.
2. Run `yarn` to install dependences.
3. Run `yarn start` to start the web server.
4. In another terminal window, run `cd /path/to/dev/repos/scalable-vega`.
5. Run `yarn start:server` to start the application server.
6. Open a browser tab to localhost:1234.
7. Upload the cars dataset from `/path/to/dev/repos/scalable-vega/data/cars.json`.
8. Upload the cars Vega spec from `/path/to/dev/repos/scalable-vega/specs/cars_average_transform_successor.json`.
