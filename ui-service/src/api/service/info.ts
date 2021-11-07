import { Request, Response, Router } from 'express';

/**
 * User info route
 */
export const infoAPI = Router();

infoAPI.get('/', async (req: Request, res: Response) => {
  console.log(req.body);

  res.status(200).json({
    NAME: 'ui-service',
    BUILD_VERSION: process.env.BUILD_VERSION,
    DEPLOY_VERSION: process.env.DEPLOY_VERSION,
    OPERATOR_ID: process.env.OPERATOR_ID,
  });
});
