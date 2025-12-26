const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/files'; // Default

    if (file.mimetype.startsWith('video/')) {
      folder = 'uploads/videos';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images';
    }

    // Ensure directory exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Create a unique filename: timestamp-random-originalName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. File Filter (Security)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', // Images
    'video/mp4', 'video/mpeg', 'video/quicktime', // Videos
    'application/pdf', 'application/msword', // Documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and docs (PDF/Word) are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for Video CVs
});

module.exports = upload;