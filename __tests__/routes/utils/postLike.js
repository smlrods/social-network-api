import { faker } from '@faker-js/faker';

const createLike = (postid, userid) => {
  return {
    post: postid,
    user: userid,
  };
};

const createLikes = (postid, users) => {
  const likes = [];
  users.forEach((user) => {
    likes.push(createLike(postid, user._id));
  });
  return likes;
};

export default {
  createLike,
  createLikes,
};
