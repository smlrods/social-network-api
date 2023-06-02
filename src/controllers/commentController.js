import asyncHandler from 'express-async-handler';
import { body, validationResult, param } from 'express-validator';
import models from '../models';

const { Comment } = models;

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

    const comments = await Comment.find(queryOptions)
      .limit(20)
      .sort({ _id: -1 })
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

const deleteComment = [
  param('commentid', 'invalid commentid').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.commentid);

    if (!comment)
      return res.status(404).json({ message: 'this comment does not exist' });

    if (comment.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: 'cannot delete another user comment' });

    await comment.deleteOne();
    res.json({ message: 'comment deleted successfully' });
  }),
];

export default {
  readAll,
  deleteComment,
};
