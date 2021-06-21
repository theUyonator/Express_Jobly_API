"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 400,
    equity: "0.03",
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        ...newJob,
        id: expect.any(Number)});

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 400,
        equity: "0.03",
        companyHandle: 'c1',
      },
    ]);
  });

  test("bad request with invalid company_handle", async function () {
    try {
      await Job.create({
        title: "new",
        salary: 400,
        equity: "0.03",
        company_handle: 'nope',
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "1.0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[1],
        title: "Job2",
        salary: 300,
        equity: "0.5",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[2],
        title: "Job3",
        salary: 390,
        equity: "0",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: testJobIds[3],
        title: "Job4",
        salary: null,
        equity: null,
        companyHandle: "c3",
        companyName: "C3",
      }
    ]);
  });

  test("works w/ filter: only title", async function () {
    let jobs = await Job.findAll({title: "Job1"});
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "1.0",
        companyHandle: "c1",
        companyName: "C1",
      }
    ]);
  });

  test("works w/ filter: only minSalary", async function () {
    let jobs = await Job.findAll({minSalary: 300});
    expect(jobs).toEqual([
        {
            id: testJobIds[1],
            title: "Job2",
            salary: 300,
            equity: "0.5",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: testJobIds[2],
            title: "Job3",
            salary: 390,
            equity: "0",
            companyHandle: "c2",
            companyName: "C2",
          },
    ]);
  });

  test("works w/ filter: only hasEquity of true", async function () {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs).toEqual([
        {
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "1.0",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: testJobIds[1],
            title: "Job2",
            salary: 300,
            equity: "0.5",
            companyHandle: "c1",
            companyName: "C1",
          },
    ]);
  });

  test("works w/ filter: only hasEquity of false (returns all jobs)", async function () {
    let jobs = await Job.findAll({hasEquity: false});
    expect(jobs).toEqual([
        {
            id: testJobIds[0],
            title: "Job1",
            salary: 100,
            equity: "1.0",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: testJobIds[1],
            title: "Job2",
            salary: 300,
            equity: "0.5",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: testJobIds[2],
            title: "Job3",
            salary: 390,
            equity: "0",
            companyHandle: "c2",
            companyName: "C2",
          },
          {
            id: testJobIds[3],
            title: "Job4",
            salary: null,
            equity: null,
            companyHandle: "c3",
            companyName: "C3",
          }
    ]);
  });

  test("works w/ filter: a combination of all 3 filteration criteria", async function () {
    let jobs = await Job.findAll({title: "job", minSalary: 300, hasEquity: true});
    expect(jobs).toEqual([
        {
            id: testJobIds[1],
            title: "Job2",
            salary: 300,
            equity: "0.5",
            companyHandle: "c1",
            companyName: "C1",
          },
    ]);
  });

});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobIds[0]);
    // console.log(job);
    expect(job).toEqual({
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "1.0",
        company:{
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
      });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(10000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "newJob",
    salary: 1000,
    equity: "0.2",
  };

  test("works", async function () {
    let job = await Job.update(testJobIds[0], updateData);
    expect(job).toEqual({
      id: testJobIds[0],
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testJobIds[0]}`);
    expect(result.rows).toEqual([{
      id: testJobIds[0],
        title: "newJob",
        salary: 1000,
        equity: "0.2",
        company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "newJob",
      salary: null,
      equity: null,
    };

    let job = await Job.update(testJobIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: testJobIds[0],
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testJobIds[0]}`);
    expect(result.rows).toEqual([{
      id: testJobIds[0],
      title: "newJob",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(1000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${testJobIds[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(1000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
