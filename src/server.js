import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import 'dotenv/config';
import routes from './routes';
import './passport';

function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.session());
  app.use('/auth', routes.auth);
  app.use('/users', routes.user);
  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({ message: err.message });
  });
  return app;
}

export default createServer;
