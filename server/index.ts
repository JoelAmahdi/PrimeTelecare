import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

import { authRouter } from './routes/auth';
import { doctorsRouter } from './routes/doctors';
import { appointmentsRouter } from './routes/appointments';
import { triageRouter } from './routes/triage';
import { chatRouter } from './routes/chat';
import { videoRouter } from './routes/video';
import { prescriptionsRouter } from './routes/prescriptions';
import { recordsRouter } from './routes/records';
import { paymentsRouter } from './routes/payments';
import { dependentsRouter } from './routes/dependents';
import { adminRouter } from './routes/admin';

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Zero-dependency robust CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// JSON and URL-encoded body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('test')) {
    console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Prime Telecare Telehealth Core API',
    version: '1.0.0',
    compliance: ['NDPA-2023', 'HIPAA-EHR-Ready', 'MDCN-Telemedicine-Standards'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount modular sub-routers
app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/triage', triageRouter);
app.use('/api/chat', chatRouter);
app.use('/api/video', videoRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dependents', dependentsRouter);
app.use('/api/admin', adminRouter);

// Serve static build files in production if dist/ exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback route for Single Page Application
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: `Endpoint ${req.path} not found` });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Prime Telecare Frontend is building or not found');
    }
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Clinical Server Error',
    message: err instanceof Error ? err.message : String(err),
  });
});

if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('test')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`  Prime Telecare Core API running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================\n`);
  });
}

