
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; 
import dotenv from 'dotenv';

dotenv.config();


const protect = async (req, res, next) => {
  let token;

  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      
      token = req.headers.authorization.split(' ')[1];

      
      console.log('Auth Middleware: Received Token:', token);

      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      
      console.log('Auth Middleware: Decoded Payload:', decoded);
      console.log('Auth Middleware: Decoded User ID:', decoded.id);

      
      
      const foundUser = await User.findById(decoded.id).select('-password');
      console.log('Auth Middleware: Result of User.findById:', foundUser); 

      req.user = foundUser; 

      
      if (req.user) {
        console.log('Auth Middleware: User Found:', req.user.username, 'ID:', req.user._id);
      } else {
        console.error('Auth Middleware: User NOT Found for ID:', decoded.id, 'after findById. Token valid but user does not exist in DB.'); 
        res.status(401); 
        throw new Error('Not authorized, user not found');
      }

      
      next();
    } catch (error) {
      
      console.error('Auth Middleware Error during token verification or user lookup:', error.message);
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Not authorized, token has expired' });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ message: 'Not authorized, invalid token' }); 
      } else {
        res.status(401).json({ message: `Not authorized, token failed: ${error.message}` });
      }
    }
  } else {
    
    console.log('Auth Middleware: No token found in Authorization header.');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };


