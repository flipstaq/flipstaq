// API Version Configuration for Gateway
export const API_VERSION = {
  V1: "v1",
  CURRENT: "v1",
} as const;

export const API_PREFIX = "api";

export const getVersionedPath = (version: string = API_VERSION.CURRENT) =>
  `${API_PREFIX}/${version}`;

export const getCurrentApiPath = () => getVersionedPath(API_VERSION.CURRENT);

// Service endpoints configuration
export const SERVICE_ENDPOINTS = {
  AUTH: "auth",
  USER: "user",
  PRODUCT: "product",
  MESSAGE: "message",
  ORDER: "order",
  PAYMENT: "payment",
  REVIEW: "review",
  NOTIFICATION: "notification",
} as const;

// Service URLs from environment
export const getServiceUrl = (service: keyof typeof SERVICE_ENDPOINTS) => {
  const urls = {
    AUTH: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    USER: process.env.USER_SERVICE_URL || "http://localhost:3003",
    PRODUCT: process.env.PRODUCT_SERVICE_URL || "http://localhost:3004",
    MESSAGE: process.env.MESSAGE_SERVICE_URL || "http://localhost:3002",
    ORDER: process.env.ORDER_SERVICE_URL || "http://localhost:3005",
    PAYMENT: process.env.PAYMENT_SERVICE_URL || "http://localhost:3006",
    REVIEW: process.env.REVIEW_SERVICE_URL || "http://localhost:3007",
    NOTIFICATION:
      process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008",
  };
  return urls[service];
};
