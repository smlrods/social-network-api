import request from 'supertest';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import friendRequest from './utils/friendRequest';
import postLike from './utils/postLike';
import models from '../../src/models';
import randomComment from './utils/randomComment';

const { User, Request } = models;

const app = createServer();
let server = request.agent(app);

beforeAll(async () => {
  await connectDB();
});

let loggedInUser;
beforeEach(async () => {
  server = request.agent(app);

  const user = randomUser.createUserData();

  const res = await server.post('/auth/signup').send(user).expect(201);

  loggedInUser = await User.findOne({ username: user.username }).exec();

  await server
    .post('/auth/login')
    .send({
      username: user.username,
      password: user.password,
    })
    .expect(302);
});

afterAll(async () => {
  await dropDB();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Requests routes', () => {
  describe('GET /requests', () => {
    it('read requests', async () => {
      const someUsers = await User.create(randomUser.createUsers(60));
      await Request.create(
        friendRequest.createRequests(loggedInUser, someUsers)
      );

      let requests = [];
      let res = await server
        .get('/requests')
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/requests')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/requests')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('PUT /requests/:requestid', () => {
    it('update status of a request to accepted', async () => {
      const someUser = await User.create(randomUser.createUser());
      const someRequest = await Request.create(
        friendRequest.createRequest(someUser, loggedInUser)
      );

      const res = await server
        .put(`/requests/${someRequest._id}`)
        .send({ status: 'accepted' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.request).toMatchObject({
        user: someUser._id.toString(),
        friend: loggedInUser._id.toString(),
        status: 'accepted',
      });
    });

    it('update status of a request to refused', async () => {
      const someUser = await User.create(randomUser.createUser());
      const someRequest = await Request.create(
        friendRequest.createRequest(someUser, loggedInUser)
      );

      const res = await server
        .put(`/requests/${someRequest._id}`)
        .send({ status: 'refused' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.request).toMatchObject({
        user: someUser._id.toString(),
        friend: loggedInUser._id.toString(),
        status: 'refused',
      });
    });

    it('try to update the status of a request of a non-exist request', async () => {
      await server
        .put(`/requests/${faker.database.mongodbObjectId()}`)
        .send({ status: 'refused' })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to update the status of a request with a no-valid requestid', async () => {
      await server
        .put('/requests/123')
        .send({ status: 'refused' })
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /requests/sent', () => {
    it('read all sent requests', async () => {
      const someUsers = await User.create(randomUser.createUsers(60));
      await Request.create(
        friendRequest.createSendRequests(loggedInUser, someUsers)
      );

      let requests = [];

      let res = await server
        .get('/requests/sent')
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/requests/sent')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/requests/sent')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      requests = requests.concat(res.body.requests);

      expect(requests.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('DELETE /requests/sent/:requestid', () => {
    it('delete a request successfully', async () => {
      const someUser = await User.create(randomUser.createUser());
      const someRequest = await Request.create(
        friendRequest.createRequest(loggedInUser, someUser)
      );

      await server
        .delete(`/requests/sent/${someRequest._id}`)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('try delete a request that does not exist', async () => {
      await server
        .delete(`/requests/sent/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try delete a request with a invalid requestid', async () => {
      await server
        .delete(`/requests/sent/123`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
