// Utility functions สำหรับจัดการ customId

// Mapping table สำหรับชื่อย่อโรงอาหาร (ต้องตรงกับ backend)
export const canteenAbbreviations = {
  'โรงอาหาร C5': 'C5',
  'โรงอาหาร D1': 'D1', 
  'โรงอาหาร Dormity': 'D',
  'โรงอาหาร E1': 'E1',
  'โรงอาหาร E2': 'E2',
  'โรงอาหาร Epark': 'EP',
  'โรงอาหาร Msquare': 'MQ',
  'โรงอาหาร RuemRim': 'RRN',
  'โรงอาหาร S2': 'S2'
};

// Function สำหรับแสดง customId ในรูปแบบที่อ่านง่าย
export function formatCustomId(customId) {
  if (!customId) return '-';
  
  // ถ้า customId เป็นรูปแบบใหม่ (เช่น C5001, D1001) ให้แสดงตามปกติ
  if (/^[A-Z]{1,3}\d{3}$/.test(customId)) {
    return customId;
  }
  
  // ถ้าเป็น ObjectId หรือรูปแบบเก่า ให้แสดงตามปกติ
  return customId;
}

// Function สำหรับตรวจสอบว่า customId เป็นรูปแบบใหม่หรือไม่
export function isNewCustomIdFormat(customId) {
  if (!customId) return false;
  return /^[A-Z]{1,3}\d{3}$/.test(customId);
}

// Function สำหรับแสดงชื่อโรงอาหารจาก customId
export function getCanteenNameFromCustomId(customId) {
  if (!customId || !isNewCustomIdFormat(customId)) {
    return null;
  }
  
  // หาชื่อย่อจาก customId
  const abbreviation = customId.replace(/\d{3}$/, '');
  
  // หาชื่อโรงอาหารจาก abbreviation
  for (const [canteenName, abbrev] of Object.entries(canteenAbbreviations)) {
    if (abbrev === abbreviation) {
      return canteenName;
    }
  }
  
  return null;
}

// Function สำหรับแสดงหมายเลขลำดับจาก customId
export function getSequenceNumberFromCustomId(customId) {
  if (!customId || !isNewCustomIdFormat(customId)) {
    return null;
  }
  
  const match = customId.match(/(\d{3})$/);
  return match ? parseInt(match[1]) : null;
}

// Function สำหรับแสดงข้อมูล customId แบบละเอียด
export function getCustomIdInfo(customId) {
  if (!customId) {
    return {
      formatted: '-',
      isNewFormat: false,
      canteenName: null,
      sequenceNumber: null,
      abbreviation: null
    };
  }
  
  const isNewFormat = isNewCustomIdFormat(customId);
  const canteenName = isNewFormat ? getCanteenNameFromCustomId(customId) : null;
  const sequenceNumber = isNewFormat ? getSequenceNumberFromCustomId(customId) : null;
  const abbreviation = isNewFormat ? customId.replace(/\d{3}$/, '') : null;
  
  return {
    formatted: formatCustomId(customId),
    isNewFormat,
    canteenName,
    sequenceNumber,
    abbreviation
  };
}
