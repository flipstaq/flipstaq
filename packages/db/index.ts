// Export the generated Prisma client and types
export * from "./generated/client";

// Re-export commonly used types for convenience
export type { User, RefreshToken, Prisma } from "./generated/client";

// Re-export enums as both types and values
export { UserRole, UserStatus } from "./generated/client";

// Export the PrismaClient as default for convenience
export { PrismaClient as default } from "./generated/client";
