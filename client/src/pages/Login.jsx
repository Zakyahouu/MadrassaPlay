// client/src/pages/Login.jsx
import React, { useState, useContext } from 'react'; // 1. Import useContext
import { AuthContext } from '../context/AuthContext'; // 2. Import our AuthContext

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3. Get the login function from our context
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 4. Call the login function from the context with the form data
      await login(formData.email, formData.password);
      // If login is successful, we will handle redirection in the next step.
      // For now, the user state will be set globally.
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-purple-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 flex items-center justify-center mb-2">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to MadrassaPlay</h2>
          <p className="text-sm text-gray-500">Enter your credentials below</p>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="block w-full px-0 py-3 border-0 border-b border-gray-300 bg-transparent placeholder-gray-400 text-gray-900 focus:outline-none focus:border-indigo-800 transition"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-0 py-3 border-0 border-b border-gray-300 bg-transparent placeholder-gray-400 text-gray-900 focus:outline-none focus:border-indigo-800 transition"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-indigo-400 text-indigo-700 font-medium rounded-lg bg-white hover:bg-indigo-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
