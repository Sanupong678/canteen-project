import repairRoutes from './routes/repairRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';

// Routes
app.use('/api/repairs', repairRoutes);
app.use('/api/leaves', leaveRoutes); 