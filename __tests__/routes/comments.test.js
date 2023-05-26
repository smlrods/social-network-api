import request from 'supertest';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import models from '../../src/models';
import randomComment from './utils/randomComment';

const { User, Post, Comment } = models;

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

describe('Comments routes', () => {
  describe('GET /comments', () => {
    it('read logged-in user comments', async () => {
      // create users
      const someUsers = await User.create(randomUser.createUsers(3));

      let somePosts = [];

      // create posts
      for (const user of someUsers) {
        somePosts = somePosts.concat(
          await Post.create(randomPost.createPosts(user._id, 20))
        );
      }

      // create comments
      for (const post of somePosts) {
        await Comment.create(
          randomComment.createComment(post._id, loggedInUser._id)
        );
      }

      let comments = [];

      let res = await server
        .get('/comments')
        .expect('Content-Type', /json/)
        .expect(200);

      comments = comments.concat(res.body.comments);

      expect(comments.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/comments')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      comments = comments.concat(res.body.comments);

      expect(comments.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/comments')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      comments = comments.concat(res.body.comments);

      expect(comments.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('DELETE /comments/:commentid', () => {
    it('delete a comment successfully', async () => {
      const someUser = await User.create(randomUser.createUser());
      const somePost = await Post.create(randomPost.createPost(someUser._id));
      const someComment = await Comment.create(
        randomComment.createComment(somePost._id, loggedInUser._id)
      );

      await server
        .delete(`/comments/${someComment._id}`)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('try delete a comment of another user', async () => {
      const someUser = await User.create(randomUser.createUser());
      const anotherUser = await User.create(randomUser.createUser());
      const somePost = await Post.create(randomPost.createPost(someUser._id));
      const someComment = await Comment.create(
        randomComment.createComment(anotherUser._id, somePost._id)
      );

      await server
        .delete(`/comments/${someComment._id}`)
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('try delete a comment that does not exist', async () => {
      await server
        .delete(`/comments/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try delete a comment with a invalid commentid', async () => {
      await server
        .delete('/comments/123')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
