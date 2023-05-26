import request from 'supertest';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import postLike from './utils/postLike';
import models from '../../src/models';

const { User, Post, Like } = models;

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

describe('Likes routes', () => {
  describe('GET /likes', () => {
    it('read logged-in user likes', async () => {
      // create users
      const someUsers = await User.create(randomUser.createUsers(60));

      let somePosts = [];

      // create posts
      for (const user of someUsers) {
        somePosts = somePosts.concat(
          await Post.create(randomPost.createPost(user._id))
        );
      }

      // create likes
      for (const post of somePosts) {
        await Like.create(postLike.createLike(post._id, loggedInUser._id));
      }

      let likes = [];

      let res = await server
        .get('/likes')
        .expect('Content-Type', /json/)
        .expect(200);

      likes = likes.concat(res.body.likes);

      expect(likes.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/likes')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      likes = likes.concat(res.body.likes);

      expect(likes.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/likes')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      likes = likes.concat(res.body.likes);

      expect(likes.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('DELETE /likes/:likeid', () => {
    it('delete a logged-in user like sucessfully', async () => {
      const someUser = await User.create(randomUser.createUser());
      const somePost = await Post.create(randomPost.createPost(someUser._id));
      const someLike = await Like.create(
        postLike.createLike(somePost._id, loggedInUser._id)
      );

      await server
        .delete(`/likes/${someLike._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(await Like.findById(someLike._id).exec()).toEqual(null);
    });

    it('try to delete a like of another user', async () => {
      const someUser = await User.create(randomUser.createUser());
      const anotherUser = await User.create(randomUser.createUser());
      const somePost = await Post.create(randomPost.createPost(someUser._id));
      const someLike = await Like.create(
        postLike.createLike(somePost._id, anotherUser._id)
      );

      await server
        .delete(`/likes/${someLike._id}`)
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('try to delete a like that does not exist', async () => {
      await server
        .delete(`/likes/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to delete a like with a invalid likeid', async () => {
      await server
        .delete('/likes/123')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
