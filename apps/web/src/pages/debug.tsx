import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { user, loading, isAuthenticated, hasAdminAccess } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [storedUser, setStoredUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('authToken'));
      const userStr = localStorage.getItem('user');
      setStoredUser(userStr ? JSON.parse(userStr) : null);
    }
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch('http://localhost:3100/api/v1/users', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Test API call response:', response.status, response.ok);
      const data = await response.text();
      console.log('Response data:', data);
    } catch (error) {
      console.error('Test API call error:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Debug Information</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Auth State</h2>
          <p>Loading: {loading.toString()}</p>
          <p>Authenticated: {isAuthenticated.toString()}</p>
          <p>Has Admin Access: {hasAdminAccess.toString()}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">User Object</h2>
          <pre className="rounded bg-gray-100 p-2 text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">LocalStorage</h2>
          <p>Token: {token ? `${token.substring(0, 20)}...` : 'null'}</p>
          <pre className="rounded bg-gray-100 p-2 text-sm">
            {JSON.stringify(storedUser, null, 2)}
          </pre>
        </div>

        <div>
          <button
            onClick={testApiCall}
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            Test API Call
          </button>
        </div>
      </div>
    </div>
  );
}
