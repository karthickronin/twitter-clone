import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

export const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(`Error in getProfile controller : ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userModify = await User.findById({ _id: id });
    const currentUser = await User.findById({ _id: req.user._id });

    if (id == req.user._id) {
      return res.status(400).json({ error: "You can't follow/unfollow" });
    }
    if (!userModify || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(
        { _id: id },
        { $pull: { followers: req.user._id } }
      );
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $pull: { following: id } }
      );
      res.status(200).json({ message: "Unfollow Successfully" });
    } else {
      await User.findByIdAndUpdate(
        { _id: id },
        { $push: { followers: req.user._id } }
      );
      await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $push: { following: id } }
      );
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userModify._id,
      });
      await newNotification.save();
      res.status(200).json({ message: "follow Successfully" });
    }
  } catch (error) {
    console.log(`Error in followUnFollowUser controller : ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const userFollowedByMe = await User.findById({ _id: userId }).select(
      "-password"
    );

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);

    const filteredUser = users.filter(
      (user) => !userFollowedByMe.following.includes(user._id)
    );
    const suggesteddUser = filteredUser.slice(0, 4);

    suggesteddUser.forEach((user) => (user.password = null));

    res.status(200).json(suggesteddUser);
  } catch (error) {
    console.log(`Error in getSuggestedUser controller : ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      username,
      fullname,
      email,
      currentPassword,
      newPassword,
      bio,
      link
    } = req.body
    let {
      profileImg,
      coverImg,
    } = req.body;
    let user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please provide both Current password and New password",
      });
    }
    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is Incorrect" });
      }

      if (newPassword > 6) {
        return res
          .status(400)
          .json({ error: "Password must have atleast 6 char length" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      let uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }
    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    user.password = null;
    res.status(200).json(user);
  } catch (error) {
    console.log(`Error in updateUser controller : ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};
