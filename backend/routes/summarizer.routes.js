
import express from 'express';
import axios from 'axios'; 

import { summarizeArticle, getSavedArticles, deleteArticle, generateKeyTakeaways } from '../controllers/summarizer.controller.js';
import { protect } from '../middleware/auth.middleware.js'; 

const router = express.Router();

console.log('Summarizer Routes: Initializing routes...');


router.get('/news', protect, async (req, res) => {
    console.log('Backend: GET /api/news received. Fetching articles...');
    const { q, category } = req.query; 

   
    const NEWS_API_KEY_BACKEND = process.env.NEWS_API_KEY; 
    if (!NEWS_API_KEY_BACKEND) {
        console.error('Backend: NewsAPI key (process.env.NEWS_API_KEY) is not set!');
        return res.status(500).json({ message: 'NewsAPI key is not configured on the server. Please check backend environment variables.' });
    }

    try {
        const queryToUse = q && q.trim() !== '' ? q.trim() : 'latest news'; 
        const categoryParam = category && category !== 'general' ? `&category=${category}` : '';
        
       
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(queryToUse)}${categoryParam}&language=en&apiKey=${NEWS_API_KEY_BACKEND}`;
        
        console.log('Backend: Making external call to NewsAPI URL:', newsApiUrl);
        
        const response = await axios.get(newsApiUrl);
        
      
        res.json(response.data.articles);
        console.log(`Backend: Successfully fetched ${response.data.articles.length} articles from NewsAPI.`);

    } catch (error) {
        console.error('Backend Error: Failed to fetch news from NewsAPI:', error.response ? error.response.data : error.message);
        let errorMessage = 'Failed to fetch news from external API.';
        let statusCode = 500;

        if (error.response) {
           
            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'Backend\'s NewsAPI key is invalid or unauthorized.';
                statusCode = 401; 
            } else if (error.response.status === 429) {
                errorMessage = 'NewsAPI rate limit exceeded for the backend. Please try again later.';
                statusCode = 429;
            } else {
                errorMessage = `NewsAPI returned status ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`;
                statusCode = error.response.status;
            }
        } else if (error.request) {
          
            errorMessage = 'Network error when trying to reach NewsAPI.';
            statusCode = 503; 
        } else {
          
            errorMessage = `Error setting up NewsAPI request: ${error.message}`;
            statusCode = 500;
        }
        
        res.status(statusCode).json({ message: errorMessage });
    }
});
console.log('Summarizer Routes: GET /news registered (protected)');


router.post('/summarize', protect, summarizeArticle);
console.log('Summarizer Routes: POST /summarize registered (protected)');


router.get('/my-summaries', protect, getSavedArticles);
console.log('Summarizer Routes: GET /my-summaries registered (protected)');


router.delete('/my-summaries/:id', protect, deleteArticle);
console.log('Summarizer Routes: DELETE /my-summaries/:id registered (protected)');


router.post('/key-takeaways', protect, generateKeyTakeaways);
console.log('Summarizer Routes: POST /key-takeaways registered (protected)');

export default router;
