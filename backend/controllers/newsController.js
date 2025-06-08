import News from '../models/newsModel.js';

export const getNews = async (req, res) => {
  const news = await News.find();
  res.json(news);
};

export const createNews = async (req, res) => {
  const news = new News(req.body);
  await news.save();
  res.status(201).json(news);
};

export const deleteNews = async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}; 