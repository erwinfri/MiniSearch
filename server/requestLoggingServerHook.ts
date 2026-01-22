import type { IncomingMessage, ServerResponse } from "node:http";
import type { PreviewServer, ViteDevServer } from "vite";

export function requestLoggingServerHook<
  T extends ViteDevServer | PreviewServer,
>(server: T) {
  server.middlewares.use(
    (
      request: IncomingMessage,
      response: ServerResponse,
      next: () => void,
    ) => {
    const startTime = Date.now();
    const { method, url } = request;
    const timestamp = new Date().toISOString();

    // Log the incoming request
    console.log(`[${timestamp}] ${method} ${url}`);

    // Capture the response finish event to log response details
    response.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = response;
      console.log(
        `[${timestamp}] ${method} ${url} - ${statusCode} (${duration}ms)`,
      );
    });

    next();
  });
}

// Made with Bob
