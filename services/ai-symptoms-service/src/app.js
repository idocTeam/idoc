import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Middleware and utilities
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Route imports (to be created)
import symptomRoutes from './routes/symptomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/symptoms', symptomRoutes);
app.use('/api/health', healthRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
