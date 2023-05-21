import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

function createUser() {
  return {
    username: faker.internet.userName(),
    password: bcrypt.hashSync(faker.internet.password(), 8),
    profile_image: faker.internet.avatar(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
  };
}

function createUsers(length) {
  const users = [];
  for (let i = 0; i < length; i += 1) {
    users.push(createUser());
  }
  return users;
}

function createUserData() {
  return { ...createUser(), password: faker.internet.password() };
}

export default {
  createUser,
  createUsers,
  createUserData,
};
