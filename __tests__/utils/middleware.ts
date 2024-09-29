import { Express } from 'express'
import Log from '../../src/tools/logger.js'
import express from 'express'
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import apiToaster from '../../src/apiToaster.js'

export default class Middleware {
  static setNoCache(_req: express.Request, res: express.Response, next: express.NextFunction): void {
    res.set('cache-control', 'no-store');
    next();
  }

  generateMiddleware(app: Express): void {
    app.use(express.json({ limit: '500kb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use((_req: express.Request, res, next: express.NextFunction) => {
      res.header('Content-Type', 'application/json;charset=UTF-8');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    app.use((req, res, next) => {
      apiToaster(req, res, next, {
        headers: true,
      });
    });
  }

  generateErrHandler(app: Express): void {
    app.use(
      (
        err: Error,
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        Log.error('Got uncought error', err.message, err.stack)
        next()
      },
    );
  }
}
