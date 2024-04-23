import supertest from "supertest";
import { app } from "../../src/app";
import { sequelize, Candidate } from "../../src/models";
import { CandidateInstance } from "../../src/models/candidate";
import { candidateFactory } from "../../src/models/factories/candidate";

describe("Candidates endpoints", () => {
  let candidates: CandidateInstance[];

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    candidates = await Candidate.bulkCreate(candidateFactory.buildList(5));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should return all candidates on database", async () => {
    const response = await supertest(app).get("/candidates");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
  });

  it("should create a single candidate when given valid properties", async () => {
    const newCandidate = candidateFactory.build();

    const { body, statusCode } = await supertest(app)
      .post("/candidates")
      .send(newCandidate);

    expect(statusCode).toBe(201);
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(newCandidate.name);
    expect(body.bio).toBe(newCandidate.bio);
    expect(body.email).toBe(newCandidate.email);
    expect(body.phone).toBe(newCandidate.phone);
    expect(body.openToWork).toBe(newCandidate.openToWork);
    expect(body).toHaveProperty("createdAt");
    expect(body).toHaveProperty("updatedAt");
  });

  it("should not create a candidate without a name", async () => {
    const { body, statusCode } = await supertest(app).post("/candidates").send({
      bio: "Top scarer",
      email: "sully@email.com",
      phone: "555-5555",
    });

    expect(statusCode).toBe(400);
    expect(body.message).toBeDefined();
  });

  it("should not create a candidate without an email", async () => {
    const { body, statusCode } = await supertest(app).post("/candidates").send({
      name: "James P. Sullivan",
      bio: "Top scarer",
      phone: "555-5555",
    });

    expect(statusCode).toBe(400);
    expect(body.message).toBeDefined();
  });

  it("should not create a candidate with an already registered email", async () => {
    const newCandidate = candidateFactory.build();
    newCandidate.email = candidates[0].email;

    const { body, statusCode } = await supertest(app)
      .post("/candidates")
      .send(newCandidate);

    expect(statusCode).toBe(400);
    expect(body.message).toBeDefined();
  });

  it("should return a specific candidate when given a valid candidateId", async () => {
    const { body, statusCode } = await supertest(app).get(
      `/candidates/${candidates[0].id}`
    );

    expect(statusCode).toBe(200);
    expect(body.id).toBe(candidates[0].id);
    expect(body.name).toBe(candidates[0].name);
    expect(body.bio).toBe(candidates[0].bio);
    expect(body.email).toBe(candidates[0].email);
    expect(body.phone).toBe(candidates[0].phone);
  });

  it("should update a specific candidate when given a valid candidateId", async () => {
    const { body, statusCode } = await supertest(app)
      .put(`/candidates/${candidates[0].id}`)
      .send({
        name: "James P. Sullivan",
        email: "sully@email.com",
      });

    expect(statusCode).toBe(200);
    expect(body.name).toBe("James P. Sullivan");
    expect(body.bio).toBe(candidates[0].bio);
    expect(body.email).toBe("sully@email.com");
    expect(body.phone).toBe(candidates[0].phone);
  });

  it("should return 404 when trying to update an unexisting candidate", async () => {
    const unexistingId = candidates[candidates.length - 1].id + 1;
    const { body, statusCode } = await supertest(app)
      .put(`/candidates/${unexistingId}`)
      .send({
        name: "James P. Sullivan",
        email: "sully@email.com",
      });

    expect(statusCode).toBe(404);
    expect(body.message).toBe("Candidato não encontrado");
  });

  it("should delete a specific candidate when given a valid candidateId", async () => {
    const { body, statusCode } = await supertest(app).delete(
      `/candidates/${candidates[0].id}`
    );

    const deletedCandidate = await Candidate.findByPk(candidates[0].id);

    expect(statusCode).toBe(204);
    expect(body).toEqual({});
    expect(deletedCandidate).toBeNull();
  });
});
