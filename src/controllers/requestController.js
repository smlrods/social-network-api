import asyncHandler from 'express-async-handler';
import { body, validationResult, param, query } from 'express-validator';
import models from '../models';

const { Request } = models;

const readAll = [
  query('lastDoc', 'invalid lastDoc format')
    .optional()
    .trim()
    .isMongoId()
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryOptions = {
      friend: req.user.id,
      status: 'pending',
    };

    if (req.query.lastDoc) queryOptions._id = { $lt: req.query.lastDoc };

    const requests = await Request.find(queryOptions)
      .limit(20)
      .sort({ _id: -1 })
      .exec();

    let lastDoc = null;
    let hasNextPage = false;
    if (requests.length) {
      lastDoc = requests[requests.length - 1]._id;

      const lastDocCollection = (
        await Request.findOne({
          friend: req.user.id,
          status: 'pending',
        })
          .sort({ _id: 1 })
          .exec()
      )._id;

      hasNextPage = lastDocCollection.toString() !== lastDoc.toString();
    }

    return res.json({
      lastDoc,
      requests,
      hasNextPage,
    });
  }),
];

const updateRequest = [
  param('requestid', 'invalid request id').trim().isMongoId().escape(),
  body('status', 'status must be accepted or refused')
    .trim()
    .isIn(['accepted', 'refused'])
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const request = await Request.findById(req.params.requestid);

    if (!request) {
      return res.status(404).json({ message: 'request does not exist' });
    }

    request.status = req.body.status;
    request.save();
    if (req.body.status === 'accepted') {
      await Request.create({
        user: request.friend,
        friend: request.user,
        status: request.status,
      });
    }

    res.json({ request, message: 'request updated successfully' });
  }),
];

const readAllSent = [
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
      const requests = await Request.find({
        _id: { $gt: req.body.lastDoc },
        user: req.user.id,
        status: 'pending',
      })
        .limit(20)
        .sort({ _id: 1 })
        .exec();

      const lastDoc = requests[requests.length - 1]._id;

      const lastDocCollection = (
        await Request.findOne({
          user: req.user.id,
          status: 'pending',
        })
          .sort({ _id: -1 })
          .exec()
      )._id;

      const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

      return res.json({
        lastDoc,
        requests,
        hasNextPage,
      });
    }

    const requests = await Request.find({
      user: req.user.id,
      status: 'pending',
    })
      .limit(20)
      .sort({ _id: 1 })
      .exec();

    const lastDoc = requests[requests.length - 1]._id;

    const lastDocCollection = (
      await Request.findOne({
        user: req.user.id,
        status: 'pending',
      })
        .sort({ _id: -1 })
        .exec()
    )._id;

    const hasNextPage = lastDocCollection.toString() !== lastDoc.toString();

    return res.json({
      lastDoc,
      requests,
      hasNextPage,
    });
  }),
];

const deleteRequest = [
  param('requestid', 'invalid request id').trim().isMongoId().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const request = await Request.findByIdAndDelete(
      req.params.requestid
    ).exec();

    if (!request) {
      return res.status(404).json({ message: 'request does not exist' });
    }

    res.json({ message: 'request deleted successfully' });
  }),
];

export default {
  readAll,
  updateRequest,
  readAllSent,
  deleteRequest,
};
