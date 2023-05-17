import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import models from './models';

const { User } = models;

passport.use(
  new LocalStrategy(async (username, password, done) => {
    // Find the user with the given username
    const user = await User.findOne({ username });

    // If the user was not found, return a falsey value
    if (!user) {
      return done(null, false, { message: 'Incorrect username or password' });
    }

    // Check if password is correct
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return done(err);

      if (res) {
        // password match! log user in
        return done(null, user);
      }
      return done(null, false, { message: 'Incorrect username or password' });
    });
  })
);

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser((user, done) => {
  process.nextTick(function () {
    return done(null, user);
  });
});
