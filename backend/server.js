import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import summarizerRoutes from './routes/summarizer.routes.js';
import cors from 'cors';

dotenv.config(); 
connectDB(); 

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocking request from unknown origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use('/api/auth', authRoutes);
app.use('/api', summarizerRoutes);

app.get('/', (req, res) => {
  res.send('AwaazNow Backend API is running!');
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something broke on the server!';
  
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ message: 'Internal Server Error' });
  } else {
    res.status(statusCode).json({
      message: message,
      error: err.name,
      details: err.errors
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});


