interface Meta {
  traceId: string | null;
  degraded: boolean;
  [key: string]: unknown;
}

interface ErrorItem {
  code: string;
  message: string;
  field?: string;
  hint?: string;
  meta?: Record<string, unknown>;
}

const buildMeta = (meta: Partial<Meta> = {}, defaults: Pick<Meta, 'traceId' | 'degraded'>): Meta => ({
  ...meta,
  traceId: meta.traceId ?? defaults.traceId,
  degraded: meta.degraded ?? defaults.degraded
});

export const success = <T>(
  data: T,
  meta: Partial<Meta> = {}
): {
  data: T;
  meta: Meta;
  errors: [];
} => ({
  data,
  meta: buildMeta(meta, { traceId: null, degraded: false }),
  errors: []
});

export const failure = (
  errors: ErrorItem[],
  meta: Partial<Meta> = {}
): {
  data: null;
  meta: Meta;
  errors: ErrorItem[];
} => ({
  data: null,
  meta: buildMeta(meta, { traceId: null, degraded: true }),
  errors
});
