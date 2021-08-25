//getting json web token for user authentication
//to add posts, like, comment
// const { json } = require("express");
const express = require("express");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const config = require("config");

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

//@route POST api/users
//desc Authentication and get token
//@access Public
router.post(
  "/",
  [
    check("email", "Invalid Email").isEmail(),
    check("password", "Password is required").exists(),
  ], //check(), if the mentioned condition is gets satisfied , else passes the proper message

  async (req, res) => {
    const err = validationResult(req);

    if (!err.isEmpty()) {
      return res.status(400).json({ err: err.array() });
    } else {
      res.status(200);
    }

    const { email, password } = req.body;

    try {
      //see if the user already exist in the database
      let user = await User.findOne({ email }); //finds a user with the given email in the database with the email

      if (!user) {
        // return res.status(400).json({ err: [{ msg: "User already exists" }] });
        return res.status(400).send("Inavlid Credentials");
      }

      //checks if the user enterd password and the hashed password is same or not
      //password: stores the user entered password
      //user.password: stores the previously hashed password

      const isMatch = await bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(400).send("Invalid Password");
      }
      //return jsonwentoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      user.password = undefined;
      //generating jwt Token
      const token = jwt.sign(
        payload,
        config.get("jwtSceret"),
        { expiresIn: 7200 }
      );
      res.cookie("token", token, { expiresIn: 7200 });
      return res.status(200).json({ token, user });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;