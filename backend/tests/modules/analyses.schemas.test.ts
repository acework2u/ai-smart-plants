import { describe, expect, it } from 'vitest';

import { startAnalysisSchema } from '../../src/modules/analyses/analyses.schemas';

describe('startAnalysisSchema', () => {
  it('rejects when both imageUrl and imageBase64 missing', () => {
    expect(() => startAnalysisSchema.parse({})).toThrowError(/imageUrl/);
  });

  it('accepts either imageUrl or base64', () => {
    const result = startAnalysisSchema.parse({ imageUrl: 'https://example.com/image.jpg' });
    expect(result.imageUrl).toBe('https://example.com/image.jpg');
  });
});
