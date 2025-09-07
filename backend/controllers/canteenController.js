import Canteen from '../models/canteenModel.js';
import path from 'path';
import fs from 'fs';

export const getCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find();

    // Resolve image from uploads/canteen by canteen slug if available
    const uploadsDir = path.join(process.cwd(), 'uploads', 'canteen');
    const candidateExtensions = ['.png', '.jpeg', '.jpg', '.webp'];

    const normalizeSlug = (value) => {
      if (!value) return '';
      const lower = String(value).toLowerCase();
      // Remove Thai prefix "โรงอาหาร " and spaces
      const stripped = lower.replace(/โรงอาหาร\s*/g, '').replace(/\s+/g, '');
      // Map known inconsistencies between path and filename
      if (stripped === 'dormity') return 'dorm';
      if (stripped === 'ruemrim') return 'ruem';
      return stripped;
    };

    const result = canteens.map((doc) => {
      const canteen = doc.toObject();

      // Prefer slug from path's last segment, fallback to name
      const pathSegment = (canteen.path || '').split('/').filter(Boolean).pop();
      const slug = normalizeSlug(pathSegment || canteen.name);

      let resolvedImage = canteen.image;
      try {
        if (slug && fs.existsSync(uploadsDir)) {
          for (const ext of candidateExtensions) {
            const fileName = `canteen-${slug}${ext}`;
            const fullPath = path.join(uploadsDir, fileName);
            if (fs.existsSync(fullPath)) {
              resolvedImage = `/uploads/canteen/${fileName}`;
              break;
            }
          }
        }
      } catch (_) {
        // Silently ignore file system errors and keep existing image
      }

      return { ...canteen, image: resolvedImage };
    });

    res.json(result);
  } catch (error) {
    console.error('Error loading canteens:', error);
    res.status(500).json({ error: 'Failed to load canteens' });
  }
};

export const createCanteen = async (req, res) => {
  try {
    const payload = req.body || {};
    // auto-assign canteenId if missing: next integer after max
    if (payload.canteenId == null) {
      const maxDoc = await Canteen.find().sort({ canteenId: -1 }).limit(1);
      const nextId = (maxDoc[0]?.canteenId || 0) + 1;
      payload.canteenId = nextId;
    }
    const canteen = new Canteen(payload);
    await canteen.save();
    res.status(201).json(canteen);
  } catch (error) {
    console.error('Error creating canteen:', error);
    res.status(500).json({ message: error.message });
  }
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