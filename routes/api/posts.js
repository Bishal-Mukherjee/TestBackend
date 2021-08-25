//to add posts, like, comment
const fs = require("fs");
const formidable = require("formidable");
const express = require("express");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const Post = require("../../models/Posts");
const User = require("../../models/User");
const Posts = require("../../models/Posts");
const router = express.Router();

// @route POST api/posts
// @desc Create a post
// @access private
router.post("/", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user.id }).select("-password");
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  const { profilepic } = user;

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).send(err);
    }

    let post = new Post(fields);
    post.user = req.user.id;
    post.name = user.name;
    if (profilepic.data) {
      post.profilepic = 1;
    }

    if (files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path);
      post.photo.contentType = files.photo.type;
    }

    post.save((err, result) => {
      if (err) {
        res.status(200).send(err);
      }
      res.status(200).json(result);
    });
  });
});

// @route GET api/posts/:userName/posts
// @desc GET all post posted by user
// @access private
router.get("/:userName/posts", auth, async (req, res) => {
  const posts = await Post.find({ user: req.user.id }).sort({ _id: -1 });

  if (posts) {
    return res.status(200).json({ posts });
  }
  if (err) {
    return res.status(400).json(err);
  }
});

// @route GET api/posts/:user_id/posts
// @desc GET all post by the viwed user
// @access private
router.get("/:user_id/getposts", auth, async (req, res) => {
  const posts = await Post.find({ user: req.params.user_id }).sort({ _id: -1 });
  try {
    if (posts) {
      return res.status(200).json(posts);
    } else {
      return res.status(400).send("No posts found");
    }
  } catch (err) {
    return res.status(400).json(err);
  }
});

// @route GET api/posts/all_posts
// @desc GET all post
// @access private
router.get("/all_posts", auth, async (req, res) => {
  try {
    /*gets all the post, posted by all the users*/
    let posts = await Post.find({}).sort({ _id: -1 });
    return res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ err: err.array() });
  }
});

// @route GET api/posts/:post_id
// @desc GET post by ID
// @access private
router.get("/:post_id", auth, async (req, res) => {
  /*gets the post by the id that is passed as parameter*/
  const post = await Post.findById(req.params.post_id);

  try {
    if (post) {
      /*if the post exists the display the post*/
      return res.status(200).json({ post });
    }
    res.status(404).send("post not found");
  } catch (error) {
    console.error(error.message);
  }
});

// @route DELETE api/posts/delete/:post_id
// @desc delete a post
// @access private
router.delete("/delete/:post_id", auth, async (req, res) => {
  const error = await validationResult(req);
  if (!error.isEmpty()) {
    console.error(error.message);
  }
  /*gets the post by the post id, passed as parameter*/
  const post = await Post.findById(req.params.post_id);
  /*the below if condition checks if the user that requested to delete the post
  is had posted the post or not. If the condition is not satisfied, the permission 
  to delete is not granted*/
  if (post.user != req.user.id) {
    return res.status(400).send("request cannot be granted");
  } else {
    const posts = await Post.findByIdAndRemove(req.params.post_id);
    /*if the post exists, then it would have been deleted in the above line.
    The below line confirms that post existed and is deleted*/
    if (posts) {
      return res.status(200).send("post deleted");
    } else {
      return res.status(404).send("post does not exists, cannot be deleted");
    }
  }
});

// @route DELETE api/posts/delete
// @desc Delete all posts by User
// @access private
/* this is designed to delete all the posts by the user 
when the user deletes the account*/
router.delete("/delete", auth, async (req, res) => {
  const posts = await Post.find({ user: req.user.id });
  posts.map((post) => {
    post.remove();
  });
  return res.status(200);
});

// @route DELETE api/posts/like/delete
// @desc Delete all likes from a the posts by User
// @access private
router.delete("/likes/delete", auth, async (req, res) => {
  const posts = await Post.find({});

  posts.map((post) => {
    post.likes.map((like) => {
      if (like.user.toString() === req.user.id) {
        like.remove();
        post.save();
        /*posts contains all the posts in the db, hence posts.save() does 
        not work. Now compare with other routes where post.save() is used. 
        There individual post get saved, hence it works. 'One post modified
        save that', not all at once */
      }
    });
  });
  return res.status(200).send("Likes removed");
});

// @route PUT api/posts/like/:post_id
// @desc Like a post
// @access private
router.get("/like/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const user = await User.findOne({ _id: req.user.id });
    const { name, profilepic } = user;
    // console.log(profilepic.data);

    //check if the post has been already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    } else {
      if (profilepic.data) {
        post.likes.unshift({ user: req.user.id, name, profilepic: 1 });
      } else {
        post.likes.unshift({ user: req.user.id, name });
      }

      res.status(200).send("Liked");
    }
    await post.save();
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// @route PUT api/posts/unlike/:post_id
// @desc Unlike a post
// @access private
router.get("/unlike/:post_id", auth, async (req, res) => {
  const post = await Post.findById(req.params.post_id);

  if (
    post.likes.filter((like) => like.user.toString() === req.user.id).length ===
    0
  ) {
    res.status(400).json({ msg: "Post has not yet been liked" });
  }

  //Get remove index
  const removeIndex = post.likes
    .map((like) => like.user.toString())
    .indexOf(req.user.id);
  post.likes.splice(removeIndex, 1);
  await post.save();
  res.status(200).json(post);
});

// @route PUT api/posts/:post_id/likes
// @desc To see who have liked the post
// @access Private
router.get("/:post_id/likes", auth, async (req, res) => {
  const postLikes = await Post.findById(req.params.post_id).select(
    "likes -_id"
  );
  if (postLikes) {
    return res.status(200).json(postLikes);
  }
});

// @route PUT api/posts/comment/:post_id
// @desc Comment on a post
// @access private
router.post(
  "/comment/:post_id",
  auth,
  [check("text", "text is requires").not().isEmpty()],
  async (req, res) => {
    const post = await Post.findById(req.params.post_id);
    const user = await User.findById(req.user.id);
    const { text } = req.body;
    const { profilepic } = user;

    let newComment;

    if (profilepic.data) {
      newComment = {
        text,
        user: user.id,
        name: user.name,
        profilepic: 1,
      };
    } else {
      newComment = {
        text,
        user: user.id,
        name: user.name,
      };
    }

    post.comments.unshift(newComment);
    await post.save();
    res.status(200).json(post);
  }
);

// @route GET api/posts/view_comments/:post_id
// @desc view comments on a post
// @access private
router.get("/view_comments/:post_id", auth, async (req, res) => {
  const post = await Post.findById(req.params.post_id).select("-likes");
  const { comments } = post;
  res.status(200).json({ comments });
});

// @route PUT api/posts/remove_comment/:comment_id
// @desc remove/delete comment on a post
// @access private
router.delete(
  "/remove_comment/:post_id/:comment_id",
  auth,
  async (req, res) => {
    const post = await Post.findById(req.params.post_id);
    try {
      //get the comment
      const comment = post.comments.find(
        (comment) => comment.id === req.params.comment_id
      );

      // check if comment exists
      if (!comment) {
        return res.status(404).json({ msg: "comment does not exists" });
      }

      // //check user
      if (comment.user == req.user.id) {
        const removeIndex = post.comments
          .map((item) => item.id)
          .indexOf(req.params.comment_id);

        post.comments.splice(removeIndex, 1);
      } else {
        return res.status(401).json({ msg: "User not authorized" });
      }

      await post.save();
      return res.status(200).json(post);
    } catch (err) {
      console.error(err.message);
    }
  }
);

// @route PUT api/posts/edit_comment/:post_id/:comment_id
// @desc edit comment on a post
// @access private
router.put("/edit_comment/:post_id/:comment_id", auth, async (req, res) => {
  const post = await Post.findById(req.params.post_id);
  const { newComment } = req.body;
  try {
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    comment.text = newComment;
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(400).json(err);
  }
});

// @route GET api/posts/comments/delete
// @desc Delete all the comments on all post by user
// @access private
router.delete("/comments/delete", auth, async (req, res) => {
  const posts = await Post.find({});

  posts.forEach(async (post) => {
    post.comments.forEach(async (comment) => {
      if (comment.user.toString() === req.user.id) {
        comment.remove();
      }
    });

    await post.save();
  });
  posts.forEach(async (post) => {
    post.comments.forEach(async (comment) => {
      if (comment.user.toString() === req.user.id) {
        comment.remove();
      }
    });
    await post.save();
  });
  posts.forEach(async (post) => {
    post.comments.forEach(async (comment) => {
      if (comment.user.toString() === req.user.id) {
        comment.remove();
      }
    });
    await post.save();
  });
  return res.status(200).send("Comments deleted");
});

// @route GET api/posts/view_photo/:post_id
// @desc view the post photo
// @access private
router.get("/view_photo/:post_id", async (req, res) => {
  const post_id = req.params.post_id;
  if (post_id) {
    await Posts.findById({ _id: post_id }).exec((err, result) => {
      if (result.photo.data) {
        res.set("Content-Type", result.photo.contentType);
        return res.send(result.photo.data);
      }
    });
  }
});

module.exports = router;
