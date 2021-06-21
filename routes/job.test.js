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

//   test(" filtering fails when minEmployees > maxEmployees", async function () {
//     const resp = await request(app)
//                        .get("/companies")
//                        .query({ name: "c",
//                                 minEmployees: 3,
//                                 maxEmployees: 2 });
//     expect(resp.statusCode).toBe(400);

//   });

//   test(" filtering fails when wrong data structure is used", async function () {
//     const resp = await request(app)
//                        .get("/companies")
//                        .query({ name: 505,
//                                 minEmployees: 3,
//                                 maxEmployees: 2 });
//     expect(resp.statusCode).toBe(400);

//   });

//   test(" filtering fails if invalid filter key is used", async function () {
//     const resp = await request(app)
//                        .get("/companies")
//                        .query({ ne: "ckism",
//                                 minEmployees: 3,
//                                 maxEmployees: 2 });
//     expect(resp.statusCode).toBe(400);

//   });

//   test("fails: test next() handler", async function () {
//     // there's no normal failure event which will cause this route to fail ---
//     // thus making it hard to test that the error-handler works with it. This
//     // should cause an error, all right :)
//     await db.query("DROP TABLE companies CASCADE");
//     const resp = await request(app)
//         .get("/companies")
//         .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(500);
//   });
});

// /************************************** GET /companies/:handle */

// describe("GET /companies/:handle", function () {
//   test("works for anon", async function () {
//     const resp = await request(app).get(`/companies/c1`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("works for anon: company w/o jobs", async function () {
//     const resp = await request(app).get(`/companies/c2`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     });
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app).get(`/companies/nope`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });

// /************************************** PATCH /companies/:handle */

// describe("PATCH /companies/:handle", function () {
//   test("works for admins", async function () {
//     const resp = await request(app)
//         .patch(`/companies/c1`)
//         .send({
//           name: "C1-new",
//         })
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1-new",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("unauth for non admins", async function () {
//     const resp = await request(app)
//         .patch(`/companies/c1`)
//         .send({
//           name: "C1-new",
//         })
//         .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//         .patch(`/companies/c1`)
//         .send({
//           name: "C1-new",
//         });
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found on no such company", async function () {
//     const resp = await request(app)
//         .patch(`/companies/nope`)
//         .send({
//           name: "new nope",
//         })
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request on handle change attempt", async function () {
//     const resp = await request(app)
//         .patch(`/companies/c1`)
//         .send({
//           handle: "c1-new",
//         })
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });

//   test("bad request on invalid data", async function () {
//     const resp = await request(app)
//         .patch(`/companies/c1`)
//         .send({
//           logoUrl: "not-a-url",
//         })
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

// /************************************** DELETE /companies/:handle */

// describe("DELETE /companies/:handle", function () {
//   test("works for admins", async function () {
//     const resp = await request(app)
//         .delete(`/companies/c1`)
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual({ deleted: "c1" });
//   });

//   test("unauth for non admins", async function () {
//     const resp = await request(app)
//         .delete(`/companies/c1`)
//         .set("authorization", `Bearer ${u2Token}`);
//     expect(resp.statusCode).toBe(401);
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//         .delete(`/companies/c1`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app)
//         .delete(`/companies/nope`)
//         .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });