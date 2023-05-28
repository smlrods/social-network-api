import { Router } from 'express';
import controllers from '../controllers';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.get('/', checkAuthentication, controllers.friend.readAll);

router.get('/posts', checkAuthentication, controllers.friend.readPosts);

export default router;
