import asyncHandler from 'express-async-handler';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import models from '../models';

const login = asyncHandler(async (req, res, next) => {
  res.sendStatus(302);
});

const { User } = models;

const signup = [
  // Validate and sanitize
  body('username', 'Username must be specified')
    .trim()
    .isLength({ min: 1 })
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error('A user already exists with this username');
      }
    })
    .escape(),
  body('password', 'Password must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('profile_image').trim().optional().escape(),
  body('first_name', 'First name must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('last_name', 'Last name must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        next(err);
      }

      const user = new User({
        username: req.body.username,
        password: hashedPassword,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
      });

      await user.save();
      res.sendStatus(201);
    });
  }),
];

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).send('Log out');
  });
};

export default {
  signup,
  login,
  logout,
};
