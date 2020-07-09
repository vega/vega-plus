from .basic_connector import BasicConnector
import psycopg2
import psycopg2.extras
import psycopg2.pool

class PostgresqlConnector(BasicConnector):
  def getNewPool(self):
    pool = None
    if "port" in self.dbmsConfig:
      pool = psycopg2.pool.ThreadedConnectionPool(1,self.dbmsConfig["totalConnections"],port=self.dbmsConfig["port"],database=self.dbmsConfig["dbname"],host=self.dbmsConfig["host"])
    else:
      pool = psycopg2.pool.ThreadedConnectionPool(1,self.dbmsConfig["totalConnections"],database=self.dbmsConfig["dbname"],host=self.dbmsConfig["host"])
    return pool

  def executeQuery(self,query):
    conn = self.pool.getconn()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    print("connected to %s" % (self.connectionName));
    print("running query: '%s'" % (query));
    cursor.execute(query)
    raw = cursor.fetchall()
    results = []
    for row in raw:
      results.append(dict(row))
    self.pool.putconn(conn)
    return results

  def executeQueryNoResults(self,query):
    conn = self.pool.getconn()
    cursor = conn.cursor()
    print("connected to %s" % (self.connectionName));
    print("running query: '%s'" % (query));
    cursor.execute(query)
    conn.commit()
    self.pool.putconn(conn)

  def executeQueriesNoResults(self,queries):
    conn = self.pool.getconn()
    cursor = conn.cursor()
    print("connected to %s" % (self.connectionName));
    for query in queries:
      print("running query: '%s'" % (query));
      cursor.execute(query)
    conn.commit()
    self.pool.putconn(conn)

