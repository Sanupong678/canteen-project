import multer from 'multer';
import path from 'path';

// ตั้งค่า multer สำหรับอัปโหลดรูปภาพข่าว
const newsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/news/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ตั้งค่า multer สำหรับอัปโหลดรูปภาพ banner
const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/banner/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ฟังก์ชันตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// สร้าง multer instances
export const uploadNewsImage = multer({
  storage: newsStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

export const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
}); 