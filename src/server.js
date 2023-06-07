import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import 'dotenv/config';
import routes from './routes';
import './passport';

function createServer() {
  const app = express();
  app.use(
    cors({
      origin: process.env.ORIGIN,
      methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('trust proxy', true);
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        ttl: 3600,
      }),
      cookie: {
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 60 * 24,
      },
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.session());
  app.use('/auth', routes.auth);
  app.use('/users', routes.user);
  app.use('/posts', routes.post);
  app.use('/requests', routes.request);
  app.use('/comments', routes.comment);
  app.use('/likes', routes.like);
  app.use('/friends', routes.friend);
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
