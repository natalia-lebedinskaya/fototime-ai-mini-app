const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png'];

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_FORMAT'));
    }

    cb(null, true);
  }
});

module.exports = uploadMiddleware;
