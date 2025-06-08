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
  const canteen = await Canteen.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(canteen);
};

export const deleteCanteen = async (req, res) => {
  await Canteen.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}; 