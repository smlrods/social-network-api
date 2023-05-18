import { Router } from 'express';
import controllers from '../controllers';
import passport from 'passport';

const router = Router();

router.post('/login', passport.authenticate('local'), controllers.auth.login);

router.post('/signup', controllers.auth.signup);

router.post('/logout', controllers.auth.logout);

export default router;
