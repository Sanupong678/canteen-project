# ResetId Functionality Documentation

## Overview
The resetId functionality has been added to the evaluation system to support historical data management and shop elimination processes. This system allows for periodic resets while maintaining historical data integrity.

## Key Features

### 1. ResetId Management
- **resetId**: A sequential number that increments each time the system is reset
- **ResetControl Model**: Tracks the current resetId and reset history
- **Automatic Increment**: Each reset increases resetId by 1

### 2. Evaluation Data Structure
- All evaluations now include a `resetId` field
- New evaluations automatically use the current resetId
- Historical data is preserved with their original resetId

### 3. Shop Elimination System
- **New Status**: Added 'คัดออก' (eliminated) status to evaluation results
- **Ranking Logic**: Shops are ranked by average score (low to high)
- **Elimination Criteria**: Shops with lowest avgScore in each canteen can be eliminated
- **Minimum Rounds**: Shops must have at least `minRounds` evaluations to be eligible for elimination

## API Endpoints

### Reset Management
- `POST /api/evaluations/reset-system` - Increment resetId
- `GET /api/evaluations/reset-info` - Get current reset information
- `GET /api/evaluations/reset-ids` - Get available resetIds for filtering

### Rankings and Elimination
- `GET /api/evaluations/rankings` - Get shop rankings with average scores
- `POST /api/evaluations/eliminate-shops` - Mark shops as eliminated

### Historical Data
- `GET /api/evaluations/history` - Get evaluation history (supports resetId filtering)

## Data Flow

### 1. System Reset Process
```
1. Admin triggers reset via POST /api/evaluations/reset-system
2. ResetControl.currentResetId increments by 1
3. New evaluations use the new resetId
4. Existing evaluations retain their original resetId
```

### 2. Evaluation Process
```
1. New evaluations automatically get current resetId
2. evaluationRound starts at 1 for each resetId
3. Multiple rounds can exist within same resetId
4. Average score calculated only within current resetId
```

### 3. Shop Elimination Process
```
1. Calculate average scores for all shops in current resetId
2. Sort shops by avgScore (low to high)
3. Group by canteen
4. Select worst performers (e.g., bottom 2 in each canteen)
5. Mark selected shops as 'คัดออก'
6. Verify minimum rounds requirement
```

## Database Schema Changes

### Evaluation Model
```javascript
{
  // ... existing fields ...
  resetId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  finalStatus: {
    type: String,
    enum: ['ผ่าน', 'ไม่ผ่าน', 'คัดออก'], // Added 'คัดออก'
    required: true
  }
}
```

### ResetControl Model (New)
```javascript
{
  currentResetId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  resetBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetReason: {
    type: String,
    default: ''
  }
}
```

## Migration Script
Run the migration script to update existing evaluations:
```bash
node scripts/migrateResetId.js
```

## Usage Examples

### 1. Reset System
```javascript
// Reset the system
const response = await fetch('/api/evaluations/reset-system', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resetReason: 'New academic year'
  })
});
```

### 2. Get Rankings
```javascript
// Get current rankings
const rankings = await fetch('/api/evaluations/rankings?minRounds=2');

// Get historical rankings
const historicalRankings = await fetch('/api/evaluations/rankings?resetId=1&minRounds=2');
```

### 3. Eliminate Shops
```javascript
// Eliminate worst performing shops
const elimination = await fetch('/api/evaluations/eliminate-shops', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shopIds: ['shop1', 'shop2'],
    minRounds: 2
  })
});
```

### 4. View Historical Data
```javascript
// Get all historical data
const history = await fetch('/api/evaluations/history');

// Filter by resetId
const resetHistory = await fetch('/api/evaluations/history?resetId=1');

// Filter by status
const eliminatedShops = await fetch('/api/evaluations/history?status=คัดออก');
```

## Status Colors
- **ผ่าน** (Pass): Green
- **ไม่ผ่าน** (Fail): Yellow  
- **คัดออก** (Eliminated): Red

## Important Notes

1. **Data Integrity**: Existing evaluations are preserved with resetId = 1
2. **New Shops**: Start with current resetId immediately
3. **Continuing Shops**: Have data across multiple resetIds
4. **Average Calculation**: Only uses evaluations from current resetId
5. **Elimination**: Only affects shops with sufficient evaluation rounds
6. **Historical Access**: All data remains accessible via resetId filtering

## Future Enhancements
- Automatic elimination based on configurable thresholds
- Reset scheduling and automation
- Advanced reporting and analytics
- Integration with notification system for eliminations

