import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { productsApi } from '@/lib/api/products';

const BlockTestPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      console.log('📦 Fetched products:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('❌ Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-secondary-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Block Test Page
        </h1>
        {user ? (
          <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <h2 className="mb-2 text-lg font-semibold">Current User Info:</h2>
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p>Not authenticated - products will show all public products</p>
          </div>
        )}{' '}
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="mb-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Products'}
        </button>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        )}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">
            Products ({products.length})
          </h2>
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Owner: {product.username} (ID: {product.userId})
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Price: {product.currency} {product.price}
              </p>
              {product.location && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Location: {product.location}
                </p>
              )}
            </div>
          ))}

          {products.length === 0 && !loading && (
            <p className="text-gray-500 dark:text-gray-400">
              No products found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockTestPage;
