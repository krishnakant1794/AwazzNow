
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



app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
}));


console.log('Server: Registering routes...');



app.use('/api/auth', authRoutes);
console.log('Server: Auth routes registered at /api/auth');





app.use('/api', summarizerRoutes);
console.log('Server: Summarizer routes registered at /api');



app.get('/', (req, res) => {
  res.send('API is running...');
});


app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack); 
  res.status(err.statusCode || 500).json({ 
    message: err.message || 'Something broke!',
    
    
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


