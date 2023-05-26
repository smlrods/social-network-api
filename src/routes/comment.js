import { Router } from 'express';
import controllers from '../controllers';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.get('/', checkAuthentication, controllers.comment.readAll);

router.delete(
  '/:commentid',
  checkAuthentication,
  controllers.comment.deleteComment
);

export default router;
