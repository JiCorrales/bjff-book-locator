import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import * as path from 'path';
import swaggerUi from 'swagger-ui-express';
import chatbotRouter from './routes/chatbot';
import authRouter from './routes/auth';
import modulesRouter from './routes/modules';
import shelvingUnitsRouter from './routes/shelving-units';
import shelvesRouter from './routes/shelves';
import bookRoutes from './routes/index'; // Book Locator routes
import usersRouter from './routes/users';
import { env } from './config/env';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

const buildCorsOptions = (): CorsOptions | undefined => {
  if (env.CLIENT_ORIGINS.length === 0) {
    return undefined;
  }

  return {
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  };
};

const corsOptions = buildCorsOptions();
app.use(corsOptions ? cors(corsOptions) : cors());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (shelf images)
const outputFinalPath = path.join(__dirname, '../../output_final');
app.use('/images', express.static(outputFinalPath));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/api/auth', authRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/shelving-units', shelvingUnitsRouter);
app.use('/api/shelves', shelvesRouter);
app.use('/api', bookRoutes); // Book Locator API routes
app.use('/api/users', usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = env.PORT;

app.listen(port, () => {
  console.log(`[chatbot] Servidor listo en el puerto ${port}`);
});

export default app;
