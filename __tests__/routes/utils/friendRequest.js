function createRequest(user, friend, status = 'pending') {
  return {
    user: user._id,
    friend: friend._id,
    status,
  };
}

function createRequests(user, friends, status) {
  const requests = [];
  friends.forEach((friend) => {
    requests.push(createRequest(user, friend, status));
  });
  return requests;
}

export default {
  createRequest,
  createRequests,
};
