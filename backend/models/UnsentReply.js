import mongoose from "mongoose";

const unsentReplySchema = new mongoose.Schema(
  {
    // PRIVATE: Never expose this field in anonymous API responses.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    unsent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unsent",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Replies are anonymous in the first version.
    isAnonymous: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const UnsentReply = mongoose.model("UnsentReply", unsentReplySchema);

export default UnsentReply;
