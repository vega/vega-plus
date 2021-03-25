var duckdb = require('duckdb');
var db = new duckdb.Database('./data/database/scalable-vega.db');
db.all('SELECT 42 AS fortytwo', function (err, res) {
    if (err) {
        throw err;
    }
    console.log(res[0].fortytwo);
});
var con = db.connect();
var test_cases = ['cars', 'flights_20k', 'horizon_graph', 'normal_2d', 'pie_chart'];
var i;
for (i = 0; i < test_cases.length; i++) {
    var data_name = test_cases[i];
    var temp = 'CREATE TABLE ' + data_name + ' AS SELECT * FROM read_csv_auto (' + '\'' + './data/csv_files/' + data_name + '.csv' + '\'' + ')';
    con.run(temp);
}
con.all('SELECT cylinders,MIN(miles_per_gallon) as miles_per_gallon FROM cars GROUP BY cylinders', function (err, res) {
    if (err) {
        throw err;
    }
    console.log(res);
});
