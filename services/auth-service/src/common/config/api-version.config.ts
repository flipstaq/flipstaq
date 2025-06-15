// API Version Configuration
export const API_VERSION = {
  V1: 'v1',
  CURRENT: 'v1',
} as const;

export const API_PREFIX = 'api';

export const getVersionedPath = (version: string = API_VERSION.CURRENT) =>
  `${API_PREFIX}/${version}`;

export const getCurrentApiPath = () => getVersionedPath(API_VERSION.CURRENT);
