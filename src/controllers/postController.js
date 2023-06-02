import asyncHandler from 'express-async-handler';
import { body, validationResult, param } from 'express-validator';
import models from '../models';

const { User, Request, Post, Comment, Like } = models;

const readAll = [
  body('lastDoc', 'invalid lastDoc format')
    .optional()
    .trim()
    .isMongoId()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.lastDoc) {
      const posts = await Post.find({ _id: { $gt: req.body.lastDoc } })
        .limit(20)
        .sort({ _id: 1 })
        .populate('user', '-password')
        .exec();

      const lastDoc = posts[posts.length - 1]._id;

      // check if have document after lastDoc
      const lastDocCollection = (await Post.findOne().sort({ _id: -1 }).exec())
        ._id;
      const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

      return res.json({
        lastDoc,
        posts,
        hasNextPage,
      });
    }

    const posts = await Post.find()
      .limit(20)
      .sort({ _id: 1 })
      .populate('user', '-password')
      .exec();

    const lastDoc = posts[posts.length - 1]._id;
    const lastDocCollection = (await Post.findOne().sort({ _id: -1 }).exec())
      ._id;

    const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

    res.json({
      posts,
      lastDoc,
      hasNextPage,
    });
  }),
];

const createPost = [
  body('body', 'a post cannot be empty').trim().isLength({ min: 1 }).escape(),
  body('image', 'must be a valid url').trim().isURL().optional(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = new Post({
      user: req.user.id,
      body: req.body.body,
    });

    if (req.body.image) post.image = req.body.image;

    post.save();

    res.json({
      post: post,
      message: 'post created successfully',
    });
  }),
];

const readOne = [
  param('postid', 'Invalid post id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid)
      .populate('user', '-password')
      .exec();

    if (!post) return res.status(404).json({ message: 'post does not exist' });

    res.json({ post });
  }),
];

const deletePost = [
  param('postid', 'Invalid post id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deletedPost = await Post.findByIdAndDelete(req.params.postid).exec();

    if (!deletedPost)
      return res.status(404).json({ message: 'post does not exist' });

    res.json({ message: 'post deleted successfully' });
  }),
];

const updatePost = [
  param('postid', 'Invalid post id').trim().isMongoId().escape(),
  body('body', 'a post cannot be empty').trim().isLength({ min: 1 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid);

    if (!post) return res.status(404).json({ message: 'post does not exist' });

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postid,
      {
        body: req.body.body,
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'post has been updated',
      post: updatedPost,
      postid: req.params.postid,
    });
  }),
];

const readComments = [
  param('postid', 'invalid post id').trim().isMongoId().escape(),
  body('lastDoc', 'invalid lastDoc format')
    .optional()
    .isMongoId()
    .trim()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid);

    if (!post) {
      return res.status(404).json({
        message: 'post does not exist',
      });
    }

    const queryOptions = {
      post: req.params.postid,
    };

    if (req.body.lastDoc) queryOptions._id = { $gt: req.body.lastDoc };

    const comments = await Comment.find(queryOptions)
      .limit(20)
      .sort({ _id: -1 })
      .populate('user')
      .exec();

    let lastDoc = null;
    let hasNextPage = false;

    if (comments.length) {
      lastDoc = comments[comments.length - 1]._id;

      const lastDocCollection = (
        await Comment.findOne({ user: req.user.id }).sort({ _id: 1 }).exec()
      )._id;

      hasNextPage = lastDocCollection.toString() !== lastDoc.toString();
    }

    return res.json({
      lastDoc,
      comments,
      hasNextPage,
    });
  }),
];

const createComment = [
  param('postid', 'invalid post id').trim().isMongoId().escape(),
  body('body', 'a comment cannot be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid);

    if (!post) {
      return res.status(404).json({
        message: 'post does not exist',
      });
    }

    const comment = await Comment.create({
      post: post._id,
      user: req.user.id,
      body: req.body.body,
    });

    res.json({ comment });
  }),
];

const readLikes = [
  param('postid', 'invalid post id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid).exec();

    if (!post) {
      return res.status(404).json({
        message: 'post does not exist',
      });
    }

    const likes = await Like.find({ post: post._id }).exec();

    res.json({ likes });
  }),
];

const createLike = [
  param('postid', 'invalid post id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postid).exec();

    if (!post) {
      return res.status(404).json({
        message: 'post does not exist',
      });
    }

    const like = await Like.create({
      post: post._id,
      user: req.user.id,
    });

    res.json({ like });
  }),
];

export default {
  readAll,
  createPost,
  readOne,
  deletePost,
  updatePost,
  readComments,
  createComment,
  readLikes,
  createLike,
};
