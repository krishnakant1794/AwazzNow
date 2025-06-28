import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react'; 
const BACKEND_API_BASE_URL = 'http://localhost:5000/api';
const Login = ({ onLoginSuccess, onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
    const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 
    try {
            const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      console.log('Login successful:', response.data);
            onLoginSuccess(response.data.token, response.data._id, response.data.username);

    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4 animate-fade-in">
      <div className="bg-dark-card-bg p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-orange-500 mb-8">Login to AwaazNow</h2>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded relative mb-6 animate-fade-in" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-light-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="form-input w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-light-text focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"               placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Refined positioning for the eye icon */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500 transition-colors duration-200 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-black py-2 rounded-md hover:bg-orange-700 transition duration-300 font-semibold text-lg flex items-center justify-center btn-orange-glow"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-black mr-3"></div>
                Logging In...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-orange-500 hover:text-orange-400 font-medium ml-1 focus:outline-none"
            >
              Sign Up
            </button>
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <button
              onClick={onSwitchToForgotPassword}
              className="text-orange-500 hover:text-orange-400 font-medium focus:outline-none"
            >
              Forgot Password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
