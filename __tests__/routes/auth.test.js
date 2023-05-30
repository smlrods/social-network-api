import request from 'supertest';
import mongoose from 'mongoose';
import { connectDB, dropDB, dropCollections } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import models from '../../src/models';

const { User } = models;

const app = createServer();
let server = request.agent(app);

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  server = request.agent(app);
});

afterAll(async () => {
  await dropDB();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('Auth Routes', () => {
  describe('POST /auth/signup', () => {
    it('field empty', async () => {
      const user = randomUser.createUserData();
      user.username = '';

      const res = await server.post('/auth/signup').send(user).expect(400);
    });

    it('user created successfully', async () => {
      const user = randomUser.createUserData();

      await server.post('/auth/signup').send(user).expect(201);
    });

    // user already exists
    it('user already exists', async () => {
      const user = randomUser.createUser();
      await User.create(user);
      const anotherUser = randomUser.createUserData();
      anotherUser.username = user.username;

      await server.post('/auth/signup').send(anotherUser).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('login success', async () => {
      // arrange
      const user = randomUser.createUserData();
      await server.post('/auth/signup/').send(user).expect(201);

      // act
      await server
        .post('/auth/login')
        .send({
          username: user.username,
          password: user.password,
        })
        // assert
        .expect(302);
    });

    it('login with wrong password', async () => {
      const user = randomUser.createUserData();
      await server.post('/auth/signup/').send(user).expect(201);
      user.password = 'wrong password';

      await server
        .post('/auth/login')
        .send({
          username: user.username,
          password: user.password,
        })
        .expect(401);
    });

    it('login with no-exist user', async () => {
      const user = randomUser.createUserData();

      await server
        .post('/auth/login')
        .send({
          username: user.username,
          password: user.password,
        })
        .expect(401);
    });
  });

  describe('GET /auth/login', () => {
    it('get logged-in user data', async () => {
      const user = randomUser.createUserData();
      await server.post('/auth/signup/').send(user).expect(201);

      await server
        .post('/auth/login')
        .send({
          username: user.username,
          password: user.password,
        })
        .expect(302);

      const res = await server
        .get('/auth/login')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.user).toMatchObject({
        username: user.username,
        profile_image: user.profile_image,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    });
  });
});
