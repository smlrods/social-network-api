import asyncHandler from 'express-async-handler';
import { body, validationResult, param } from 'express-validator';
import models from '../models';
import comment from '../models/comment';

const { User, Request, Post, Comment, Like } = models;

const readAll = [
  body('lastDoc').optional().trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryOptions = {
      user: req.user.id,
    };

    if (req.body.lastDoc) queryOptions._id = { $gt: req.body.lastDoc };

    const likes = await Like.find(queryOptions)
      .limit(20)
      .sort({ _id: 1 })
      .exec();

    const lastDoc = likes[likes.length - 1]._id;

    const lastDocCollection = (
      await Like.findOne({ user: req.user.id }).sort({ _id: -1 }).exec()
    )._id;

    const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

    return res.json({
      lastDoc,
      likes,
      hasNextPage,
    });
  }),
];

const deleteLike = [
  param('likeid').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const like = await Like.findById(req.params.likeid).exec();

    if (!like)
      return res.status(404).json({ message: 'this like does not exist' });

    if (like.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: 'cannot delete another user like' });

    await like.deleteOne();
    res.json({ message: 'like deleted successfully' });
  }),
];

export default {
  readAll,
  deleteLike,
};
