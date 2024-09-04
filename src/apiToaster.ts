import type express from 'express';

/**
 * Main function to handle logging.
 * @description Default function used to handle req logging and much more.
 * @param _req Express request.
 * @param _res Express response.
 * @param next Express next.
 */
export default function (_req: express.Request, _res: express.Response, next: express.NextFunction): void {
  next();
}
