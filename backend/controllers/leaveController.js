import Leave from '../models/leaveModel.js';

export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find();
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLeave = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  try {
    const newLeave = new Leave({ startDate, endDate, reason });
    await newLeave.save();
    res.status(201).json(newLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, reason } = req.body;
  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { startDate, endDate, reason },
      { new: true }
    );
    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLeave = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedLeave = await Leave.findByIdAndDelete(id);
    if (!deletedLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.json({ message: 'Leave deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 