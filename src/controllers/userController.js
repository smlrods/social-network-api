import asyncHandler from 'express-async-handler';
import { validationResult, param, query } from 'express-validator';
import models from '../models';

const { User, Request, Post } = models;

const getAll = [
  query('lastDoc', 'invalid lastDoc format')
    .optional()
    .isMongoId()
    .trim()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryOptions = {
      _id: { $ne: req.user.id },
    };

    if (req.query.lastDoc)
      queryOptions._id = { $lt: req.query.lastDoc, ...queryOptions._id };

    const users = await User.find(queryOptions, '-password')
      .limit(20)
      .sort({ _id: -1 })
      .exec();

    let lastDoc = null;
    let hasNextPage = false;
    if (users.length) {
      lastDoc = users[users.length - 1]._id;

      const lastDocCollection = (
        await User.findOne({ _id: { $ne: req.user.id } })
          .sort({ _id: 1 })
          .exec()
      )._id;

      hasNextPage = lastDocCollection.toString() !== lastDoc.toString();
    }

    return res.json({
      lastDoc,
      users,
      hasNextPage,
    });
  }),
];

const getOne = [
  param('userid', 'invalid user id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid, '-password').exec();

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  }),
];

const sendRequest = [
  param('userid', 'invalid user id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid).exec();

    if (!user) return res.status(404).json({ message: 'user does not exist' });

    const request = await Request.create({
      user: req.user.id,
      friend: user._id,
    });

    res.json(request);
  }),
];

const readRequest = [
  param('userid', 'invalid user id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid).exec();

    if (!user) return res.status(404).json({ message: 'user does not exist' });

    const request = await Request.findOne({
      user: req.user.id,
      friend: req.params.userid,
    }).exec();

    if (!request)
      return res.status(404).json({ message: 'Request does not exist' });

    res.json(request);
  }),
];

const readPosts = [
  param('userid').trim().isMongoId().escape(),
  query('lastDoc').optional().trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid).exec();

    if (!user) return res.status(404).json({ message: 'user does not exist' });

    const queryOptions = {
      user: user._id,
    };

    if (req.query.lastDoc) queryOptions._id = { $lt: req.query.lastDoc };

    const posts = await Post.find(queryOptions, '-password')
      .sort({ _id: -1 })
      .limit(20)
      .populate('user', '-password')
      .exec();

    let lastDoc = null;
    let hasNextPage = false;
    if (posts.length) {
      lastDoc = posts[posts.length - 1]._id;

      const lastDocCollection = (
        await Post.findOne({ user: user._id }).sort({ _id: 1 }).exec()
      )._id;

      hasNextPage = lastDocCollection.toString() !== lastDoc.toString();
    }

    return res.json({
      lastDoc,
      posts,
      hasNextPage,
    });
  }),
];

const readFriends = [
  param('userid').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid).exec();

    if (!user) return res.status(404).json({ message: 'user does not exist' });

    const friends = await Request.find({
      user: user._id,
      status: 'accepted',
    })
      .populate('friend', '-password')
      .exec();

    res.json({ friends });
  }),
];

export default {
  getAll,
  getOne,
  sendRequest,
  readRequest,
  readPosts,
  readFriends,
};
