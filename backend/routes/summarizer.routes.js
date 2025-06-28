// backend/routes/summarizer.routes.js
import express from 'express';
import axios from 'axios'; // Import axios to make HTTP requests to NewsAPI

import { summarizeArticle, getSavedArticles, deleteArticle, generateKeyTakeaways } from '../controllers/summarizer.controller.js';
import { protect } from '../middleware/auth.middleware.js'; 

const router = express.Router();

console.log('Summarizer Routes: Initializing routes...');

// --- NEW ROUTE: Fetch News Articles from NewsAPI ---
router.get('/news', protect, async (req, res) => {
    console.log('Backend: GET /api/news received. Fetching articles...');
    const { q, category } = req.query; // Get search query and category from frontend

    // Ensure the NewsAPI key is available from environment variables
    const NEWS_API_KEY_BACKEND = process.env.NEWS_API_KEY; 
    if (!NEWS_API_KEY_BACKEND) {
        console.error('Backend: NewsAPI key (process.env.NEWS_API_KEY) is not set!');
        return res.status(500).json({ message: 'NewsAPI key is not configured on the server. Please check backend environment variables.' });
    }

    try {
        const queryToUse = q && q.trim() !== '' ? q.trim() : 'latest news'; // Default to 'latest news' if query is empty
        const categoryParam = category && category !== 'general' ? `&category=${category}` : '';
        
        // Construct the URL to NewsAPI (using the backend's secure key)
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(queryToUse)}${categoryParam}&language=en&apiKey=${NEWS_API_KEY_BACKEND}`;
        
        console.log('Backend: Making external call to NewsAPI URL:', newsApiUrl);
        
        const response = await axios.get(newsApiUrl);
        
        // Send only the articles array back to the frontend
        res.json(response.data.articles);
        console.log(`Backend: Successfully fetched ${response.data.articles.length} articles from NewsAPI.`);

    } catch (error) {
        console.error('Backend Error: Failed to fetch news from NewsAPI:', error.response ? error.response.data : error.message);
        let errorMessage = 'Failed to fetch news from external API.';
        let statusCode = 500;

        if (error.response) {
            // NewsAPI specific errors
            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'Backend\'s NewsAPI key is invalid or unauthorized.';
                statusCode = 401; // Reflect original error status
            } else if (error.response.status === 429) {
                errorMessage = 'NewsAPI rate limit exceeded for the backend. Please try again later.';
                statusCode = 429; // Reflect original error status
            } else {
                errorMessage = `NewsAPI returned status ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`;
                statusCode = error.response.status;
            }
        } else if (error.request) {
            // Request was made but no response received (e.g., network issue)
            errorMessage = 'Network error when trying to reach NewsAPI.';
            statusCode = 503; // Service Unavailable
        } else {
            // Something else happened in setting up the request
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
