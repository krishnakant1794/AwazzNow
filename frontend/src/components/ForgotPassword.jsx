import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_API_BASE_URL = 'http://localhost:5000/api';
function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);   const [error, setError] = useState(null);       const [loading, setLoading] = useState(false); 
  const handleSubmit = async (e) => {
    e.preventDefault();     setLoading(true);       setMessage(null);       setError(null);

    try {
            const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/forgot-password`, { email });
            setMessage(response.data.message || 'Password reset link sent to your email.');
    } catch (err) {
      console.error('Forgot password error:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);     }
  };

  return (
        <div className="min-h-screen flex items-center justify-center">
      {/* Form card with theme-specific styling and fade-in animation */}
      {/* The .form-card class now has position: relative and z-index: 1 to ensure interactivity */}
      <div className="form-card p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
        {/* Heading with orange accent color */}
        <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-center text-gray-300">
            Enter your registered email address to receive a password reset link.
          </p>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light-text">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-2 rounded-md shadow-sm form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {/* Display success message */}
          {message && (
            <div className="text-green-500 text-sm text-center">{message}</div>
          )}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-black bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out btn-orange-glow"
            disabled={loading}           >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
        {/* Link back to the Login page */}
        <p className="mt-6 text-center text-gray-300">
          Remember your password?{' '}
          <button
            onClick={onSwitchToLogin}             className="font-medium text-orange-400 hover:text-orange-300 focus:outline-none transition duration-300 ease-in-out"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

