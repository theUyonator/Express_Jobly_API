"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
   title: "newJob",
   salary: 600,
   equity: "0.7",
   companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    console.log(resp);
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      job: {
          ...newJob,
         id: expect.any(Number),
        }
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing required data companyHandle", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "newJob",
          salary: 900,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "newJob",
            salary: "three hundred thousand",
            equity: "point 2",
            companyHandle: "c1",
          
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    // console.log(testJobIds);
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
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
                salary: 400,
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
            },
          ],
    });

    
  });

  test("filtering works", async function () {
    const resp = await request(app).get("/jobs").query({ minSalary: 300 });
    expect(resp.body).toEqual({
      jobs:
          [
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
                salary: 400,
                equity: "0",
                companyHandle: "c2",
                companyName: "C2",
            },
          ],
    });

    
  });

  test("filtering works with all three criteria", async function () {
    const resp = await request(app)
                       .get("/jobs")
                       .query({ title: "Job",
                                minSalary: 300,
                                hasEquity: true});
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 300,
                equity: "0.5",
                companyHandle: "c1",
                companyName: "C1",
            },
          ],
    });

    
  });

  test(" filtering fails when wrong data structure is used", async function () {
    const resp = await request(app)
                       .get("/jobs")
                       .query({ title: "newJob",
                                minSalary: "three hundred",
                                hasEquity: true });
    expect(resp.statusCode).toBe(400);

  });

  test(" filtering fails if invalid filter key is used", async function () {
    const resp = await request(app)
                       .get("/jobs")
                       .query({ tt: "ckism",
                                minSalary: 3000,
                                hasEquity: true });
    expect(resp.statusCode).toBe(400);

  });

  test(" filtering returns all jobs if hasEquity = false", async function () {
    const resp = await request(app)
                       .get("/jobs")
                       .query({ hasEquity: false });
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 100,
                equity: "0.1",
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
                salary: 400,
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
            },
          ],
    });

  });


});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        company: {
            handle: "c1",
            name: "C1",
            numEmployees: 1,
            description: "Desc1",
            logoUrl: "http://c1.img",
        }
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/${900000}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "newJob",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "newJob",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[1]}`)
        .send({
          title: "newJob2",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "newJob",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/58960`)
        .send({
          title: "newJob",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          id: 400,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          companyHandle: "cp3",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          equity: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: testJobIds[0] });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/30000`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});