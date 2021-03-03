from .basic import BasicConnector
import psycopg2
import psycopg2.extras
import psycopg2.pool

class PostgresqlConnector(BasicConnector):
  def checkTableExists(self,tableName):
    # Check if table exists yet
    existsQueryStr = "select exists(select 1 from information_schema.tables where table_name=" + "'" + tableName.lower() + "');"
    response = self.executeQuery(existsQueryStr)
    return response[0]["exists"]

  def getNewPool(self):
    pool = None
    if "port" in self.config:
      if self.config["CI"]:
        pool = psycopg2.pool.ThreadedConnectionPool(1,self.config["totalConnections"],port=self.config["port"],database=self.config["dbname"],host=self.config["host"],user=self.config["user"],password=self.config["password"])
      else:
        pool = psycopg2.pool.ThreadedConnectionPool(1,self.config["totalConnections"],port=self.config["port"],database=self.config["dbname"],host=self.config["host"])
    else:
      if self.config["CI"]:
        pool = psycopg2.pool.ThreadedConnectionPool(1,self.config["totalConnections"],database=self.config["dbname"],host=self.config["host"],user=self.config["user"],password=self.config["password"])
      else:
        pool = psycopg2.pool.ThreadedConnectionPool(1,self.config["totalConnections"],database=self.config["dbname"],host=self.config["host"])
    return pool

  def executeQuery(self,query):
    conn = self.pool.getconn()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    print("connected to PostgreSQL via %s/%s:%d" % (self.config["host"],self.config["dbname"],self.config["port"] if "port" in self.config else 5432))
    print("running query: '%s'" % (query))
    cursor.execute(query)
    raw = cursor.fetchall()
    results = []
    for row in raw:
      results.append(dict(row))
    conn.commit()
    self.pool.putconn(conn)
    return results

  def executeQueryNoResults(self,query):
    conn = self.pool.getconn()
    cursor = conn.cursor()
    print("connected to PostgreSQL via %s/%s:%d" % (self.config["host"],self.config["dbname"],self.config["port"] if "port" in self.config else 5432))
    print("running query: '%s'" % (query));
    cursor.execute(query)
    conn.commit()
    self.pool.putconn(conn)

  def executeQueriesNoResults(self,queries):
    conn = self.pool.getconn()
    cursor = conn.cursor()
    print("connected to PostgreSQL via %s/%s:%d" % (self.config["host"],self.config["dbname"],self.config["port"] if "port" in self.config else 5432))
    for query in queries:
      print("running query: '%s'" % (query));
      cursor.execute(query)
    conn.commit()
    self.pool.putconn(conn)

