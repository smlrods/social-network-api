import { Router } from 'express';
import controllers from '../controllers';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.get('/', checkAuthentication, controllers.like.readAll);

router.delete('/:likeid', checkAuthentication, controllers.like.deleteLike);

export default router;
