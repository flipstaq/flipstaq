import React from 'react';
import { ProductForAdmin } from '@/lib/api/admin';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface ProductCardProps {
  product: ProductForAdmin;
  onApprove: (product: ProductForAdmin) => void;
  onReject: (product: ProductForAdmin) => void;
  onToggleVisibility: (productId: string) => void;
  onRestore: (productId: string) => void;
  onDelete: (product: ProductForAdmin) => void;
  actionLoading: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onApprove,
  onReject,
  onToggleVisibility,
  onRestore,
  onDelete,
  actionLoading,
}) => {
  const { t } = useLanguage();

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 ${
        !product.isActive ? 'border-gray-300 opacity-60' : 'border-gray-200'
      }`}
    >
      <div className="p-6">
        {/* Header with Image and Basic Info */}
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            {product.imageUrl ? (
              <img
                className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-600"
                src={product.imageUrl}
                alt={product.title}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {/* Status overlays */}
            {product.status === 'REJECTED' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500 bg-opacity-75">
                <span className="text-xs font-bold text-white">
                  {t('admin-products:status.rejected')}
                </span>
              </div>
            )}
            {!product.isActive && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-500 bg-opacity-75">
                <span className="text-xs font-bold text-white">
                  {t('admin-products:status.deleted')}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  {product.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Slug: {product.slug} | Seller: @{product.username}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {product.price} {product.currency}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      product.type === 'DIGITAL'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : product.type === 'PHYSICAL'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                    }`}
                  >
                    {product.type === 'DIGITAL'
                      ? t('products.types.DIGITAL')
                      : product.type === 'PHYSICAL'
                        ? t('products.types.PHYSICAL')
                        : t('products.types.SERVICE')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                {/* Status badges */}
                <div className="flex flex-col space-y-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      product.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : product.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}
                  >
                    {product.status === 'APPROVED'
                      ? t('admin-products:status.approved')
                      : product.status === 'REJECTED'
                        ? t('admin-products:status.rejected')
                        : t('admin-products:status.pending')}
                  </span>
                  {!product.isActive && (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {t('admin-products:status.deleted')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Description
            </h4>
            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {product.description.length > 200
                ? `${product.description.substring(0, 200)}...`
                : product.description}
            </p>
          </div>
        )}

        {/* Product Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Location
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {product.location}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Category
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {product.category || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Rating
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {product.averageRating > 0
                ? `${product.averageRating.toFixed(1)}/5`
                : 'No ratings'}
              ({product.totalReviews} reviews)
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Created
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Approval Information for Approved Products */}
        {product.status === 'APPROVED' && product.approvedBy && (
          <div className="mt-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <h4 className="mb-2 text-sm font-medium text-green-800 dark:text-green-300">
              Approval Details
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="text-green-600 dark:text-green-400">
                  Approved by:
                </span>{' '}
                <span className="font-medium text-green-800 dark:text-green-300">
                  {product.approvedBy.firstName} {product.approvedBy.lastName}{' '}
                  (@{product.approvedBy.username})
                </span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">
                  Approved on:
                </span>{' '}
                <span className="font-medium text-green-800 dark:text-green-300">
                  {product.approvedAt
                    ? new Date(product.approvedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              {product.approvalReason && (
                <div className="col-span-2">
                  <span className="text-green-600 dark:text-green-400">
                    Reason:
                  </span>{' '}
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {product.approvalReason}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Information for Rejected Products */}
        {product.status === 'REJECTED' && product.rejectedBy && (
          <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <h4 className="mb-2 text-sm font-medium text-red-800 dark:text-red-300">
              Rejection Details
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="text-red-600 dark:text-red-400">
                  Rejected by:
                </span>{' '}
                <span className="font-medium text-red-800 dark:text-red-300">
                  {product.rejectedBy.firstName} {product.rejectedBy.lastName}{' '}
                  (@{product.rejectedBy.username})
                </span>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400">
                  Rejected on:
                </span>{' '}
                <span className="font-medium text-red-800 dark:text-red-300">
                  {product.rejectedAt
                    ? new Date(product.rejectedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              {product.approvalReason && (
                <div className="col-span-2">
                  <span className="text-red-600 dark:text-red-400">
                    Reason:
                  </span>{' '}
                  <span className="font-medium text-red-800 dark:text-red-300">
                    {product.approvalReason}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {product.isActive && (
            <>
              {/* Approval/Rejection buttons for pending products */}
              {product.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => onApprove(product)}
                    disabled={actionLoading}
                    className="inline-flex items-center rounded-md border border-transparent bg-green-100 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
                  >
                    {t('admin-products:actions.approve')}
                  </button>
                  <button
                    onClick={() => onReject(product)}
                    disabled={actionLoading}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                  >
                    {t('admin-products:actions.reject')}
                  </button>
                </>
              )}
              {/* Visibility toggle - only for approved products */}
              {product.status === 'APPROVED' && (
                <button
                  onClick={() => onToggleVisibility(product.id)}
                  disabled={actionLoading}
                  className={`inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors ${
                    product.visible
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {product.visible
                    ? t('admin-products:actions.hide')
                    : t('admin-products:actions.show')}
                </button>
              )}
            </>
          )}
          {/* Restore button for deleted products */}
          {!product.isActive && (
            <button
              onClick={() => onRestore(product.id)}
              disabled={actionLoading}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
            >
              {t('admin-products:actions.restore')}
            </button>
          )}
          {/* Delete button always available for all products */}
          <button
            onClick={() => onDelete(product)}
            disabled={actionLoading}
            className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
          >
            {!product.isActive
              ? t('admin-products:actions.deletePermanently')
              : t('admin-products:actions.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
