const { BadRequestError } = require("../expressError");



/** 
This function is going to be used to make partial updates to the data in the db in the SET clause 
of the SQL statement.

This function can be used on all update methods for different models
and requires two parameters:

1. The data to be updated an {object} that contains the field to be 
updated and the new value it is being updated to. 
ex.
  dataToUpdate = {dataField1: newValue, dataField2: newValue}

2. The jsToSql parameter is an {object} that maps js style data fields
to the column names in the sql db.

ex.
  jsToSql = {firstName: "first_name", age: "age"}

This function returns an object {setCols, values}

ex sqlForPartialUpdate(
  {firstName: 'Aliya', age: 32}, 
  {firstName: 'first_name', age: "age"}) =>

  {setCols: `"first_name"=$1, "age"=$2`,
   values: ['Aliya', 32]
  }

*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
