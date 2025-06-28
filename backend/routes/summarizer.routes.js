
import express from 'express';
import { summarizeArticle, getSavedArticles, deleteArticle, generateKeyTakeaways } from '../controllers/summarizer.controller.js';
import { protect } from '../middleware/auth.middleware.js'; 

const router = express.Router();

console.log('Summarizer Routes: Initializing routes...');


router.post('/summarize', protect, summarizeArticle);
console.log('Summarizer Routes: POST /summarize registered (protected)');


router.get('/my-summaries', protect, getSavedArticles);
console.log('Summarizer Routes: GET /my-summaries registered (protected)');


router.delete('/my-summaries/:id', protect, deleteArticle);
console.log('Summarizer Routes: DELETE /my-summaries/:id registered (protected)');


router.post('/key-takeaways', protect, generateKeyTakeaways);
console.log('Summarizer Routes: POST /key-takeaways registered (protected)');

export default router;
