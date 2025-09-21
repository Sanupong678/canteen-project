import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Canteen from '../models/canteenModel.js';

dotenv.config();

const mapFromPathOrName = (doc) => {
  const lower = ((doc.path || doc.name || '') + '').toLowerCase();
  if (lower.includes('/canteen/c5') || lower.includes('โรงอาหาร c5') || lower.includes(' c5')) return 1;
  if (lower.includes('/canteen/d1') || lower.includes('โรงอาหาร d1') || lower.includes(' d1')) return 2;
  if (lower.includes('/canteen/dormity') || lower.includes('dormity') || lower.includes(' dorm')) return 3;
  if (lower.includes('/canteen/e1') || lower.includes('โรงอาหาร e1') || lower.includes(' e1')) return 4;
  if (lower.includes('/canteen/e2') || lower.includes('โรงอาหาร e2') || lower.includes(' e2')) return 5;
  if (lower.includes('/canteen/epark') || lower.includes('epark')) return 6;
  if (lower.includes('/canteen/msquare') || lower.includes('msquare') || lower.includes('m-square')) return 7;
  if (lower.includes('/canteen/ruemrim') || lower.includes('ruemrim') || lower.includes('ruem-rim')) return 8;
  if (lower.includes('/canteen/s2') || lower.includes('โรงอาหาร s2') || lower.includes(' s2')) return 9;
  return null;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const canteens = await Canteen.find({ $or: [{ canteenId: { $exists: false } }, { canteenId: null }] });
    console.log(`🔎 Found ${canteens.length} canteens without canteenId`);

    let updated = 0;
    for (const c of canteens) {
      const guess = mapFromPathOrName(c);
      if (guess) {
        c.canteenId = guess;
        await c.save();
        console.log(`✅ Updated ${c.name} -> canteenId=${guess}`);
        updated++;
      } else {
        console.log(`⚠️  Could not infer canteenId for ${c.name}`);
      }
    }

    console.log(`\n📊 Done. Updated: ${updated}/${canteens.length}`);
  } catch (err) {
    console.error('❌ Error backfilling canteenId:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

run();


























