
import axios from 'axios';
import SavedArticle from '../models/savedArticle.model.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });




export const summarizeArticle = async (req, res) => {
  
  const { title, url, sourceName, imageUrl, content } = req.body;

  
  const userId = req.user._id; 
  console.log('Summarize Article: User ID from req.user._id:', userId); 

  if (!title || !url || !content || !userId) { 
    console.error('Summarize Article: Missing required article data (title, url, content, or userId).');
    return res.status(400).json({ message: 'Missing required article data for summarization.' });
  }
  if (content.length < 100) {
    console.warn('Summarize Article: Article content too short for meaningful summarization.');
    return res.status(400).json({ message: 'Article content too short for summarization.' });
  }

  try {
    
    
    if (!req.user || req.user._id.toString() !== userId.toString()) { 
      console.warn(`Summarize Article: Authorization mismatch. Token user ID: ${req.user?._id}, Attempted user ID: ${userId}.`);
      return res.status(401).json({ message: 'User not authenticated or authorized to save this article.' });
    }

    const existingArticle = await SavedArticle.findOne({ url: url, user: userId });
    if (existingArticle) {
      console.log(`Summarize Article: Article already saved by user ${userId}. Returning cached summary.`);
      return res.status(200).json({ message: 'Article already summarized and saved by this user.', summary: existingArticle.summarizedContent, articleSaved: false });
    }

    console.log(`Summarize Article: Starting AI summarization for user ${userId} using gemini-2.0-flash.`);
    const prompt = `Please summarize the following news article content concisely, highlighting the main points. Keep the summary to around 3-5 sentences.\n\nArticle Content:\n"${content}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary) {
      console.error('Summarize Article: AI summarization failed to return content.');
      throw new Error('AI summarization failed to return content.');
    }
    console.log('Summarize Article: AI summarization successful.');

    const newSavedArticle = new SavedArticle({
      user: userId, 
      title,
      url,
      sourceName,
      imageUrl,
      originalContent: content,
      summarizedContent: summary,
    });

    await newSavedArticle.save();
    console.log(`Summarize Article: Article saved to DB for user ${userId}. Article ID: ${newSavedArticle._id}`);

    res.status(201).json({
      message: 'Article summarized and saved successfully!',
      summary: summary,
      articleSaved: true,
      savedArticle: newSavedArticle,
    });

  } catch (error) {
    console.error('Error in summarizeArticle:', error);
    if (error.response) {
      console.error('Axios error response data:', error.response.data);
      console.error('Axios error response status:', error.response.status);
      console.error('Axios error response headers:', error.response.headers);
    }
    res.status(500).json({ message: 'Failed to summarize or save article.', error: error.message });
  }
};





export const getSavedArticles = async (req, res) => {
  if (!req.user || !req.user._id) {
    console.error('BACKEND: getSavedArticles: req.user is not populated or missing _id. This should not happen if protect middleware is working.');
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  console.log('BACKEND: getSavedArticles controller reached. User ID:', req.user._id);
  try {
    const articles = await SavedArticle.find({ user: req.user._id }).sort({ savedAt: -1 });
    console.log('BACKEND: Found', articles.length, 'saved articles for user:', req.user._id);
    res.status(200).json(articles);
  } catch (error) {
    console.error('BACKEND: Error in getSavedArticles:', error);
    res.status(500).json({ message: 'Failed to retrieve saved articles.', error: error.message });
  }
};




export const deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id;

    
    const article = await SavedArticle.findOne({ _id: articleId, user: req.user._id });

    if (!article) {
      console.warn(`Delete Article: Article with ID ${articleId} not found or not owned by user ${req.user._id}.`);
      return res.status(404).json({ message: 'Article not found or you are not authorized to delete it.' });
    }

    await SavedArticle.deleteOne({ _id: articleId });
    console.log(`Delete Article: Article ${articleId} deleted successfully by user ${req.user._id}.`);

    res.status(200).json({ message: 'Article deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteArticle:', error);
    res.status(500).json({ message: 'Failed to delete article.', error: error.message });
  }
};




export const generateKeyTakeaways = async (req, res) => {
  const { content } = req.body;

  if (!content || content.length < 50) {
    console.warn('Generate Key Takeaways: Content too short or missing.');
    return res.status(400).json({ message: 'Content too short or missing for key takeaways generation.' });
  }

  try {
    
    if (!req.user || !req.user._id) { 
        console.warn('Generate Key Takeaways: User not authenticated.');
        return res.status(401).json({ message: 'User not authenticated to generate key takeaways.' });
    }

    console.log(`Generate Key Takeaways: Starting AI generation for user ${req.user._id} using gemini-2.0-flash.`);
    const prompt = `From the following article content, extract 3-5 key takeaways or main points. Present them as a numbered list.\n\nArticle Content:\n"${content}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const takeaways = response.text();

    if (!takeaways) {
      console.error('Generate Key Takeaways: AI generation failed to return content.');
      throw new Error('AI key takeaways generation failed to return content.');
    }
    console.log('Generate Key Takeaways: AI generation successful.');

    res.status(200).json({ takeaways });
  } catch (error) {
    console.error('Error in generateKeyTakeaways:', error);
    res.status(500).json({ message: 'Failed to generate key takeaways.', error: error.message });
  }
};

