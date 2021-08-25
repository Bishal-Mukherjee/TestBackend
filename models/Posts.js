const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  text: {
    type: String,
  },
  photo: {
    data: Buffer,
    contentType: String,
  },
  name: {
    type: String,
  },
  profilepic: {
    type: Number,
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      name: {
        type: String,
      },
      profilepic: {
        type: Number,
      },
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      text: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      profilepic: {
        type: Number,
      },
      date: {
        type: Date,
        default: Date.now(),
      },
    },
  ],

  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = Post = mongoose.model("post", postSchema);
