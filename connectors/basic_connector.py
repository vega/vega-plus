
class BasicConnector:
  def __init__(self,dbmsConfig):
    self.config = dbmsConfig
    self.pool = self.getNewPool()

  def typeFor(self, value):
    '''
    map JavaScript data types to SQL data types
    '''
    if type(value) == str:
      return "VARCHAR"
    elif type(value) == int:
      return "INTEGER"
    elif type(value) == float:
      return "DOUBLE"
    elif type(value) == bool:
      return "BOOLEAN"
    else:
      raise "undefined mapping for Python type: '"+str(type(value))+"'"

  def generateSchema(self,dataObj):
    '''
    create an object that maps property names to SQL data types (basically a
    schema object) using an example data record in JSON format
    '''
    schema = {}
    for prop in dataObj:
      schema[prop] = self.typeFor(dataObj[prop])
    return schema

  def generateCreateTableQuery(self, tableName, schema):
    '''
    given a table name and a schema object, make a corresponding "CREATE
    TABLE" SQL query
    '''
    out = 'create table ' + tableName + '('
    first = True
    for attrName in schema:
      attrType = schema[attrName]
      if first:
        first = False
      else:
        out += ', '
      out += (attrName + ' ' + attrType)
    out += ')'
    return out

  # override in child class
  def checkTableExists(self,tableName):
    return None

  # override in child class
  def getNewPool(self):
    return None

  # override in child class
  def executeQuery(self,query):
    return None

  # override in child class
  def executeQueryNoResults(self,query):
    pass

  # override in child class
  def executeQueriesNoResults(self,queries):
    pass
