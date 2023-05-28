import request from 'supertest';
import mongoose from 'mongoose';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import models from '../../src/models';
import friendRequest from './utils/friendRequest';

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

describe('Friends routes', () => {
  describe('GET /friends', () => {
    it('read all friends', async () => {
      const someFriends = await User.create(randomUser.createUsers(60));
      await Request.create(
        friendRequest.createSendRequests(loggedInUser, someFriends, 'accepted')
      );

      let friends = [];

      let res = await server
        .get('/friends')
        .expect('Content-Type', /json/)
        .expect(200);

      friends = friends.concat(res.body.friends);

      expect(friends.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/friends')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      friends = friends.concat(res.body.friends);

      expect(friends.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/friends')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      friends = friends.concat(res.body.friends);

      expect(friends.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('GET /friends/posts', () => {
    it('read all friends posts', async () => {
      const someFriends = await User.create(randomUser.createUsers(60));

      for (const friend of someFriends) {
        await Post.create(randomPost.createPost(friend._id));
      }

      await Request.create(
        friendRequest.createSendRequests(loggedInUser, someFriends, 'accepted')
      );

      let posts = [];

      let res = await server
        .get('/friends/posts')
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/friends/posts')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/friends/posts')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });
});
