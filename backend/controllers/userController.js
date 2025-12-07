import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import Shop from '../models/shopModel.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name } = req.body;
    const newUser = new User({ name });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // 1. หา user ตาม id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. ตรวจสอบรหัสผ่านเดิม
    const isMatch = await bcrypt.compare(currentPassword, user.credentials.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // 3. สร้าง hash ใหม่จากรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. อัปเดตรหัสผ่านใหม่ใน User (ทับ hash เดิมทันที)
    user.password = hashedPassword;
    user.credentials.password_hash = hashedPassword;
    await user.save();

    // 5. ถ้ามี shop ที่เชื่อมโยงอยู่ ก็อัปเดต hash รหัสผ่านใหม่ด้วย
    if (user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (shop) {
        shop.credentials.password_hash = hashedPassword;
        await shop.save();
      }
    }

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
};
