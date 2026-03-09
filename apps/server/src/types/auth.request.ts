export class AuthenticatedRequest {
  user: {
    userId: number;
    email: string;
    name: string;
  };
  parts: () => any;
}
