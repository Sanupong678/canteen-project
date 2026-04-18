import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PaymentSettings from '../models/paymentSettingsModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SETTINGS = {
  accountNumber: '6720407581',
  bankName: 'ธนาคารกรุงเทพ',
  qrTitle: '',
  qrImagePath: '',
  qrItems: []
};

const ensureSettings = async () => {
  let settings = await PaymentSettings.findOne();
  if (!settings) {
    settings = await PaymentSettings.create(DEFAULT_SETTINGS);
  }
  // Backward compatibility: migrate old single QR fields to first qrItems entry once
  if ((!settings.qrItems || settings.qrItems.length === 0) && settings.qrImagePath) {
    settings.qrItems = [
      {
        title: settings.qrTitle || 'QR Code ชำระเงิน',
        imagePath: settings.qrImagePath
      }
    ];
    await settings.save();
  }
  return settings;
};

export const getPaymentSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting payment settings:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการตั้งค่าการชำระเงินได้'
    });
  }
};

export const upsertPaymentSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();

    const nextAccountNumber = (req.body?.accountNumber || '').trim() || DEFAULT_SETTINGS.accountNumber;
    const nextBankName = (req.body?.bankName || '').trim() || DEFAULT_SETTINGS.bankName;

    settings.accountNumber = nextAccountNumber;
    settings.bankName = nextBankName;

    await settings.save();

    return res.json({
      success: true,
      data: settings,
      message: 'บันทึกการตั้งค่าการชำระเงินเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกการตั้งค่าการชำระเงินได้'
    });
  }
};

export const addPaymentQrItem = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const title = (req.body?.title || '').trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุหัวข้อ QR Code'
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัปโหลดรูป QR Code'
      });
    }

    settings.qrItems.push({
      title,
      imagePath: req.file.path.replace(/\\/g, '/')
    });
    await settings.save();

    return res.status(201).json({
      success: true,
      data: settings,
      message: 'เพิ่ม QR Code เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error adding payment QR item:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถเพิ่ม QR Code ได้'
    });
  }
};

export const updatePaymentQrItem = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const { id } = req.params;
    const target = settings.qrItems.id(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ QR Code ที่ต้องการแก้ไข'
      });
    }

    const nextTitle = (req.body?.title || '').trim();
    if (nextTitle) {
      target.title = nextTitle;
    }

    if (req.file) {
      if (target.imagePath) {
        const oldAbsolutePath = path.join(__dirname, '..', target.imagePath);
        fs.unlink(oldAbsolutePath, () => {});
      }
      target.imagePath = req.file.path.replace(/\\/g, '/');
    }

    await settings.save();

    return res.json({
      success: true,
      data: settings,
      message: 'อัปเดต QR Code เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error updating payment QR item:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดต QR Code ได้'
    });
  }
};

export const deletePaymentQrItem = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const { id } = req.params;
    const target = settings.qrItems.id(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ QR Code ที่ต้องการลบ'
      });
    }

    if (target.imagePath) {
      const oldAbsolutePath = path.join(__dirname, '..', target.imagePath);
      fs.unlink(oldAbsolutePath, () => {});
    }

    target.deleteOne();
    await settings.save();

    return res.json({
      success: true,
      data: settings,
      message: 'ลบ QR Code เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting payment QR item:', error);
    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถลบ QR Code ได้'
    });
  }
};
