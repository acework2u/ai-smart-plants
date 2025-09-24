export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Smart Plant AI API (Draft)',
    version: '0.1.0',
    description: 'Placeholder OpenAPI document derived from API_SPEC_Development.md.'
  },
  servers: [{ url: 'http://localhost:4000/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Readiness probe',
        responses: {
          '200': {
            description: 'Service is up'
          }
        }
      }
    }
  }
};
