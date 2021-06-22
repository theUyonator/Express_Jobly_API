"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * This method accepts an optional searchFilters object which allows for 
   * the use of optional filtering criteria to filter companies retrieved.
   * 
   * The three optional filtering criteria include:
   * 
   * name: filter by company name: if the string “net” is passed in, this should 
   * find any company who name contains the word “net”, case-insensitive 
   * (so “Study Networks” should be included).
   * 
   * minEmployees: filter to companies that have at least that number of employees.
   * 
   * maxEmployees: filter to companies that have no more than that number of employees.
   * 
   * If the minEmployees parameter is greater than the maxEmployees parameter, 
   * respond with a 400 error with an appropriate message.
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(searchFilters = {}) {

    // First we define a generic query to find all companies, an empty array to
    // hold the WHERE CLAUSES and an empty array to hold the query values.

    let query = `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                 FROM companies`;

    let whereClauses = [];
    let queryVals = [];

    // Then we destructure the filteration criteria from the searchFilters parameter 

    const { name, minEmployees, maxEmployees } = searchFilters;

    // If minEmployees > maxEmployees, throw BadRequest error 

    if(minEmployees > maxEmployees){
      throw new BadRequestError("Min employees cannot be greater than max employees.")
    }

    // For each of the possible filteration criteria, create the correct WHERE CLAUSE 
    // and query value and push these into their respective arrays to enable use make the 
    // appropriate query.

    if(name !== undefined){
      queryVals.push(`%${name}%`);
      whereClauses.push(`name ILIKE $${queryVals.length}`);
    }

    if(minEmployees !== undefined){
      queryVals.push(minEmployees);
      whereClauses.push(`num_employees >= $${queryVals.length}`);
    }

    if(maxEmployees !== undefined){
      queryVals.push(maxEmployees);
      whereClauses.push(`num_employees <= $${queryVals.length}`);
    }

    // Check to see if there are any where clauses in the array and if any exists,
    // add a where clause to the query 

    if(whereClauses.length > 0){
      query += " WHERE " + whereClauses.join(" AND ");
    }

    // To finalize the query we order by company name and use the query var to retrieve 
    // appropraite companies from our db.

    query += " ORDER BY name ";

    const companies = await db.query(query, queryVals);

    return companies.rows;

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobs = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity
              FROM jobs
              WHERE company_handle = $1
              ORDER BY id`, [handle]);

    company.jobs = jobs.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
