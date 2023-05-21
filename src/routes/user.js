import { Router } from 'express';
import controllers from '../controllers';
import passport from 'passport';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

// read all user
router.get('/', checkAuthentication, controllers.user.getAll);

// read a user
router.get('/:userid', checkAuthentication, controllers.user.getOne);

// read a request
router.get(
  '/:userid/request',
  checkAuthentication,
  controllers.user.readRequest
);

// send a request
router.post(
  '/:userid/request',
  checkAuthentication,
  controllers.user.sendRequest
);

// read all user posts
router.get('/:userid/posts', checkAuthentication, controllers.user.readPosts);

// read a user's friends
router.get(
  '/:userid/friends',
  checkAuthentication,
  controllers.user.readFriends
);

export default router;
