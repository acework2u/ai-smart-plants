import { describe, expect, it } from 'vitest';

import { summaryQuerySchema, trendsQuerySchema } from '../../src/modules/insights/insights.schemas';

describe('insights schemas', () => {
  it('allows optional plant filter in summary', () => {
    const summary = summaryQuerySchema.parse({ plantId: 'p1' });
    expect(summary.plantId).toBe('p1');
  });

  it('validates metric enum', () => {
    const parsed = trendsQuerySchema.parse({ metric: 'wateringConsistency', window: '7d' });
    expect(parsed.metric).toBe('wateringConsistency');
  });
});
