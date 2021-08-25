const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilepic: {
    data: Buffer,
    contentType: String,
  },
  dob: {
    type: String,
  },
  address: {
    type: String,
  },
  about: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  //array of those who are following the user
  followers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      name: {
        type: String,
      },
    },
  ],
  //array of those whom the user is following
  following: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      name: {
        type: String,
      },
    },
  ],
});

module.exports = User = mongoose.model("user", userSchema);
