import { Duck_Db } from './src/duck_db'
import { Postgres_Db } from './src/postgres_db'
import { run_server } from './src/server'

export{Duck_Db, Postgres_Db, run_server}

var myArgs = process.argv;
if (myArgs.length > 2 && myArgs[2] == 'pg') {
	run_server('pg')
}
else{
    run_server('duckdb')
}