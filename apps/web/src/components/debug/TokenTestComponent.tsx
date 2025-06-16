'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { authApi } from '@/lib/api/auth';

export function TokenTestComponent() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testTokenRefresh = async () => {
    setLoading(true);
    setStatus('Testing token refresh...');
    try {
      // Test if we can make an authenticated request
      setStatus('Making authenticated request...');
      const response = (await apiClient.get('/auth/validate')) as any;
      setStatus(`✅ Request successful: ${response.email}`);
    } catch (error) {
      setStatus(
        `❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testManualRefresh = async () => {
    setLoading(true);
    setStatus('Testing manual token refresh...');

    try {
      const response = await authApi.refreshToken();
      setStatus(`✅ Manual refresh successful: ${response.user.email}`);
    } catch (error) {
      setStatus(
        `❌ Manual refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentTokens = () => {
    const accessToken = authApi.getStoredToken();
    const user = authApi.getStoredUser();

    if (accessToken && user) {
      setStatus(
        `✅ Current user: ${user.email} (Token: ${accessToken.substring(0, 20)}...)`
      );
    } else {
      setStatus('❌ No valid tokens found');
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setStatus('🗑️ Tokens cleared from localStorage');
  };

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">Token Refresh Test</h2>

      <div className="mb-4 space-y-2">
        <button
          onClick={checkCurrentTokens}
          className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Check Current Tokens
        </button>

        <button
          onClick={testTokenRefresh}
          disabled={loading}
          className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Automatic Refresh'}
        </button>

        <button
          onClick={testManualRefresh}
          disabled={loading}
          className="w-full rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Manual Refresh'}
        </button>

        <button
          onClick={clearTokens}
          className="w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Clear Tokens
        </button>
      </div>

      {status && (
        <div className="rounded bg-gray-100 p-3 text-sm">
          <pre>{status}</pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>This component tests:</p>
        <ul className="list-inside list-disc">
          <li>Automatic token refresh on API calls</li>
          <li>Manual token refresh functionality</li>
          <li>Token storage and retrieval</li>
        </ul>
      </div>
    </div>
  );
}
