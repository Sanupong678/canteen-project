import Repair from '../models/repairModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// สร้างโฟลเดอร์ uploads/repairs ถ้ายังไม่มี
const uploadDir = path.join(process.cwd(), 'uploads', 'repairs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all repairs (admin)
export const getRepairs = async (req, res) => {
  try {
    const repairs = await Repair.find().sort({ createdAt: -1 });
    res.json({ data: repairs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's repairs
export const getUserRepairs = async (req, res) => {
  try {
    const repairs = await Repair.find({ customId: req.user.customId }).sort({ createdAt: -1 });
    res.json({ data: repairs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new repair
export const createRepair = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { customId, canteen, category, issue, status, report_date, images } = req.body;
    
    console.log('Images received:', images);

    const newRepair = new Repair({
      customId,
      canteen,
      category,
      issue,
      status,
      report_date,
      images: Array.isArray(images) ? images : []
    });

    console.log('New repair object:', newRepair);

    const savedRepair = await newRepair.save();
    console.log('Saved repair:', savedRepair);
    res.status(201).json(savedRepair);
  } catch (error) {
    console.error('Error creating repair:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update repair status
export const updateRepairStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const updatedRepair = await Repair.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!updatedRepair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    
    res.json(updatedRepair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete repair
export const deleteRepair = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRepair = await Repair.findByIdAndDelete(id);
    if (!deletedRepair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 