import { Router } from 'express';
import controllers from '../controllers';
import passport from 'passport';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.post('/login', passport.authenticate('local'), controllers.auth.login);

router.get('/login', checkAuthentication, controllers.auth.getUser);

router.post('/signup', controllers.auth.signup);

router.post('/logout', controllers.auth.logout);

export default router;
