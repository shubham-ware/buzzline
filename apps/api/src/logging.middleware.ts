import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const requestId = randomUUID().slice(0, 8);
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[REQ] ${requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
  }
}
