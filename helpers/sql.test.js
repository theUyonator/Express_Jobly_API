"use strict";

process.env.NODE_ENV = "test";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

// beforeEach(function (){
//     let data = {
//         firstName: 'Test',
//         age: 34,
//         isTall: true
//     };

//     let jsToSql = {
//         firstName: 'first_name',
//         isTall: 'is_tall'
//     }
// })

describe("get accurate setCols and Values", function () {

  let expected;

  test("works", function() {
    
    let data = {
        firstName: 'Test',
        age: 34,
        isTall: true
    };

    let jsToSql = {
        firstName: 'first_name',
        isTall: 'is_tall'
    }

    const res = sqlForPartialUpdate(data, jsToSql);

    expected = {
        setCols : `"first_name"=$1, "age"=$2, "is_tall"=$3`,
        values: ['Test', 34, true]
    }
    expect(res).toEqual(expected);
  });

  test("fails if no data", function () {
      let data = {};
      let jsToSql = {
        firstName: 'first_name',
        isTall: 'is_tall'
     };

    try {
      sqlForPartialUpdate(data, jsToSql);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

  })
})