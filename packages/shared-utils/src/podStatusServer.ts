import { POD_STATUS_SERVER_PORT } from '@overmindbots/shared-utils/constants';
import express, { Response } from 'express';
import { Server } from 'http';
import logger from 'winston';

enum LIVENESS_STATUSES {
  HEALTHY = 200,
  UNHEALTHY = 500,
}
enum READINESS_STATUSES {
  READY = 200,
  NOT_READY = 500,
}

export class PodStatusServer {
  public app: express.Application;
  private livenessStatus: LIVENESS_STATUSES;
  private readinessStatus: READINESS_STATUSES;
  private httpServer: Server | null;
  constructor() {
    this.app = express();
    this.livenessStatus = LIVENESS_STATUSES.HEALTHY;
    this.readinessStatus = READINESS_STATUSES.NOT_READY;
    this.httpServer = null;
  }
  /**
   * Sets the server's liveness status.
   */
  public async setLivenessStatus(statusCode: LIVENESS_STATUSES) {
    this.livenessStatus = statusCode;
    logger.info(`==> Pod Liveness status set: ${statusCode}`);
  }
  /**
   * Sets the server's readiness status
   */
  public async setReadinessStatus(statusCode: READINESS_STATUSES) {
    this.readinessStatus = statusCode;
    logger.info(`==> Pod Readiness status set: ${statusCode}`);
  }
  /**
   * Call when the service is ready to work
   */
  public async ready() {
    this.setReadinessStatus(READINESS_STATUSES.READY);
  }
  /**
   * Call if service is unhealthy and requires to be killed
   */
  public async unhealthy() {
    this.setLivenessStatus(LIVENESS_STATUSES.UNHEALTHY);
  }
  /**
   * Starts PodStatusServer instance
   */
  public async start() {
    this.app.get('/liveness', (_req, res) => this.livenessRequest(res));
    this.app.get('/readiness', (_req, res) => this.readinessRequest(res));
    this.httpServer = await this.app.listen(POD_STATUS_SERVER_PORT);
  }
  /**
   * Stops PodStatusServer instance
   */
  public async stop() {
    await this.closeHttpServer();
  }
  private async closeHttpServer() {
    await new Promise(resolve => {
      if (!this.httpServer) {
        resolve();
        return;
      }

      this.httpServer.close(resolve);
    });
  }
  private async livenessRequest(res: Response) {
    res.writeHead(this.livenessStatus);
    res.send();
  }
  private async readinessRequest(res: Response) {
    res.writeHead(this.readinessStatus);
    res.send();
  }
}
