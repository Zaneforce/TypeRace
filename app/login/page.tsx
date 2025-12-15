'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await register(email, password, username);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-gray-700/50 w-full max-w-md">
        <h1 className="text-4xl font-bold text-yellow-500 mb-2 text-center">
          TypeRace
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                placeholder="Enter your username"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-yellow-500 transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </main>
  );
}
