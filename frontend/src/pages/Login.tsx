import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nest Chat Websocket
          </h1>
          <h2 className="text-2xl font-semibold text-gray-600">Connexion</h2>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Se connecter
          </button>
        </form>
        
        <p className="mt-8 text-center text-gray-600">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};
