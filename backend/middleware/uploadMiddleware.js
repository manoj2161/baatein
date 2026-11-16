import multer from "multer";

const storage = multer.memoryStorage();

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const createFileFilter = (types, message) => {
  return (req, file, callback) => {
    if (types.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(message));
    }
  };
};

// Existing upload middleware for posts (images and videos).
const upload = multer({
  storage,
  fileFilter: createFileFilter(
    allowedTypes,
    "Only image and video files are allowed.",
  ),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// Separate upload middleware for profile pictures.
export const imageUpload = multer({
  storage,
  fileFilter: createFileFilter(
    imageTypes,
    "Profile picture must be JPEG, PNG, WebP, or GIF.",
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
