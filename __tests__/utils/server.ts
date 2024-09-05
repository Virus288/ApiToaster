import express from 'express';
import http from 'http';
import Middleware from './middleware.js
import Log from '../../src/tools/logger.js'

export default class Router {
  private readonly _middleware: Middleware;
  private readonly _app: express.Express;
  private _server: http.Server | undefined = undefined;

  constructor() {
    this._app = express();
    this._middleware = new Middleware();
  }

  get app(): express.Express {
    return this._app;
  }

  get server(): http.Server {
    return this._server!;
  }

  private get middleware(): Middleware {
    return this._middleware;
  }

  async init(): Promise<void> {
    this.initMiddleware();
    this.initRouter();
    this.initServer();
    this.initErrHandler();
  }

  /**
   * Close server.
   */
  close(): void {
    Log.log('Server', 'Closing');
    if (!this.server) return;

    this.server.closeAllConnections();
    this.server.close();
  }

  /**
   * Initialize middleware to handle express.
   */
  private initMiddleware(): void {
    this.middleware.generateMiddleware(this.app);
  }

  /**
   * Init err handler, catching errors in whole app.
   */
  private initErrHandler(): void {
    this.middleware.generateErrHandler(this.app);
  }

  /**
   * Init basic routes.
   */
  private initRouter(): void {

  }

  /**
   * Initialize http server.
   */
  private initServer(): void {
    if (process.env.NODE_ENV === 'test') return;
    this._server = http.createServer(this.app);
  }
}
