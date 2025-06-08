import Background from '../models/backgroundModel.js';

export const getBackgrounds = async (req, res) => {
  const backgrounds = await Background.find();
  res.json(backgrounds);
};

export const createBackground = async (req, res) => {
  const background = new Background(req.body);
  await background.save();
  res.status(201).json(background);
};

export const deleteBackground = async (req, res) => {
  await Background.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}; 