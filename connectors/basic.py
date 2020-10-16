
class BasicConnector:
  def __init__(self,dbmsConfig):
    self.config = dbmsConfig
    self.pool = self.getNewPool()

  def typeFor(self, value,prevType=None):
    '''
    map JavaScript data types to SQL data types
    '''
    # if we have previously seen a float type, then stick with float
    if prevType == "DOUBLE":
      return prevType

    if type(value) == str:
      return "VARCHAR"
    elif type(value) == int:
      return "INTEGER"
    elif type(value) == float:
      return "DOUBLE"
    elif type(value) == bool:
      return "BOOLEAN"
    elif value is None:
      if prevType is not None:
        return prevType
      else:
        raise "cannot determine type of None, and no previous type was observed."
    else:
      raise "undefined mapping for Python type: '"+str(type(value))+"'"

  def generateSchemaFromAllRecords(self,data):
    '''
    create an object that maps property names to SQL data types (basically a
    schema object) using the full dataset, stored in JSON format
    '''
    prevSchema = None
    schema = None
    for record in data:
      schema = self.generateSchema(record,prevSchema)
      prevSchema = schema
    return schema

  def generateSchema(self,dataObj,prevSchema=None):
    '''
    create an object that maps property names to SQL data types (basically a
    schema object) using an example data record in JSON format
    '''
    schema = {}
    for prop in dataObj:
      prevType = prevSchema[prop] if prevSchema is not None else None
      schema[prop] = self.typeFor(dataObj[prop],prevType)
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
