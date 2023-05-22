import asyncHandler from 'express-async-handler';
import { body, validationResult, param } from 'express-validator';
import models from '../models';

const { User, Request, Post } = models;

const getAll = [
  body('lastDoc', 'invalid lastDoc format')
    .optional()
    .isLength({ min: 24, max: 24 })
    .trim()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.lastDoc) {
      const users = await User.find(
        { _id: { $gt: req.body.lastDoc, $ne: req.user.id } },
        '-password'
      )
        .limit(20)
        .sort({ _id: 1 })
        .exec();

      const lastDoc = users[users.length - 1]._id;

      // check if have document after lastDoc
      const lastDocCollection = (
        await User.findOne({ _id: { $ne: req.user.id } })
          .sort({ _id: -1 })
          .exec()
      )._id;
      const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

      return res.json({
        lastDoc,
        users,
        hasNextPage,
      });
    }

    const users = await User.find({ _id: { $ne: req.user.id } }, '-password')
      .limit(20)
      .sort({ _id: 1 })
      .exec();

    const lastDoc = users[users.length - 1]._id;
    const lastDocCollection = (
      await User.findOne({ _id: { $ne: req.user.id } })
        .sort({ _id: -1 })
        .exec()
    )._id;

    const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

    res.json({
      users,
      lastDoc,
      hasNextPage,
    });
  }),
];

const getOne = [
  param('userid', 'invalid user id')
    .trim()
    .isLength({ min: 24, max: 24 })
    .escape(),
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
  param('userid', 'invalid user id')
    .trim()
    .isLength({ min: 24, max: 24 })
    .escape(),
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
  param('userid', 'invalid user id')
    .trim()
    .isLength({ min: 24, max: 24 })
    .escape(),
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
  param('userid').trim().isLength({ min: 24, max: 24 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.userid).exec();

    if (!user) return res.status(404).json({ message: 'user does not exist' });

    const posts = await Post.find({ user: user._id }).exec();

    res.json(posts);
  }),
];

const readFriends = [
  param('userid').trim().isLength({ min: 24, max: 24 }).escape(),
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
    }).exec();

    res.json(friends);
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
