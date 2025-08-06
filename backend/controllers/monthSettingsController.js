import MonthSettings from '../models/monthSettingsModel.js';

// Get all month settings
export const getAllMonthSettings = async (req, res) => {
  try {
    const monthSettings = await MonthSettings.find().sort({ month: 1 });
    res.json({
      success: true,
      data: monthSettings
    });
  } catch (error) {
    console.error('Error getting month settings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่าเดือน'
    });
  }
};

// Get month setting by month number
export const getMonthSetting = async (req, res) => {
  try {
    const { month } = req.params;
    const monthSetting = await MonthSettings.findOne({ month: parseInt(month) });
    
    if (!monthSetting) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการตั้งค่าเดือนนี้'
      });
    }
    
    res.json({
      success: true,
      data: monthSetting
    });
  } catch (error) {
    console.error('Error getting month setting:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่าเดือน'
    });
  }
};

// Create new month setting
export const createMonthSetting = async (req, res) => {
  try {
    const { month, enabled = true } = req.body;
    
    // Check if month setting already exists
    const existingSetting = await MonthSettings.findOne({ month: parseInt(month) });
    if (existingSetting) {
      return res.status(400).json({
        success: false,
        message: 'การตั้งค่าเดือนนี้มีอยู่แล้ว'
      });
    }
    
    const monthSetting = new MonthSettings({
      month: parseInt(month),
      enabled: enabled
    });
    
    await monthSetting.save();
    
    res.status(201).json({
      success: true,
      data: monthSetting,
      message: 'สร้างการตั้งค่าเดือนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error creating month setting:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการตั้งค่าเดือน'
    });
  }
};

// Update month setting
export const updateMonthSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    const monthSetting = await MonthSettings.findByIdAndUpdate(
      id,
      { enabled: enabled },
      { new: true }
    );
    
    if (!monthSetting) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการตั้งค่าเดือนนี้'
      });
    }
    
    res.json({
      success: true,
      data: monthSetting,
      message: 'อัพเดทการตั้งค่าเดือนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating month setting:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าเดือน'
    });
  }
};

// Bulk update month settings
export const bulkUpdateMonthSettings = async (req, res) => {
  try {
    const { monthSettings } = req.body;
    
    if (!Array.isArray(monthSettings)) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลการตั้งค่าเดือนไม่ถูกต้อง'
      });
    }
    
    const updatePromises = monthSettings.map(async (setting) => {
      const { month, enabled } = setting;
      
      // Check if setting exists
      const existingSetting = await MonthSettings.findOne({ month: parseInt(month) });
      
      if (existingSetting) {
        // Update existing setting
        return MonthSettings.findByIdAndUpdate(
          existingSetting._id,
          { enabled: enabled },
          { new: true }
        );
      } else {
        // Create new setting
        const newSetting = new MonthSettings({
          month: parseInt(month),
          enabled: enabled
        });
        return newSetting.save();
      }
    });
    
    const updatedSettings = await Promise.all(updatePromises);
    
    res.json({
      success: true,
      data: updatedSettings,
      message: 'อัพเดทการตั้งค่าเดือนทั้งหมดเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error bulk updating month settings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าเดือน'
    });
  }
};

// Delete month setting
export const deleteMonthSetting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const monthSetting = await MonthSettings.findByIdAndDelete(id);
    
    if (!monthSetting) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการตั้งค่าเดือนนี้'
      });
    }
    
    res.json({
      success: true,
      message: 'ลบการตั้งค่าเดือนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting month setting:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบการตั้งค่าเดือน'
    });
  }
};

// Get current month evaluation status
export const getCurrentMonthStatus = async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthSetting = await MonthSettings.findOne({ month: currentMonth });
    
    const isEnabled = monthSetting ? monthSetting.enabled : true; // Default to enabled if no setting
    
    res.json({
      success: true,
      data: {
        currentMonth: currentMonth,
        enabled: isEnabled
      }
    });
  } catch (error) {
    console.error('Error getting current month status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถานะเดือนปัจจุบัน'
    });
  }
}; 