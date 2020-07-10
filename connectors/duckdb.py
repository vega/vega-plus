from .basic import BasicConnector
import duckdb
import json

class DuckDBConnector(BasicConnector):
  def checkTableExists(self,tableName):
    try:
      self.executeQueryNoResults("select * from "+tableName.lower()+" limit 1;")
      return True
    except Exception as e:
      return False

  def executeQuery(self,query):
    conn = duckdb.connect(self.config['dbFilename'])
    cursor = conn.cursor()
    print("connected to %s" % (self.config['dbFilename']))
    print("running query: '%s'" % (query))
    cursor.execute(query)
    raw = cursor.fetchdf()
    results = json.loads(raw.to_json(orient="records"))
    conn.commit()
    conn.close()
    return results

  def executeQueryNoResults(self,query):
    conn = duckdb.connect(self.config['dbFilename'])
    cursor = conn.cursor()
    print("connected to %s" % (self.config['dbFilename']))
    print("running query: '%s'" % (query));
    cursor.execute(query)
    conn.commit()
    conn.close()

  def executeQueriesNoResults(self,queries):
    conn = duckdb.connect(self.config['dbFilename'])
    cursor = conn.cursor()
    print("connected to %s" % (self.config['dbFilename']))
    for query in queries:
      print("running query: '%s'" % (query));
      cursor.execute(query)
    conn.commit()
    conn.close()

