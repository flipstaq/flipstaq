export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sub: string;
    email: string;
    role: string;
  };
}
