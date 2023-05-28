import asyncHandler from 'express-async-handler';
import { body, validationResult, param } from 'express-validator';
import models from '../models';

const { Request, Post } = models;

const readAll = [
  body('lastDoc').optional().trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryOptions = {
      user: req.user.id,
      status: 'accepted',
    };

    if (req.body.lastDoc) queryOptions._id = { $gt: req.body.lastDoc };

    const friends = await Request.find(queryOptions)
      .limit(20)
      .sort({ _id: 1 })
      .exec();

    let lastDoc = null;
    let hasNextPage = false;
    if (friends.length) {
      lastDoc = friends[friends.length - 1]._id;

      const lastDocCollection = (
        await Request.findOne({ user: req.user.id }).sort({ _id: -1 }).exec()
      )._id;

      hasNextPage = lastDocCollection.toString() !== lastDoc.toString();
    }

    return res.json({
      lastDoc,
      friends,
      hasNextPage,
    });
  }),
];

const readPosts = [
  body('lastDoc').optional().trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const requests = await Request.find({
      user: req.user.id,
      status: 'accepted',
    })
      .sort({ _id: 1 })
      .exec();

    const friendsIds = requests.map((request) => request.friend);

    const queryOptions = {
      user: { $in: friendsIds },
    };

    if (req.body.lastDoc) queryOptions._id = { $lt: req.body.lastDoc };

    const posts = await Post.find(queryOptions)
      .sort({ _id: -1 })
      .limit(20)
      .exec();

    let lastDoc = null;
    let hasNextPage = false;
    if (posts.length) {
      lastDoc = posts[posts.length - 1]._id;

      const lastDocCollection = (
        await Post.findOne({ user: { $in: friendsIds } })
          .sort({ _id: 1 })
          .exec()
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

export default {
  readAll,
  readPosts,
};
