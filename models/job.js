"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company is not in the database.
   * 
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(
        `SELECT handle
         FROM companies
         WHERE handle = $1`,
      [companyHandle]);

  if (!companyCheck.rows[0])
    throw new BadRequestError(`Company ${companyHandle} does not exist.`);

    const duplicateCheck = await db.query(
          `SELECT id, title
           FROM jobs
           WHERE company_handle = $1 AND title = $2`,
        [companyHandle, title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * This method accepts an optional searchFilters object which allows for 
   * the use of optional filtering criteria to filter jobs retrieved.
   * 
   * The three optional filtering criteria include:
   * 
   * title: filter by job title. Like before, this should be case-insensitive, 
   * matches-any-part-of-string search.
   * 
   * minSalary: filter to jobs with at least that salary.
   * 
   * hasEquity: if true, filter to jobs that provide a non-zero amount of equity.
   *  If false or not included in the filtering, list all jobs regardless of equity.
   * 
   * Returns [{id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(searchFilters = {}) {

    // First we define a generic query to find all jobs, an empty array to
    // hold the WHERE CLAUSES and an empty array to hold the query values.

    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs AS j
                 LEFT JOIN companies AS c
                 ON c.handle = j.company_handle `;

    let whereClauses = [];
    let queryVals = [];

    // Then we destructure the filteration criteria from the searchFilters parameter 

    const { title, minSalary, hasEquity } = searchFilters;

    // For each of the possible filteration criteria, create the correct WHERE CLAUSE 
    // and query value and push these into their respective arrays to enable use make the 
    // appropriate query.

    if(title !== undefined){
      queryVals.push(`%${title}%`);
      whereClauses.push(`title ILIKE $${queryVals.length}`);
    }

    if(minSalary !== undefined){
      queryVals.push(minSalary);
      whereClauses.push(`salary >= $${queryVals.length}`);
    }

    if(hasEquity === true){
      queryVals.push(0);
      whereClauses.push(`equity > $${queryVals.length}`);
    }

    // Check to see if there are any where clauses in the array and if any exists,
    // add a where clause to the query 

    if(whereClauses.length > 0){
      query += " WHERE " + whereClauses.join(" AND ");
    }

    // To finalize the query we order by job title and use the query var to retrieve 
    // appropraite jobs from our db.

    query += " ORDER BY title ";

    const jobs = await db.query(query, queryVals);

    return jobs.rows;

  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, company}
   * 
   * Where company is {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    if (!jobRes.rows[0]) throw new NotFoundError(`Job ${id} does not exist`);

    const { title, salary, equity,companyHandle } = jobRes.rows[0];

    const companyRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
            FROM companies 
            WHERE handle = $1`, [companyHandle]);
    
    const company = companyRes.rows[0];

    const job = {id, title, salary, equity, company}

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    if(!data) throw new BadRequestError(`Please add valid data to be updated`);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job ${id} does not exist`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job ${id} does not exist`);
  }
}


module.exports = Job;
