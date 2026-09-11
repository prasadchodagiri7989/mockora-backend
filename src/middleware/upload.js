const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}-${sanitized}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|docx|txt|jpg|jpeg|png|mp4|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname) {
    return cb(null, true);
  }
  cb(new Error('Only document (PDF/DOCX), image, and video files are supported.'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
});

module.exports = upload;
