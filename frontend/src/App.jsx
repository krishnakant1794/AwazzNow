import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { XCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'; 

import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL; 

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isAuthReady, setIsAuthReady] = useState(false); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null); 

  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false); 
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [generatingTakeaways, setGeneratingTakeaways] = useState(false); 

  const [searchQuery, setSearchQuery] = useState('l'); 
  const [category, setCategory] = useState('general'); 

  const [savedArticles, setSavedArticles] = useState([]);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [articleToDeleteId, setArticleToDeleteId] = useState(null);
  const [modalMessage, setModalMessage] = useState('');

  const initialHomeFetchDone = useRef(false);
  const initialMySummariesFetchDone = useRef(false);

  const categories = ['general', 'business', 'technology', 'sports', 'health', 'science', 'entertainment'];
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];

  const handleAuthSuccess = useCallback((newToken, newUserId, newUsername) => {
    console.log('TRACE: handleAuthSuccess - Login/Signup successful.');
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUserId(newUserId);
    setUsername(newUsername);
    setError(null); 
    navigate('/'); 
    setIsMobileMenuOpen(false); 
    console.log('TRACE: handleAuthSuccess - Redirected to /.');
  }, [navigate]);

  const handlePasswordResetSuccess = useCallback(() => {
    setError('Your password has been successfully reset. Please log in with your new password.');
    navigate('/login'); 
    console.log('TRACE: handlePasswordResetSuccess - Redirected to /login.');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    console.log('TRACE: handleLogout - Initiating logout process.');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setToken(null); 
    setUserId(null);
    setUsername(null);
    
    setSelectedArticle(null);
    setSummary('');
    setKeyTakeaways('');
    setArticles([]); 
    setSavedArticles([]);
    
    initialHomeFetchDone.current = false;
    initialMySummariesFetchDone.current = false;

    setIsMobileMenuOpen(false); 
    setError('You have been logged out.'); 
    navigate('/login'); 
    console.log('TRACE: handleLogout - Logout complete, redirected to /login.');
  }, [navigate]);

  const handleSwitchToSignup = useCallback(() => navigate('/signup'), [navigate]);
  const handleSwitchToLogin = useCallback(() => navigate('/login'), [navigate]);
  const handleSwitchToForgotPassword = useCallback(() => navigate('/forgot-password'), [navigate]);

  const fetchArticles = useCallback(async (query, selectedCategory) => {
    console.log(`TRACE: fetchArticles - Attempting to fetch articles via BACKEND for query: "${query}", category: "${selectedCategory}"`);
    setLoading(true);
    setError(null); 

    try {
      const queryToUse = query.trim() === '' ? 'latest news' : query; 
      const categoryParam = selectedCategory && selectedCategory !== 'general' ? `&category=${selectedCategory}` : '';
      
      const url = `${BACKEND_API_BASE_URL}/news?q=${encodeURIComponent(queryToUse)}${categoryParam}`;
      console.log("TRACE: fetchArticles - Calling BACKEND NEWS PROXY URL:", url);

      const cacheKey = `articles-backend-${selectedCategory}-${queryToUse}`;
      const cachedArticles = sessionStorage.getItem(cacheKey);
      if (cachedArticles) {
        setArticles(JSON.parse(cachedArticles));
        console.log(`TRACE: fetchArticles - Articles loaded from cache for "${queryToUse}" in "${selectedCategory}".`);
        setLoading(false);
        return; 
      }

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) { 
        setArticles([]); 
        setError(`No articles found for "${queryToUse}" in category "${selectedCategory}". Try a different search or category.`);
        console.log(`WARN: fetchArticles - No articles found from backend for "${queryToUse}" in "${selectedCategory}".`);
      } else {
        setArticles(response.data); 
        sessionStorage.setItem(cacheKey, JSON.stringify(response.data)); 
        setError(null); 
        console.log(`TRACE: fetchArticles - Successfully fetched ${response.data.length} articles from backend.`);
      }
    } catch (err) {
      console.error('ERROR: fetchArticles Failed (via Backend proxy):', err.response ? err.response.data : err.message);
      let errorMessage = 'Failed to fetch articles. Please check your network connection or try again.';
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Authentication failed for news fetch. Please log in again.';
          handleLogout(); 
        } else if (err.response.status === 429) {
          errorMessage = 'News API rate limit exceeded for the backend. Please try again later.';
        } else {
          errorMessage = `Failed to fetch news: ${err.response.status} - ${err.response.data?.message || err.message}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error or backend is unreachable. Check console for details.';
      }
      setError(errorMessage);
      setArticles([]); 
    } finally {
      setLoading(false);
      console.log('TRACE: fetchArticles - Loading state set to false.');
    }
  }, [BACKEND_API_BASE_URL, token, handleLogout]); 


  const fetchSavedArticles = useCallback(async () => {
    console.log('TRACE: fetchSavedArticles - Attempting to fetch saved articles.');
    if (!token || !isAuthReady) {
        console.log('TRACE: fetchSavedArticles - Skipping, token missing or auth not ready.');
        setSavedArticles([]); 
        return;
    }
    setLoading(true);
    setError(null); 
    try {
      console.log('TRACE: fetchSavedArticles - Making API call to backend /my-summaries.');
      const response = await axios.get(`${BACKEND_API_BASE_URL}/my-summaries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSavedArticles(response.data);
      console.log(`TRACE: fetchSavedArticles - Successfully fetched ${response.data.length} saved articles.`);
    } catch (err) {
      console.error('ERROR: fetchSavedArticles Failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to load your saved summaries. Please log in again.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('WARN: fetchSavedArticles - Token invalid/expired from backend, initiating logout.');
        handleLogout();
      }
    } finally {
      setLoading(false);
      console.log('TRACE: fetchSavedArticles - Loading state set to false.');
    }
  }, [token, isAuthReady, handleLogout, BACKEND_API_BASE_URL]); 

  const handleDeleteArticleClick = useCallback((articleId) => {
    console.log(`TRACE: handleDeleteArticleClick - Preparing to delete article ID: ${articleId}`);
    setArticleToDeleteId(articleId);
    setModalMessage("Are you sure you want to delete this saved article?");
    setShowConfirmDeleteModal(true);
  }, []);

  const confirmDeletion = useCallback(async () => {
    console.log(`TRACE: confirmDeletion - User confirmed deletion for article ID: ${articleToDeleteId}`);
    setShowConfirmDeleteModal(false); 
    if (!token) {
      setError('You must be logged in to delete articles.');
      console.error('ERROR: confirmDeletion - No token found for deletion.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${BACKEND_API_BASE_URL}/my-summaries/${articleToDeleteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('TRACE: confirmDeletion - Article deleted successfully on backend!');
      fetchSavedArticles(); 
    } catch (err) {
      console.error('ERROR: confirmDeletion Failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to delete article.');
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setLoading(false);
      setArticleToDeleteId(null); 
      console.log('TRACE: confirmDeletion - Deletion process completed.');
    }
  }, [articleToDeleteId, token, fetchSavedArticles, handleLogout, BACKEND_API_BASE_URL]);

  const cancelDeletion = useCallback(() => {
    console.log('TRACE: cancelDeletion - User cancelled deletion.');
    setShowConfirmDeleteModal(false); 
    setArticleToDeleteId(null); 
  }, []); 

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault(); 
    console.log('TRACE: handleSearchSubmit - Form submitted. Query:', searchQuery, 'Category:', category);
    
    initialHomeFetchDone.current = false;
    initialMySummariesFetchDone.current = false;

    if (token) {
        const queryToUse = searchQuery.trim() === '' ? 'latest news' : searchQuery; 
        if (location.pathname !== '/') {
          console.log('TRACE: handleSearchSubmit - Navigating to / before fetching articles.');
          navigate('/');
        }
        fetchArticles(queryToUse, category);
    } else {
        setError('Please log in to search and view news.');
        navigate('/login');
        console.log('TRACE: handleSearchSubmit - User not logged in, redirecting to /login.');
    }
    setIsMobileMenuOpen(false);
  }, [searchQuery, category, token, location.pathname, navigate, fetchArticles]);

  const handleCategoryClick = useCallback((newCategory) => {
    console.log('TRACE: handleCategoryClick - Category button clicked. New Category:', newCategory);
    setCategory(newCategory); 
    setSelectedArticle(null); 
    setSummary(''); setKeyTakeaways(''); 
    setIsMobileMenuOpen(false); 

    initialHomeFetchDone.current = false;
    initialMySummariesFetchDone.current = false;

    if (location.pathname !== '/') {
      console.log('TRACE: handleCategoryClick - Navigating to / before fetching articles.');
      navigate('/');
    }
    const queryToUse = searchQuery.trim() === '' ? 'latest news' : searchQuery; 
    fetchArticles(queryToUse, newCategory);
  }, [setCategory, setSelectedArticle, setSummary, setKeyTakeaways, setIsMobileMenuOpen, location.pathname, navigate, searchQuery, fetchArticles]);

  const handleMySummariesClick = useCallback(() => {
    console.log('TRACE: handleMySummariesClick - "My Summaries" button clicked. Current Token:', token ? 'Exists' : 'Null');
    navigate('/my-summaries');
    setIsMobileMenuOpen(false);
    setSelectedArticle(null); setSummary(''); setKeyTakeaways('');
    initialHomeFetchDone.current = false;
  }, [navigate, token]);

  const handleHomeClick = useCallback(() => {
    console.log('TRACE: handleHomeClick - "Home" button clicked. Current Token:', token ? 'Exists' : 'Null');
    navigate('/');
    setIsMobileMenuOpen(false);
    setSelectedArticle(null); setSummary(''); setKeyTakeaways('');
    initialMySummariesFetchDone.current = false;
  }, [navigate, token]);


  const summarizeAndSaveArticle = async (article) => {
    console.log('TRACE: summarizeAndSaveArticle - Initiating summarization for article:', article.title);
    if (!token) { setError('Please log in to summarize and save articles.'); return; }
    setSummarizing(true); setSummary('');
    const articleContent = article.content || article.description;
    if (!articleContent || articleContent.length < 50) { setSummary('Content too short to summarize.'); setSummarizing(false); return; }
    const articleData = { title: article.title, url: article.url, sourceName: article.source.name, imageUrl: article.urlToImage, content: articleContent };
    try {
      const response = await axios.post(`${BACKEND_API_BASE_URL}/summarize`, articleData, { headers: { 'Authorization': `Bearer ${token}` } });
      setSummary(response.data.summary);
      if (response.data.articleSaved) { console.log('TRACE: Article summarized and saved successfully!'); if (location.pathname === '/my-summaries') { fetchSavedArticles(); } }
    } catch (err) {
      console.error('ERROR: Summarize API call failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to summarize article via backend.');
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally { setSummarizing(false); }
  };

  const generateKeyTakeaways = async (article) => {
    console.log('TRACE: generateKeyTakeaways - Initiating key takeaway generation for article:', article.title);
    if (!token) { setError('Login is recommended for full features like generating takeaways.'); }
    setGeneratingTakeaways(true); setKeyTakeaways('');
    const articleContent = article.content || article.description;
    if (!articleContent || articleContent.length < 50) { setKeyTakeaways('Content too short to extract key takeaways.'); setGeneratingTakeaways(false); return; } 
    try {
      const response = await axios.post(`${BACKEND_API_BASE_URL}/key-takeaways`, { content: articleContent }, { headers: { 'Authorization': `Bearer ${token}` } });
      setKeyTakeaways(response.data.takeaways);
    } catch (err) {
      console.error('ERROR: Key Takeaways API call failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Failed to generate key takeaways.');
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally { setGeneratingTakeaways(false); }
  };

  useEffect(() => {
    console.log('TRACE: useEffect 1 (Auth Init) - Component mounted. Checking localStorage for auth.');
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (storedToken) {
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      console.log('TRACE: useEffect 1 (Auth Init) - Token found. User previously logged in.');
    } else {
      console.log('TRACE: useEffect 1 (Auth Init) - No token found. User is logged out or first visit.');
    }
    setIsAuthReady(true); 
    console.log('TRACE: useEffect 1 (Auth Init) - isAuthReady set to true. Rendering can now proceed.');
  }, []); 

  useEffect(() => {
    console.log(`TRACE: useEffect 2 (Main Logic) - Re-running. AuthReady: ${isAuthReady}, Token: ${token ? 'Exists' : 'Null'}, Path: ${location.pathname}`);

    if (!isAuthReady) {
      console.log('TRACE: useEffect 2 (Main Logic) - Waiting for isAuthReady to be true. Skipping logic.');
      return;
    }

    const currentPathIsAuth = authPaths.some(path => location.pathname.startsWith(path));
    const currentPathIsHome = location.pathname === '/';
    const currentPathIsMySummaries = location.pathname === '/my-summaries';

    if (!token) {
      console.log('TRACE: useEffect 2 (Main Logic) - User is NOT authenticated.');
      if (!currentPathIsAuth) {
        console.log('TRACE: useEffect 2 (Main Logic) - Not on auth path, redirecting to /login.');
        navigate('/login');
        setError('Please log in to access this page.');
      } else {
        console.log('TRACE: useEffect 2 (Main Logic) - Already on an auth path. Staying.');
      }
      return; 
    }

    console.log('TRACE: useEffect 2 (Main Logic) - User IS authenticated.');
    
    if (currentPathIsAuth && !location.pathname.startsWith('/reset-password/')) {
        console.log('TRACE: useEffect 2 (Main Logic) - Authenticated on auth path. Redirecting to /.');
        navigate('/', { replace: true }); 
        return; 
    }

    if (currentPathIsHome) {
      if (!initialHomeFetchDone.current) {
        console.log('TRACE: useEffect 2 (Main Logic) - On Home path. Initiating initial fetchArticles.');
        const queryToUse = searchQuery.trim() === '' ? 'latest news' : searchQuery;
        fetchArticles(queryToUse, category);
        initialHomeFetchDone.current = true; 
      } else {
        console.log('TRACE: useEffect 2 (Main Logic) - On Home path. Articles already fetched for this session.');
      }
      initialMySummariesFetchDone.current = false; 
    } else if (currentPathIsMySummaries) {
      if (!initialMySummariesFetchDone.current) {
        console.log('TRACE: useEffect 2 (Main Logic) - On My Summaries path. Initiating initial fetchSavedArticles.');
        fetchSavedArticles();
        initialMySummariesFetchDone.current = true; 
      } else {
        console.log('TRACE: useEffect 2 (Main Logic) - On My Summaries path. Saved articles already fetched for this session.');
      }
      initialHomeFetchDone.current = false; 
    } else {
        console.log('TRACE: useEffect 2 (Main Logic) - Authenticated on unhandled path. Ensuring fetch flags are reset.');
        initialHomeFetchDone.current = false;
        initialMySummariesFetchDone.current = false;
    }

  }, [token, location.pathname, isAuthReady, navigate, fetchArticles, fetchSavedArticles, searchQuery, category]); 

  const isMySummariesView = location.pathname === '/my-summaries';

  if (!isAuthReady) {
    console.log('RENDER: Displaying Loading Screen. (isAuthReady: false)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-background text-light-text">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-orange-500 border-opacity-75"></div>
        <p className="ml-4">Loading application...</p>
      </div>
    );
  }

  if (!token) {
    console.log('RENDER: Displaying Authentication Routes. (isAuthReady: true, token: null)');
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleAuthSuccess} onSwitchToSignup={handleSwitchToSignup} onSwitchToForgotPassword={handleSwitchToForgotPassword} />} />
        <Route path="/signup" element={<Signup onSignupSuccess={handleAuthSuccess} onSwitchToLogin={handleSwitchToLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword onSwitchToLogin={handleSwitchToLogin} />} />
        <Route path="/reset-password/:token" element={<ResetPassword onPasswordResetSuccess={handlePasswordResetSuccess} />} />
        <Route path="*" element={<Login onLoginSuccess={handleAuthSuccess} onSwitchToSignup={handleSwitchToSignup} onSwitchToForgotPassword={handleSwitchToForgotPassword} />} />
      </Routes>
    );
  }

  console.log('RENDER: Displaying Main Application UI. (isAuthReady: true, token: exists)');
  return (
    <div className="min-h-screen font-sans text-light-text relative z-10">
      <header className="bg-black shadow-lg fixed w-full z-10 top-0 text-light-text">
        <div className="container mx-auto px-4 py-4 flex flex-wrap md:flex-nowrap items-center justify-between">
          <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-orange-500 mr-6">AwaazNow</h1>
            <button
              className="md:hidden p-2 text-light-text hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              )}
            </button>
          </div>

          <nav className="hidden md:flex space-x-6 items-center">
            <button
              className="text-light-text hover:text-orange-500 font-medium transition duration-300 ease-in-out"
              onClick={handleHomeClick}
            >
              Home
            </button>
            <button
              className="text-light-text hover:text-orange-500 font-medium transition duration-300 ease-in-out"
              onClick={handleMySummariesClick}
            >
              My Summaries
            </button>
            {username && (
              <span className="text-light-text text-sm font-semibold ml-4">Welcome, {username}!</span>
            )}
            <button
              onClick={handleLogout}
              className="ml-4 bg-orange-500 text-black px-4 py-2 rounded-md hover:bg-orange-600 transition duration-300 ease-in-out text-sm font-medium btn-orange-glow"
            >
              Logout
            </button>
          </nav>

          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto mt-4 md:mt-0">
            <input
              type="text"
              placeholder="Search news..."
              className="px-4 py-2 border border-gray-700 rounded-l-md text-light-text focus:outline-none focus:ring-2 focus:ring-orange-500 w-full form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-orange-500 text-black px-6 py-2 rounded-r-md hover:bg-orange-600 transition duration-300 ease-in-out btn-orange-glow"
            >
              Search
            </button>
          </form>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-black shadow-lg py-4 w-full border-t border-gray-700 transition-all duration-300 ease-in-out transform origin-top animate-slide-down">
            <nav className="flex flex-col items-center space-y-4">
              <button
                className="text-light-text hover:text-orange-500 font-medium w-full text-center py-2 transition duration-300 ease-in-out"
                onClick={handleHomeClick}
              >
                Home
              </button>
              <button
                className="text-light-text hover:text-orange-500 font-medium w-full text-center py-2 transition duration-300 ease-in-out"
                onClick={handleMySummariesClick}
              >
                My Summaries
              </button>
              {username && (
                <span className="text-light-text text-sm font-semibold py-2">Welcome, {username}!</span>
              )}
              <button
                onClick={handleLogout}
                className="bg-orange-500 text-black px-4 py-2 rounded-md hover:bg-orange-600 transition duration-300 ease-in-out text-sm font-medium w-full text-center btn-orange-glow"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-lg shadow-md text-sm font-medium bg-red-500 text-white animate-fade-in">
          {error}
        </div>
      )}

      
      {!isMySummariesView && (
        <section className="bg-black shadow-sm mt-20 md:mt-24 py-3 sticky top-0 z-10 border-b border-gray-700">
          <div className="container mx-auto px-4 flex overflow-x-auto whitespace-nowrap scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-5 py-2 mr-3 rounded-full text-sm font-semibold transition-colors duration-300 ease-in-out
                    ${category === cat
                        ? 'category-btn-active'
                        : 'category-btn-inactive'
                    }
                `}
                onClick={() => handleCategoryClick(cat)} 
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <main className={`container mx-auto px-4 py-8 ${isMySummariesView ? 'mt-24' : 'mt-0'} flex flex-col lg:flex-row page-transition-enter page-transition-enter-active`}>
        <Routes>
          
          <Route path="/" element={
            <>
              <section className="lg:w-2/3 lg:pr-8 mb-8 lg:mb-0">
                <h2 className="text-2xl font-bold text-light-text mb-6">Latest Articles</h2>

                {loading && (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-orange-500 border-opacity-75"></div>
                    <p className="ml-4 text-orange-500">Loading articles...</p>
                  </div>
                )}

                
                {error && articles.length === 0 && (
                  <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded relative animate-fade-in" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                  </div>
                )}

                {!loading && !error && articles.length === 0 && (
                  <div className="bg-blue-900 border border-blue-600 text-blue-200 px-4 py-3 rounded relative animate-fade-in" role="alert">
                    <strong className="font-bold">Info:</strong>
                    <span className="block sm:inline ml-2">No articles found for the current selection. Try a different search or category.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.map((article, index) => (
                    <div
                      key={article.url || index} 
                      className="bg-dark-card-bg rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 ease-in-out border border-gray-700 transform hover:scale-[1.02] animate-fade-in"
                      onClick={() => {
                        console.log('TRACE: News card clicked:', article.title);
                        setSelectedArticle(article);
                        setSummary(''); 
                        setKeyTakeaways(''); 
                      }}
                    >
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt={article.title || 'Article Image'}
                          className="w-full h-48 object-cover object-center rounded-t-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/600x400/333/E0E7FF?text=No+Image`; 
                          }}
                        />
                      )}
                      {!article.urlToImage && ( 
                          <img
                              src={`https://placehold.co/600x400/333/E0E7FF?text=No+Image`}
                              alt="No Image Available"
                              className="w-full h-48 object-cover object-center rounded-t-lg"
                          />
                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold mb-2 text-light-text">{article.title}</h3>
                        <p className="text-sm text-gray-400">Source: <span className="font-medium text-orange-400">{article.source.name}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              
              <aside className="lg:w-1/3 sticky top-28 h-fit animate-fade-in">
                {selectedArticle ? (
                  <div className="bg-dark-card-bg rounded-lg shadow-lg p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-light-text">{selectedArticle.title}</h2>
                    {selectedArticle.urlToImage && (
                      <img
                        src={selectedArticle.urlToImage}
                        alt={selectedArticle.title || 'Article Image'}
                        className="w-full h-56 object-cover object-center rounded-md mb-4"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/600x400/333/E0E7FF?text=No+Image`;
                        }}
                      />
                    )}
                    {!selectedArticle.urlToImage && (
                        <img
                            src={`https://placehold.co/600x400/333/E0E7FF?text=No+Image`}
                            alt="No Image Available"
                            className="w-full h-56 object-cover object-center rounded-md mb-4"
                        />
                    )}
                    <p className="text-sm text-gray-400 mb-1">
                      Source: <span className="font-semibold text-orange-400">{selectedArticle.source.name}</span>
                    </p>
                    {selectedArticle.author && (
                      <p className="text-sm text-gray-400 mb-1">Author: {selectedArticle.author}</p>
                    )}
                    <p className="text-sm text-gray-400 mb-4">
                      Published: {new Date(selectedArticle.publishedAt).toLocaleDateString()}
                    </p>
                    <p className="text-light-text mb-6 leading-relaxed">{selectedArticle.description}</p>
                    {selectedArticle.content && (
                      <p className="text-gray-300 mb-6 leading-relaxed">{selectedArticle.content.split('[')[0]}...</p>
                    )}

                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-orange-500 text-black px-6 py-3 rounded-md hover:bg-orange-600 transition duration-300 ease-in-out text-center font-medium shadow-md btn-orange-glow"
                    >
                      Read Full Article
                    </a>

                    <div className="mt-6 border-t pt-6 border-gray-700 space-y-4">
                      <button
                        onClick={() => summarizeAndSaveArticle(selectedArticle)}
                        className="w-full bg-orange-600 text-black px-6 py-3 rounded-md hover:bg-orange-700 transition duration-300 ease-in-out text-center font-medium shadow-md flex items-center justify-center btn-orange-glow"
                        disabled={summarizing}
                      >
                        {summarizing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-black mr-3"></div>
                            Summarizing & Saving...
                          </>
                        ) : (
                          'Summarize & Save with AI ✨'
                        )}
                      </button>
                      {summary && (
                        <div className="p-4 bg-orange-950 rounded-md border border-orange-700 text-orange-100 animate-fade-in">
                          <h4 className="font-semibold mb-2">AI Summary:</h4>
                          <p className="whitespace-pre-line">{summary}</p>
                        </div>
                      )}

                      <button
                        onClick={() => generateKeyTakeaways(selectedArticle)}
                        className="w-full bg-orange-600 text-black px-6 py-3 rounded-md hover:bg-orange-700 transition duration-300 ease-in-out text-center font-medium shadow-md flex items-center justify-center btn-orange-glow"
                        disabled={generatingTakeaways}
                      >
                        {generatingTakeaways ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-black mr-3"></div>
                            Getting Takeaways...
                          </>
                        ) : (
                          'Get Key Takeaways ✨'
                        )}
                      </button>
                      {keyTakeaways && (
                        <div className="p-4 bg-orange-900 rounded-md border border-orange-600 text-orange-50 animate-fade-in">
                          <h4 className="font-semibold mb-2">Key Takeaways:</h4>
                          <p className="whitespace-pre-line">{keyTakeaways}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-dark-card-bg rounded-lg shadow-lg p-6 text-center text-gray-400 border border-gray-700 animate-fade-in">
                    <p>Click on an article from the list to view its details.</p>
                  </div>
                )}
              </aside>
            </>
          } />

          
          <Route path="/my-summaries" element={
            <section className="w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-light-text mb-6">My Saved Summaries</h2>

            {loading && (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-orange-500 border-opacity-75"></div>
                <p className="ml-4 text-orange-500">Loading saved articles...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded relative animate-fade-in" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}

            {!loading && !error && savedArticles.length === 0 && (
              <div className="bg-blue-900 border border-blue-600 text-blue-200 px-4 py-3 rounded relative animate-fade-in" role="alert">
                <strong className="font-bold">Info:</strong>
                <span className="block sm:inline ml-2">You haven't saved any summaries yet. Summarize an article to save it!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedArticles.map((article) => ( 
                <div
                  key={article._id} 
                  className="bg-dark-card-bg rounded-lg shadow-lg overflow-hidden border border-gray-700 transform hover:scale-[1.02] transition-transform duration-300 ease-in-out animate-fade-in"
                >
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title || 'Saved Article Image'}
                      className="w-full h-48 object-cover object-center rounded-t-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/600x400/333/E0E7FF?text=No+Image`;
                      }}
                    />
                  )}
                  {!article.imageUrl && (
                      <img
                          src={`https://placehold.co/600x400/333/E0E7FF?text=No+Image`}
                          alt="No Image Available"
                          className="w-full h-48 object-cover object-center rounded-t-lg"
                      />
                  )}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold mb-2 text-light-text">{article.title}</h3>
                    <p className="text-sm text-gray-400 mb-1">Source: <span className="font-medium text-orange-400">{article.sourceName}</span></p>
                    <p className="text-sm text-gray-400 mb-4">Saved: {new Date(article.savedAt).toLocaleDateString()}</p>
                    <h4 className="font-semibold text-light-text mb-2">AI Summary:</h4>
                    <p className="whitespace-pre-line text-gray-300">{article.summarizedContent}</p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block bg-orange-500 text-black px-4 py-2 rounded-md hover:bg-orange-600 transition duration-300 text-sm font-medium btn-orange-glow"
                      >
                        Read Original Article
                      </a>
                      <button
                        onClick={() => handleDeleteArticleClick(article._id)} 
                        className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 text-sm font-medium btn-orange-glow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          } />
          
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </main>

      
      {showConfirmDeleteModal && (
        <ConfirmationModal
          message={modalMessage}
          onConfirm={confirmDeletion}
          onCancel={cancelDeletion}
        />
      )}

      <footer className="bg-black text-light-text text-center py-6 mt-10">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} AwaazNow. All rights reserved.</p>

          <div className="flex justify-center space-x-6 mt-4">
            <a
              href="https://github.com/krishnakant1794"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-300 ease-in-out"
              aria-label="GitHub"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.499.09.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.909-.621.068-.608.068-.608 1.007.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.356-1.088.654-1.336-2.22-.251-4.555-1.113-4.555-4.93 0-1.09.39-1.984 1.029-2.675-.103-.252-.446-1.268.099-2.64 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.701.111 2.5.322 1.909-1.295 2.747-1.025 2.747-1.025.546 1.372.202 2.388.099 2.64.64.691 1.028 1.585 1.028 2.675 0 3.822-2.339 4.673-4.566 4.92.359.309.678.92.678 1.855 0 1.336-.012 2.419-.012 2.747 0 .268.183.592.687.483C21.133 20.2 24 16.444 24 12.017 24 6.484 19.522 2 14 2h-2z" clipRule="evenodd" />
              </svg>
            </a>

            <a
              href="https://www.linkedin.com/in/krishnakant-kumar1794/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-300 ease-in-out"
              aria-label="LinkedIn"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.529v-5.597c0-1.334-.027-3.057-1.853-3.057-1.853 0-2.136 1.445-2.136 2.96v5.694H9.357V9.227h3.38v1.547h.045c.478-.89 1.635-1.83 3.32-1.83 3.55 0 4.204 2.327 4.204 6.75V20.452zM5.337 7.433a2.46 2.46 0 01-2.46-2.459c0-1.353 1.107-2.461 2.46-2.461 1.346 0 2.46.945 2.46 2.461 0 1.358-1.114 2.459-2.46 2.459zM3.864 9.227h3.044v11.225H3.864V9.227z" />
              </svg>
            </a>

            <a
              href="https://x.com/Krishnakant8281"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-300 ease-in-out"
              aria-label="X (formerly Twitter)"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.21-.689L4.12 2.25H1l8.36 11.09L1.474 21.75H4.89L11.065 13.06L18.244 2.25zm-2.93 17.175L3.78 3.375H12.6L20.22 21H15.31l-5.83-7.79L16.17 19.425z" />
              </svg>
            </a>

            <a
              href="https://www.facebook.com/share/1EK453BELL/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-300 ease-in-out"
              aria-label="Facebook"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.815c-3.238 0-5.185 1.233-5.185 4.506v2.161z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/kris.hna1794"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-300 ease-in-out"
              aria-label="Instagram"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.779 1.638 4.938 4.938.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.148 3.252-1.638 4.779-4.938-4.938-.934.045-1.28.062-4.85.062s-3.916-.017-4.85-.062c-3.252-.148-4.779-1.638-4.938-4.938-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148 3.252 1.638 4.779 4.938-4.938.934-.045 1.28-.062 4.85-.062zm0-2.163c-3.259 0-3.667.014-4.947.072C2.71 1.71 1.714 2.71 1.586 4.027c-.058 1.28-.074 1.687-.074 4.947s.016 3.667.074 4.947c.126 1.317 1.122 2.313 2.439 2.439 1.28.058 1.687.074 4.947.074s3.667-.016 4.947-.074c1.317-.126 2.313-1.122 2.439-2.439.058-1.28.074-1.687.074-4.947s-.016-3.667-.074-4.947c-.126-1.317-1.122-2.313-2.439-2.439C15.667 0 15.259.014 12 .014zm0 6.868c-2.481 0-4.5 2.019-4.5 4.5s2.019 4.5 4.5 4.5 4.5-2.019 4.5-4.5-2.019-4.5-4.5-4.5zm0 2.163c1.353 0 2.459 1.107 2.459 2.459s-1.107 2.459-2.459 2.459-2.459-1.107-2.459-2.459 1.107-2.459 2.459-2.459zm6.095-2.228c-.822 0-1.49.667-1.49 1.49s.668 1.49 1.49 1.49 1.49-.667 1.49-1.49-.668-1.49-1.49-1.49z" />
              </svg>
            </a>
          </div>

          <p className="text-sm mt-4">Designed by <strong>Krishnakant Kumar</strong> 🎓<strong>B.Tech CSE</strong>  🏫 <strong>Central University of Jharkhand</strong> 🕒 on 15/06/25 Powered by NewsAPI, Google Gemini AI, and MongoDB.</p>
        </div>
      </footer>
    </div>
  );
}
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-dark-card-bg p-8 rounded-lg shadow-2xl w-full max-w-sm border border-gray-700 transform scale-95 animate-scale-up">
        <h3 className="text-xl font-bold text-orange-500 mb-4 text-center">Confirm Action</h3>
        <p className="text-light-text mb-6 text-center">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 text-light-text rounded-md hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
          >
            <XCircle size={20} className="mr-2" /> Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center btn-orange-glow"
          >
            <CheckCircle size={20} className="mr-2" /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
function HomeRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    console.log('TRACE: HomeRedirect - Triggered. Navigating to /.');
    navigate('/', { replace: true }); 
  }, [navigate]);
  return null; 
}
function App() {
  console.log('TRACE: App component mounted. Initializing Router.');
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;






