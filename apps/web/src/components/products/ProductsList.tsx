'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import LoadingSpinner, {
  LoadingSpinnerSmall,
} from '@/components/ui/LoadingSpinner';

// Import ProductDetailModal - ignore TypeScript error for now
import { ProductDetailModal } from './ProductDetailModal';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  category?: string | null;
  slug: string;
  username: string;
  createdAt: string;
  imageUrl?: string | null;
}

interface ProductsListProps {
  limit?: number;
  searchQuery?: string;
}

export function ProductsList({ limit, searchQuery }: ProductsListProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
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
        setFilteredProducts(productsToShow);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]); // Filter products based on search query with debouncing
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchLoading(true);
    }

    const debounceTimeout = setTimeout(() => {
      if (!searchQuery || searchQuery.trim() === '') {
        setFilteredProducts(products);
      } else {
        const query = searchQuery.toLowerCase().trim();
        const filtered = products.filter((product) => {
          return (
            product.title.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.location.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query) ||
            product.username.toLowerCase().includes(query)
          );
        });
        setFilteredProducts(filtered);
      }
      setSearchLoading(false);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimeout);
      setSearchLoading(false);
    };
  }, [searchQuery, products]);
  if (loading) {
    return (
      <LoadingSpinner text={t('products.loadingProducts')} className="py-12" />
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

  if (filteredProducts.length === 0 && searchQuery) {
    return (
      <div className="py-12 text-center">
        <p className="text-secondary-500 dark:text-secondary-400">
          {t('products.noSearchResults', { query: searchQuery })}
        </p>
        <p className="mt-2 text-sm text-secondary-400 dark:text-secondary-500">
          {t('products.tryDifferentSearch')}
        </p>
      </div>
    );
  }
  return (
    <div>
      {searchQuery && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {' '}
            {searchLoading ? (
              <span className="flex items-center">
                <LoadingSpinnerSmall />
                <span className="ml-2 rtl:ml-0 rtl:mr-2">
                  {t('products.searching')}
                </span>
              </span>
            ) : (
              t('products.searchResults', {
                count: filteredProducts.length,
                query: searchQuery,
              })
            )}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
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
