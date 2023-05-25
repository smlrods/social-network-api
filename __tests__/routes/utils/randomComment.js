import { faker } from '@faker-js/faker';

const createComment = (postid, userid) => {
  return {
    post: postid,
    user: userid,
    body: faker.lorem.sentence(),
  };
};

const createComments = (postid, users) => {
  const comments = [];
  users.forEach((user) => {
    comments.push(createComment(postid, user._id));
  });
  return comments;
};

export default {
  createComment,
  createComments,
};
