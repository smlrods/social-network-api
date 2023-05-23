import request from 'supertest';
import mongoose from 'mongoose';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import friendRequest from './utils/friendRequest';
import models from '../../src/models';
import { faker } from '@faker-js/faker';

const { User, Request, Post } = models;

const app = createServer();
let server = request.agent(app);

beforeAll(async () => {
  await connectDB();
});

let loggedInUser;
beforeEach(async () => {
  server = request.agent(app);

  const user = randomUser.createUserData();

  await server.post('/auth/signup').send(user).expect(201);
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

describe('Users routes', () => {
  describe('GET /users/', () => {
    it('read users - first query', async () => {
      const usersData = await randomUser.createUsers(20);
      const users = await User.create(usersData);

      const res = await server
        .get('/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.users.length).toEqual(20);
    });

    it('read all users - second query and so on', async () => {
      const usersData = await randomUser.createUsers(60);
      const users = await User.create(usersData);

      let usersResult = [];

      let res = await server
        .get('/users')
        .expect('Content-Type', /json/)
        .expect(200);

      usersResult = usersResult.concat(res.body.users);

      expect(usersResult.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/users')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      usersResult = usersResult.concat(res.body.users);

      expect(usersResult.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/users')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      usersResult = usersResult.concat(res.body.users);

      expect(res.body.hasNextPage).toEqual(false);
      expect(usersResult.length).toEqual(60);
    });
  });

  describe('GET /users/:userid', () => {
    it('read a user', async () => {
      const userRandom = randomUser.createUser();

      const user = await User.create(userRandom);

      const res = await server
        .get(`/users/${user._id}`)
        .expect('Content-Type', /json/)
        .expect(200, {
          _id: user._id.toString(),
          __v: user.__v,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image,
        });
    });

    it('non-existent user', async () => {
      await server
        .get(`/users/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('invalid userid', async () => {
      await server
        .get('/users/123/')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /users/:userid/request', () => {
    it('read exist request', async () => {
      const someUser = await User.create(randomUser.createUser());
      const someRequest = await Request.create(
        friendRequest.createRequest(loggedInUser, someUser)
      );

      const res = await server
        .get(`/users/${someUser._id}/request`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toMatchObject({
        user: loggedInUser._id.toString(),
        friend: someUser._id.toString(),
        status: 'pending',
      });
    });

    it('non-existent user', async () => {
      await server
        .get(`/users/${faker.database.mongodbObjectId()}/request`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('invalid userid', async () => {
      await server
        .get(`/users/123/request`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('POST /users/:userid/request', () => {
    it('logged in user creates a request', async () => {
      const someUser = await User.create(randomUser.createUser());

      const res = await server
        .post(`/users/${someUser._id}/request`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toMatchObject({
        user: loggedInUser._id.toString(),
        friend: someUser._id.toString(),
        status: 'pending',
      });
    });

    it('request to a no-exist user', async () => {
      await server
        .post(`/users/${faker.database.mongodbObjectId()}/request`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('invalid userid', async () => {
      await server
        .post(`/users/123/request`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /users/:userid/posts', () => {
    it('read all user posts', async () => {
      const someUser = await User.create(randomUser.createUser());
      let somePosts = randomPost.createPosts(someUser._id, 10);
      somePosts = await Post.create(somePosts);

      const res = await server
        .get(`/users/${someUser._id}/posts`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.length).toEqual(10);
    });

    it('request to a no-exist user', async () => {
      await server
        .get(`/users/${faker.database.mongodbObjectId()}/posts`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('invalid userid', async () => {
      await server
        .get(`/users/123/posts`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /users/:userid/friends/', () => {
    it('read friends of a user', async () => {
      // create a user -> create friends -> create requests
      // create user
      const someUser = await User.create(randomUser.createUser());
      // create friends to requests
      const someFriendsAccepted = await User.create(randomUser.createUsers(10));
      const someFriendsPending = await User.create(randomUser.createUsers(5));

      // create accepted request
      const someRequestsAccepted = friendRequest.createRequests(
        someUser,
        someFriendsAccepted,
        'accepted'
      );

      // create pending request
      const someRequestsPending = friendRequest.createRequests(
        someUser,
        someFriendsPending
      );

      await Request.create(someRequestsAccepted);
      await Request.create(someRequestsPending);

      const res = await server
        .get(`/users/${someUser._id}/friends`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.length).toEqual(10);
    });

    it('read friends of a no-exist user', async () => {
      await server
        .get(`/users/${faker.database.mongodbObjectId()}/friends`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('invalid userid', async () => {
      await server
        .get(`/users/123/friends`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
