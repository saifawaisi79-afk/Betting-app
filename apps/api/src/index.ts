import Fastify from 'fastify';
import { env } from './env.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { createSocketGateway } from './gateways/socket.gateway.js';
import { createServer } from 'node:http';

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // Register all Fastify plugins (cors, helmet, rate-limit, JWT, cookie, etc.)
  await registerPlugins(app);

  // Register all route handlers
  await registerRoutes(app);

  // Create raw HTTP server for Socket.IO to attach to
  const httpServer = createServer(app.server);

  // Set up Socket.IO gateway with Redis adapter
  const io = await createSocketGateway(httpServer);
  app.decorate('io', io);

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`🚀 API server running on http://${env.API_HOST}:${env.API_PORT}`);
    app.log.info(`🔌 Socket.IO ready`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
