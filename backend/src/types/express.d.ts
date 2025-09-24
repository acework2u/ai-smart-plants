import type { ApiVersion } from '@middleware/versionMiddleware';

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      versionInfo?: ApiVersion;
      traceId?: string;
      context?: {
        traceId: string;
        requestId: string;
        receivedAt: number;
      };
      user?: {
        id?: string;
        scopes?: string[];
        role?: string;
      };
    }
    interface Response {
      locals: Record<string, unknown>;
    }
  }
}

export {};
