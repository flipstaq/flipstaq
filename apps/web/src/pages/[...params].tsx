import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { ProductDetailPage } from '@/components/products/ProductDetailPage';

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  category: string | null;
  slug: string;
  username: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductPageProps {
  product: ProductDetail | null;
  username: string;
  slug: string;
  notFound?: boolean;
}

export default function ProductPage({
  product,
  username,
  slug,
  notFound,
}: ProductPageProps) {
  if (notFound) {
    // Return null to trigger Next.js 404 page
    return null;
  }

  return (
    <ProductDetailPage
      username={username}
      slug={slug}
      initialProduct={product}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { params } = context;

  if (!params || !Array.isArray(params.params) || params.params.length !== 2) {
    return {
      notFound: true,
    };
  }

  const [usernameParam, slug] = params.params;

  // Extract username from @username format
  if (!usernameParam.startsWith('@')) {
    return {
      notFound: true,
    };
  }

  const username = usernameParam.slice(1); // Remove @ prefix

  if (!username || !slug) {
    return {
      notFound: true,
    };
  }

  try {
    const API_GATEWAY_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
    const response = await fetch(
      `${API_GATEWAY_URL}/api/v1/products/@${username}/${slug}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          notFound: true,
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const product = await response.json();

    return {
      props: {
        product,
        username,
        slug,
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      notFound: true,
    };
  }
};
