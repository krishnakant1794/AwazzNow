import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;
function ResetPassword({ onPasswordResetSuccess }) {
  const { token } = useParams();   const navigate = useNavigate(); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);   const [error, setError] = useState(null);       const [loading, setLoading] = useState(false); 
    useEffect(() => {
    if (!token) {
      setError('No reset token found in the URL. Please request a new password reset link.');
    }
  }, [token]); 
  const handleSubmit = async (e) => {
    e.preventDefault();     setLoading(true);       setMessage(null);       setError(null);     
        if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;     }

        if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;     }

    try {
                  const response = await axios.put(`${BACKEND_API_BASE_URL}/auth/reset-password/${token}`, { password });
            setMessage(response.data.message || 'Your password has been reset successfully!');

            setTimeout(() => {
        onPasswordResetSuccess();       }, 3000);     } catch (err) {
      console.error('Reset password error:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Failed to reset password. The link might be invalid or expired. Please request a new one.');
    } finally {
      setLoading(false);     }
  };

  return (
        <div className="min-h-screen flex items-center justify-center">
      {/* Form card with theme-specific styling and fade-in animation */}
      {/* The .form-card class now has position: relative and z-index: 1 to ensure interactivity */}
      <div className="form-card p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
        {/* Heading with orange accent color */}
        <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-center text-gray-300">
            Enter your new password below.
          </p>
          {/* New Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-light-text">
              New Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-2 rounded-md shadow-sm form-input"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* Confirm New Password input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="mt-1 block w-full px-4 py-2 rounded-md shadow-sm form-input"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
