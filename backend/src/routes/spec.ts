import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from '@docs/openapi';

export const apiSpecRouter = Router();

apiSpecRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

apiSpecRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument));
