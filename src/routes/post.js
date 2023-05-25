import { Router } from 'express';
import controllers from '../controllers';
import checkAuthentication from './middleware/check_authentication';

const router = Router();

router.get('/', checkAuthentication, controllers.post.readAll);

router.post('/', checkAuthentication, controllers.post.createPost);

router.get('/:postid', checkAuthentication, controllers.post.readOne);

router.delete('/:postid', checkAuthentication, controllers.post.deletePost);

router.put('/:postid', checkAuthentication, controllers.post.updatePost);

router.get(
  '/:postid/comments',
  checkAuthentication,
  controllers.post.readComments
);

router.post(
  '/:postid/comments',
  checkAuthentication,
  controllers.post.createComment
);

router.get('/:postid/likes', checkAuthentication, controllers.post.readLikes);

router.post('/:postid/likes', checkAuthentication, controllers.post.createLike);

export default router;
