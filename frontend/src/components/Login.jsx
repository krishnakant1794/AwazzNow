import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react'; 

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

const Login = ({ onLoginSuccess, onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login: Attempting to log in with email:', email);
      const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/login`, { email, password });
      
      const { token, userId, username } = response.data;
      console.log('Login: Successful!', { userId, username }); 
      onLoginSuccess(token, userId, username); 
    } catch (err) {
      console.error('Login Error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background px-4 py-8 relative z-0 animate-fade-in-up">
      <div className="bg-dark-card-bg p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">Login to AwaazNow</h2>
        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-light-text text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 bg-gray-800 text-light-text rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 form-input"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-light-text text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-2 bg-gray-800 text-light-text rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 form-input pr-10"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-500 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-black py-2 rounded-md hover:bg-orange-600 transition duration-300 ease-in-out font-semibold flex items-center justify-center btn-orange-glow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-black mr-3"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-gray-400 text-sm">
          <button
            onClick={onSwitchToForgotPassword}
            className="text-orange-400 hover:underline transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md"
          >
            Forgot Password?
          </button>
          <p className="mt-3">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-orange-500 hover:underline transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
