const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token");

  //check if no token
  if (!token) {
    return res.status(401).send("No Token, authorization denied");
  }

  //verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtSceret"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).send("Inavlid Token");
  }
};
