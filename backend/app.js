import repairRoutes from './routes/repairRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import monthSettingsRoutes from './routes/monthSettingsRoutes.js';

// Routes
app.use('/api/repairs', repairRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/month-settings', monthSettingsRoutes); 