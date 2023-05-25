import request from 'supertest';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectDB, dropDB } from '../mongoConfigTesting';
import createServer from '../../src/server';
import randomUser from './utils/randomUser';
import randomPost from './utils/randomPost';
import postLike from './utils/postLike';
import models from '../../src/models';
import randomComment from './utils/randomComment';

const { User, Post, Comment, Like } = models;

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

describe('Posts routes', () => {
  describe('GET /posts', () => {
    it('read all posts', async () => {
      // create some users
      const user1 = await User.create(randomUser.createUser());
      const user2 = await User.create(randomUser.createUser());

      // create some posts
      const postsUser1 = await Post.create(
        randomPost.createPosts(user1._id, 30)
      );
      const postsUser2 = await Post.create(
        randomPost.createPosts(user2._id, 30)
      );

      let posts = [];

      let res = await server
        .get('/posts/')
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/posts/')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get('/posts/')
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      posts = posts.concat(res.body.posts);

      expect(posts.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });
  });

  describe('POST /posts', () => {
    it('create a post in logged in User successfully', async () => {
      const newPost = {
        body: faker.lorem.text(),
      };

      const res = await server
        .post('/posts')
        .send(newPost)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.post.body).toEqual(newPost.body);
    });

    it('create a post in logged in User unsuccessfully', async () => {
      const newPost = {
        body: '',
      };

      const res = await server
        .post('/posts')
        .send(newPost)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /posts/:postid', () => {
    it('read a post', async () => {
      // create a user
      const someUser = await User.create(randomUser.createUser());

      // create a post for this user
      const userPost = await Post.create(randomPost.createPost(someUser._id));

      const res = await server
        .get(`/posts/${userPost._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.post).toEqual({
        __v: userPost.__v,
        _id: userPost._id.toString(),
        body: userPost.body,
        user: userPost.user.toString(),
      });
    });

    it('try to read a post that does not exist', async () => {
      await server
        .get(`/posts/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to read a post with an invalid postid', async () => {
      await server.get('/posts/123').expect('Content-Type', /json/).expect(400);
    });
  });

  describe('DELETE /posts/:postid', () => {
    it('delete a post successfully', async () => {
      // create a user
      const someUser = await User.create(randomUser.createUser());

      // create a post for this user
      const userPost = await Post.create(randomPost.createPost(someUser._id));

      const res = await server
        .delete(`/posts/${userPost._id}`)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('try to delete a post that does not exist', async () => {
      await server
        .get(`/posts/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to delete a post with an invalid postid', async () => {
      await server.get('/posts/123').expect('Content-Type', /json/).expect(400);
    });
  });

  describe('PUT /posts/:postid', () => {
    it('update a post successfully', async () => {
      const newPost = await Post.create(
        randomPost.createPost(loggedInUser._id)
      );

      const updatedPost = {
        body: faker.lorem.text(),
      };

      const res = await server
        .put(`/posts/${newPost._id}`)
        .send(updatedPost)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.post).toEqual({
        __v: newPost.__v,
        _id: newPost._id.toString(),
        body: updatedPost.body,
        user: newPost.user.toString(),
      });
    });

    it('try to update a post that does not exist', async () => {
      await server
        .get(`/posts/${faker.database.mongodbObjectId()}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to update a post with an invalid postid', async () => {
      await server.get('/posts/123').expect('Content-Type', /json/).expect(400);
    });
  });

  describe('GET /posts/:postid/comments', () => {
    it('read comments post', async () => {
      // create a user -> create a post -> create a comment
      const userWhoPosted = await User.create(randomUser.createUser());
      const someUsers = await User.create(randomUser.createUsers(60));

      const post = await Post.create(randomPost.createPost(userWhoPosted._id));
      const comments = await Comment.create(
        randomComment.createComments(post._id, someUsers)
      );

      let retrivedComments = [];
      let res = await server
        .get(`/posts/${post._id}/comments`)
        .expect('Content-Type', /json/)
        .expect(200);

      retrivedComments = retrivedComments.concat(res.body.comments);

      expect(retrivedComments.length).toEqual(20);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get(`/posts/${post._id}/comments`)
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      retrivedComments = retrivedComments.concat(res.body.comments);

      expect(retrivedComments.length).toEqual(40);
      expect(res.body.hasNextPage).toEqual(true);

      res = await server
        .get(`/posts/${post._id}/comments`)
        .send({ lastDoc: res.body.lastDoc })
        .expect('Content-Type', /json/)
        .expect(200);

      retrivedComments = retrivedComments.concat(res.body.comments);

      expect(retrivedComments.length).toEqual(60);
      expect(res.body.hasNextPage).toEqual(false);
    });

    it('try read a post comments that does not exist', async () => {
      await server
        .get(`/posts/${faker.database.mongodbObjectId()}/comments`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try read a post comments with a invalid postid', async () => {
      await server
        .get('/posts/123/comments')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('POST /posts/:postid/comments', () => {
    it('create a comment successfully', async () => {
      const someUser = await User.create(randomUser.createUser());

      const somePost = await Post.create(randomPost.createPost(someUser._id));

      const someComment = {
        body: faker.lorem.sentence(),
      };

      const res = await server
        .post(`/posts/${somePost._id}/comments`)
        .send(someComment)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.comment).toMatchObject({
        user: loggedInUser._id.toString(),
        post: somePost._id.toString(),
        body: someComment.body,
      });
    });

    it('try create a comment for a post that does not exist', async () => {
      const someComment = {
        body: faker.lorem.sentence(),
      };

      await server
        .post(`/posts/${faker.database.mongodbObjectId()}/comments`)
        .send(someComment)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try create a comment for a post with a invalid post id', async () => {
      const someComment = {
        body: faker.lorem.sentence(),
      };

      await server
        .post('/posts/123/comments')
        .send(someComment)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /posts/:postid/likes', () => {
    it('read post likes', async () => {
      const someUser = await User.create(randomUser.createUser());
      const someUsers = await User.create(randomUser.createUsers(60));

      const somePost = await Post.create(randomPost.createPost(someUser._id));

      const postLikes = await Like.create(
        postLike.createLikes(somePost._id, someUsers)
      );

      let res = await server
        .get(`/posts/${somePost._id}/likes`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.likes.length).toEqual(60);
    });

    it('try reading post likes from a post that does not exist', async () => {
      await server
        .get(`/posts/${faker.database.mongodbObjectId()}/likes`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try reading post likes with a invalid postid', async () => {
      await server
        .get('/posts/123/likes')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('POST /posts/:postid/likes', () => {
    it('create a post like successfully', async () => {
      const someUser = await User.create(randomUser.createUser());
      const somePost = await Post.create(randomPost.createPost(someUser._id));

      const res = await server
        .post(`/posts/${somePost._id}/likes`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.like).toMatchObject({
        post: somePost._id.toString(),
        user: loggedInUser._id.toString(),
      });
    });

    it('try to create a post like from a post that does not exist', async () => {
      await server
        .post(`/posts/${faker.database.mongodbObjectId()}/likes`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('try to create a post like with a invalid postid', async () => {
      await server
        .post('/posts/123/likes')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
