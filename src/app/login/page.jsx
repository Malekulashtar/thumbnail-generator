'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Set cookie and redirect
        document.cookie = 'demo-auth=authenticated; path=/; max-age=86400'; // 24 hours
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Demo Access</h1>
          <p className="text-gray-400">Enter credentials to access the YouTube Thumbnail Generator</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 text-center mt-6">
          Demo access only • Contact admin for credentials
        </p>
      </div>
    </div>
  );
}