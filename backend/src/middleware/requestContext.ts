import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const headerTraceId = 'x-trace-id';
const headerRequestId = 'x-request-id';

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers[headerTraceId] as string | undefined) ?? randomUUID();
  const requestId = (req.headers[headerRequestId] as string | undefined) ?? randomUUID();

  const context = {
    traceId,
    requestId,
    receivedAt: Date.now()
  };

  req.traceId = traceId;
  req.context = context;

  res.setHeader(headerTraceId, traceId);
  res.setHeader(headerRequestId, requestId);

  next();
};
