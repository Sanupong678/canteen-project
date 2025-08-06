import Canteen from '../models/canteenModel.js';
import path from 'path';
import fs from 'fs';

export const getCanteens = async (req, res) => {
  const canteens = await Canteen.find();
  res.json(canteens);
};

export const createCanteen = async (req, res) => {
  const canteen = new Canteen(req.body);
  await canteen.save();
  res.status(201).json(canteen);
};

export const updateCanteen = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🏢 Updating canteen with ID: ${id}`);
    console.log('📋 Update data:', updateData);
    console.log('📁 Uploaded file:', req.file);
    
    // ตรวจสอบว่าโรงอาหารมีอยู่จริงหรือไม่
    const existingCanteen = await Canteen.findById(id);
    if (!existingCanteen) {
      return res.status(404).json({ error: 'Canteen not found' });
    }
    
    // อัปเดตข้อมูล
    const updatedCanteen = await Canteen.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    // ถ้ามีไฟล์รูปภาพใหม่
    if (req.file) {
      console.log('🖼️ New image uploaded, updating canteen image');
      
      // ลบไฟล์เก่าถ้าเป็นไฟล์ที่อัปโหลด (ไม่ใช่ static file)
      if (existingCanteen.image && existingCanteen.image.startsWith('/uploads/canteen/')) {
        const oldImagePath = path.join(process.cwd(), existingCanteen.image.substring(1));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ Deleted old canteen image:', existingCanteen.image);
        }
      }
      
      // อัปเดต path รูปภาพใหม่
      const newImagePath = `/uploads/canteen/${req.file.filename}`;
      updatedCanteen.image = newImagePath;
      await updatedCanteen.save();
      
      console.log('✅ Canteen image updated successfully');
    }
    
    res.json(updatedCanteen);
  } catch (error) {
    console.error('❌ Error updating canteen:', error);
    res.status(500).json({ error: 'Failed to update canteen' });
  }
};

export const deleteCanteen = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏢 Deleting canteen with ID: ${id}`);
    
    const canteen = await Canteen.findById(id);
    
    if (!canteen) {
      return res.status(404).json({ error: 'Canteen not found' });
    }
    
    // ลบไฟล์รูปภาพถ้าเป็นไฟล์ที่อัปโหลด
    if (canteen.image && canteen.image.startsWith('/uploads/canteen/')) {
      const imagePath = path.join(process.cwd(), canteen.image.substring(1));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Deleted canteen image file:', canteen.image);
      }
    }
    
    await Canteen.findByIdAndDelete(id);
    
    console.log('✅ Canteen deleted successfully');
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('❌ Error deleting canteen:', error);
    res.status(500).json({ error: 'Failed to delete canteen' });
  }
}; 