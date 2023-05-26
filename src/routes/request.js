import { Router } from 'express';
import controllers from '../controllers';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.get('/', checkAuthentication, controllers.request.readAll);

router.put(
  '/:requestid',
  checkAuthentication,
  controllers.request.updateRequest
);

router.get('/sent', checkAuthentication, controllers.request.readAllSent);

router.delete(
  '/sent/:requestid',
  checkAuthentication,
  controllers.request.deleteRequest
);

export default router;
