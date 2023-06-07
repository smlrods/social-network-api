import 'dotenv/config';
import initializeMongoServer from './mongoConfig';
import models from './models';
import randomUser from '../__tests__/routes/utils/randomUser';
import randomPost from '../__tests__/routes/utils/randomPost';

const { User, Post } = models;

const seedDB = async () => {
  await initializeMongoServer();

  // create users
  let randomUsers = randomUser.createUsers(100);
  randomUsers = await User.create(randomUsers);

  for (const user of randomUsers) {
    const posts = randomPost.createPosts(user._id, 10);
    await Post.create(posts);
  }
};

seedDB();
