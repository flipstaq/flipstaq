import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { authService } from '@/lib/auth';

interface FavoriteProduct {
  id: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    location: string;
    slug: string;
    imageUrl: string | null;
    userId: string;
    username: string;
    isActive: boolean;
    isSold: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface UseFavoritesReturn {
  favorites: FavoriteProduct[];
  favoritesCount: number;
  isLoading: boolean;
  addToFavorites: (productId: string) => Promise<boolean>;
  removeFromFavorites: (productId: string) => Promise<boolean>;
  isProductFavorited: (productId: string) => Promise<boolean>;
  refetchFavorites: () => Promise<void>;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const fetchFavorites = async () => {
    const token = authService.getAccessToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        setFavoritesCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoritesCount = async () => {
    const token = authService.getAccessToken();
    if (!token) return;

    try {
      const response = await fetch('/api/favorites?count=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavoritesCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  };

  const addToFavorites = async (productId: string): Promise<boolean> => {
    const token = authService.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        await fetchFavoritesCount();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (productId: string): Promise<boolean> => {
    const token = authService.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setFavorites((prev) =>
          prev.filter((fav) => fav.product.id !== productId)
        );
        setFavoritesCount((prev) => Math.max(0, prev - 1));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  const isProductFavorited = async (productId: string): Promise<boolean> => {
    const token = authService.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`/api/favorites/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.isFavorited;
      }

      return false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  };

  const refetchFavorites = async () => {
    await fetchFavorites();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavoritesCount();
    }
  }, [isAuthenticated]);

  return {
    favorites,
    favoritesCount,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isProductFavorited,
    refetchFavorites,
  };
};
