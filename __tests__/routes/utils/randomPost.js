import { faker } from '@faker-js/faker';

function createPost(userid) {
  return {
    user: userid,
    body: faker.lorem.text(),
  };
}

function createPosts(userid, length) {
  const posts = [];
  for (let i = 0; i < length; i += 1) {
    posts.push(createPost(userid));
  }
  return posts;
}

export default {
  createPost,
  createPosts,
};
