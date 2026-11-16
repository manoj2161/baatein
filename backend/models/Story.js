import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true },
);

const Story = mongoose.model("Story", storySchema);

export default Story;
