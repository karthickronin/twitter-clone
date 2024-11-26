import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }
    const newPost = new Post({
      user: userId,
      text,
      img
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log(`Error in createPost controller : ${error.message}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById({ _id: id });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorised to delete someone's post" });
    }
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete({ _id: id });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(`Error in deletePost controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Comment text is must" });
    }
    const post = await Post.findById({ _id: postId });
    if (!post) {
      return res.status(404).json({ error: "Post is not found" });
    }
    const comment = {
      user: userId,
      text,
    };
    post.comments.push(comment);

    await post.save();
    await new Notification ({
      from : userId,
      to : post.user,
      type : "comment"
    }).save()
    const updatedComments = post.comments
    res.status(200).json(updatedComments);
  } catch (error) {
    console.log(`Error in createComment controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;
    // const postId = req.params.id;
    // const userId = req.user._id;
    const post = await Post.findById({ _id: postId });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const userLikedPost = post.likes.includes(userId);
    // const response = userLikedPost
    //   ? (await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
    //       .res.status(200)
    //       .json({ message: "Post unliked successfully" }))
    //   : (post.likes.push(userId),
    if (userLikedPost) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter((id)=>id.toString() !== userId.toString())
      res.status(200).json(updatedLikes);
    } else {
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      post.likes.push(userId);
      await post.save();

      await new Notification({
        from: userId,
        to: post.user,
        type: "like",
      }).save();
      const updatedLikes = post.likes
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log(`Error in likeUnlikePost controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: [
          "-password",
          "-email",
          "-following",
          "-followers",
          "-bio",
          "-link",
        ],
      });
    if (posts === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log(`Error in getAllPost controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById({ _id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
    }
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: [
          "-password",
          "-email",
          "-following",
          "-followers",
          "-bio",
          "-link",
        ],
      });
      res.status(200).json(likedPosts)
  } catch (error) {
    console.log(`Error in getLikedPosts controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const followingPosts = await Post.find({ user: { $in: user.following } })
      .sort({createdAt: -1})
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: [
          "-password",
          "-email",
          "-following",
          "-followers",
          "-bio",
          "-link",
        ],
      });
      res.status(200).json(followingPosts)
  } catch (error) {
    console.log(`Error in getLikedPosts controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
export const getUserPosts = async (req, res) => {
  try {
    const {username} = req.params
    const user = await User.findOne({username});
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userPosts = await Post.find({ user: { $in: user._id } })
      .sort({createdAt: -1})
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: [
          "-password",
          "-email",
          "-following",
          "-followers",
          "-bio",
          "-link",
        ],
      });
      res.status(200).json(userPosts)
  } catch (error) {
    console.log(`Error in getUserPosts controller : ${error}`);
    res.status(500).json({ error: "Internal Server Error " });
  }
};
