import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Imports
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import reportRoutes from './routes/report.routes';
import { ProductController } from './controllers/product.controller';
import { authenticateUser, authorizeRoles } from './middleware/auth';
import { errorHandler } from './middleware/error';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Auth Rate Limiting to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Dedicated endpoint for stock movements (as required in prompt "/api/inventory/movements")
app.get(
  '/api/inventory/movements',
  authenticateUser,
  authorizeRoles('ADMIN', 'WAREHOUSE', 'ACCOUNTS'),
  ProductController.getMovements
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Centralized error handler middleware
app.use(errorHandler);

// Start Server if not testing
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export default app;
