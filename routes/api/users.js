//register the user to the database,
/*this also checks 
1) if the user is already exists in the database 
2) checks for valid email id
3) encrypts ths user's password, then stores in the database*/

const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const formidable = require("formidable");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const config = require("config");
const auth = require("../../middleware/auth");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
require("dotenv").config();

//@route POST api/users
//desc Create an Users
//@access Public
router.post("/", async (req, res) => {
  const err = validationResult(req);

  if (!err.isEmpty()) {
    return res.status(400).json({ err: err.array() });
  } else {
    res.status(200);
  }

  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).send(err);
    }

    let userFields = User(fields);
    const { name, email, password } = userFields;
    if (!name) res.status(400).send("Name is required");
    if (!email) res.status(400).send("Email is required");
    if (!password) res.status(400).send("Password is required");

    if (files.profilepic) {
      userFields.profilepic.data = fs.readFileSync(files.profilepic.path);
      userFields.profilepic.contentType = files.profilepic.type;
    }

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        userFields.password = hash;

        userFields.save((err, result) => {
          if (err) {
            if (err.code === 11000) {
              return res.status(400).send("This email is already registered");
            } else return res.status(400).send(err);
          }
          return res.status(200).json(result);
        });
      });
    });
  });
});

//@route GET api/users/validate_email
//desc to validate email for forgot password
//@access Public
router.post("/validate_email", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email }).select("name _id");
    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(400).send("Invalid Email");
    }
  } catch (err) {
    console.log(err);
  }
});

//@route GET api/users/reset-password/:user_id
//desc to reset passord
//@access Public
router.post("/reset-password/:user_id", async (req, res) => {
  const userID = req.params.user_id;

  try {
    const user = await User.findOne({ _id: userID });

    const { password } = req.body;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    return res.status(200).send("Password Changed");
  } catch (err) {
    console.log(err);
  }
});

//@route GET api/users/user/:user_id
//desc Get a particular User
//@access Private
router.get("/user/:user_id", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.params.user_id }).select(
    "-password"
  );
  if (user) {
    return res.status(200).json(user);
  }
  if (err) {
    return res.status(400).json(err);
  }
});

//@route GET api/users/allUsers
//desc Get search for a particular user
//@access Private
router.post("/searchUsers", auth, async (req, res) => {
  const { name } = req.body;
  const users = await User.find({ name: name }).select("-password");

  if (users) {
    return res.status(200).json(users);
  } else {
    return res.status(400).send("No Users found");
  }
});

//@route get api/users/:mail_id/:name
//desc Mail for registration
//@access Public
router.get("/mail/:mail_id/:name", async (req, res) => {
  const mail_id = req.params.mail_id;
  let name = req.params.name;
  name = name.toString().substring(0, name.indexOf(" "));

  let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.PASSWORD}`,
    },
  });

  var mailOptions = {
    from: `${process.env.EMAIL}`,
    to: `${mail_id}`,
    subject: "Welcome to Connect!",
    text: `Hey ${name}, Welcome to Connect Community!`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else return res.status(200).send(info.response);
  });
});

//@route get api/users/delete_mail/:mail_id/:name
//desc Mail for delete account
//@access Public
router.get("/delete_mail/:mail_id/:name", async (req, res) => {
  const mail_id = req.params.mail_id;
  let name = req.params.name;
  name = name.toString().substring(0, name.indexOf(" "));
  let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.PASSWORD}`,
    },
  });

  var mailOptions = {
    from: `${process.env.EMAIL}`,
    to: `${mail_id}`,
    subject: "Account successfully deleted",
    text: `Hey ${name},
     Your Connect! account was successfully deleted. 
     Do provide feedback about your experience.`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else return res.status(200).send(info.response);
  });
});

//@route get api/users/reset-password
//desc password reset
//@access Public
router.post("/request/reset-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email }).select("-password");
  const { _id } = user;
  const randomText = randomstring.generate(50);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.PASSWORD}`,
    },
  });

  var mailOptions = {
    from: `${process.env.EMAIL}`,
    to: `${email}`,
    subject: "Reset password",
    text: `${process.env.CLIENT_URL}/reset-password/${_id}/${randomText}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else return res.status(200).send(info.response);
  });
});

//@route PUT api/users/update
//desc update User info(name profilepic, DOB)
//@access Private
router.put("/update", auth, async (req, res) => {
  const user = await User.findById({ _id: req.user.id }).select("-password");

  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ err: err.array() });
  } else {
    res.status(200);
  }

  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).send(err);
    }

    const { name, dob, address, about } = fields;

    if (name) user.name = name;

    if (dob) user.dob = dob;

    if (address) user.address = address;

    if (about) user.about = about;

    /* files.profilepic */
    /*try with an user, who already has photo during first registration */
    if (files.profilepic) {
      user.profilepic.data = fs.readFileSync(files.profilepic.path);
      user.profilepic.contentType = files.profilepic.type;
    }

    user.save((err, result) => {
      if (err) {
        res.status(400).send(err);
      }
      res.status(200).send(result);
    });
  });
});

//@route DELETE api/users/delete/profilepic
//desc DELETE USER's Profilepic
//@access Private
router.put("/delete/profilepic", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user.id }).select("-password");
  // user.profilepic = null;
  user.profilepic.data = undefined;
  user.profilepic.contentType = undefined;
  // console.log(user);
  // var p = user.profilepic;
  // console.log(p);
  // delete p;

  await user.save();
  return res.status(200).json(user);
});

//@route DELETE api/users
//desc DELETE USER
//@access Private
router.delete("/", auth, async (req, res) => {
  await User.findOneAndDelete({ _id: req.user.id });
  return res.status(200).send("User removed");
});

//@route PUT api/users/profilepic/:user_id
//desc view User's profilepic
//@access Private
router.get("/profilepic/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  if (user_id) {
    await User.findById({ _id: user_id }).exec((err, result) => {
      if (result.profilepic.data) {
        res.set("Content-Type", result.profilepic.contentType);
        return res.send(result.profilepic.data);
      }
      if (err) return res.status(400).send(err);
    });
  }
});

//@route PUT api/users/follow/:master_id
//desc follow a user(master)
//@access Private
/* a person(folower) can only another person(master) only if he is logged in*/
router.put("/follow/:master_id", auth, async (req, res) => {
  try {
    const master = await User.findById(req.params.master_id).select(
      "-password"
    );
    const follower = await User.findById(req.user.id).select("-password");

    if (
      master.followers.filter(
        (follow) => follow.user.toString() === req.user.id
      ).length > 0
    ) {
      return res.status(400).send("already followed");
    } else {
      master.followers.unshift({ user: req.user.id, name: follower.name });
      follower.following.unshift({ user: master._id, name: master.name });
    }

    const isFollowed = await master.save();
    await follower.save();
    if (isFollowed) return res.status(200).send("Following");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

//@route PUT api/users/unfollow/:master_id
//desc unfollow a user(master)
//@access Private
router.get("/unfollow/:master_id", auth, async (req, res) => {
  const master = await User.findOne({ _id: req.params.master_id }).select(
    "-password"
  );

  const follower = await User.findOne({ _id: req.user.id }).select("-password");

  if (
    master.followers.filter((f) => f.user.toString() === req.user.id).length ===
    0
  ) {
    res.status(400).json("You don't follow this User");
  }

  // Get remove index
  const followerRemoveIndex = master.followers.map((f) =>
    f.user.toString().indexOf(req.user.id)
  );

  master.followers.splice(followerRemoveIndex, 1);

  // Get remove index(index of the masetr to be removed)
  const masterRemoveIndex = follower.following.map((f) =>
    f.user.toString().indexOf(master._id)
  );
  follower.following.splice(masterRemoveIndex, 1);

  await master.save();
  await follower.save();

  return res.status(200).send("Unfollowed");
});

module.exports = router;
