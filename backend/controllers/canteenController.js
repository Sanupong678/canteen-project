import Canteen from '../models/canteenModel.js';

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
    
    res.json(updatedCanteen);
  } catch (error) {
    console.error('Error updating canteen:', error);
    res.status(500).json({ error: 'Failed to update canteen' });
  }
};

export const deleteCanteen = async (req, res) => {
  await Canteen.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}; 