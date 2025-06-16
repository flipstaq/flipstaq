'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/components/providers/LanguageProvider';

// Import ProductDetailModal - ignore TypeScript error for now
// @ts-ignore
import { ProductDetailModal } from './ProductDetailModal';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  username: string;
  createdAt: string;
}

interface ProductsListProps {
  limit?: number;
}

export function ProductsList({ limit }: ProductsListProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    username: string;
    slug: string;
  } | null>(null);

  const handleProductClick = (username: string, slug: string) => {
    setSelectedProduct({ username, slug });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        const productsToShow = limit ? data.slice(0, limit) : data;
        setProducts(productsToShow);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p className="mt-4 text-secondary-500 dark:text-secondary-400">
          {t('products.loadingProducts')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-secondary-500 dark:text-secondary-400">
          {t('products.noProducts')}
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          username={selectedProduct.username}
          slug={selectedProduct.slug}
        />
      )}
    </div>
  );
}
