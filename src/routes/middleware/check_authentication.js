const checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json('not authenticated');
};

export default checkAuthentication;
