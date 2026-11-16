import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["felt"],
      default: "felt",
    },
  },
  { timestamps: true },
);

const unsentSchema = new mongoose.Schema(
  {
    // PRIVATE: Never expose this field in anonymous API responses.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: [
        "To Someone",
        "To My Past",
        "To My Future",
        "An Apology",
        "A Thank You",
        "A Goodbye",
        "A Dream",
        "A Secret",
      ],
      required: true,
    },

    visibility: {
      type: String,
      enum: ["anonymous", "followers", "public"],
      default: "anonymous",
    },

    reactions: [reactionSchema],
  },
  { timestamps: true },
);

const Unsent = mongoose.model("Unsent", unsentSchema);

export default Unsent;
