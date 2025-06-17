import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProductReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

export function useReviews() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createReview = async (
    reviewData: CreateReviewData
  ): Promise<Review> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post('/api/reviews', reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to create review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const updateReview = async (
    reviewId: string,
    reviewData: UpdateReviewData
  ): Promise<Review> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.put(`/api/reviews/${reviewId}`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to update review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const deleteReview = async (reviewId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete(`/api/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to delete review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const getUserReviews = async (): Promise<Review[]> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get('/api/reviews', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to fetch user reviews';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    getUserReviews,
  };
}

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<ProductReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/reviews/product/${productId}`);
        setReviews(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const refetchReviews = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/reviews/product/${productId}`);
      setReviews(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    loading,
    error,
    refetchReviews,
  };
}

export function useUserProductReview(productId: string) {
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserReview = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUserReview(null);
        return;
      }

      const response = await axios.get(
        `/api/reviews/product/${productId}/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserReview(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // User hasn't reviewed this product yet
        setUserReview(null);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch user review');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReview();
  }, [productId]);

  return {
    userReview,
    loading,
    error,
    refetchUserReview: fetchUserReview,
  };
}
