import express from 'express';
import multer from 'multer';
import path from 'path';
import { getNews, createNews, deleteNews } from '../controllers/newsController.js';

const router = express.Router();

// ตั้งค่า multer เก็บไฟล์ในโฟลเดอร์ uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // โฟลเดอร์เก็บไฟล์
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่
  }
});
const upload = multer({ storage: storage });

router.get('/', getNews);
// ใส่ upload.single('image') เป็น middleware เพื่อรับไฟล์ image จากฟอร์ม
router.post('/', upload.single('image'), createNews);
router.delete('/:id', deleteNews);

export default router;
