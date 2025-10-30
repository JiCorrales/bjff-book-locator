import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import chatbotRouter from './routes/chatbot';
import { env } from './config/env';

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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/chatbot', chatbotRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Recurso no encontrado.' });
});

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof Error) {
      console.error('[chatbot] Error no controlado:', error.message);
    } else {
      console.error('[chatbot] Error no controlado:', error);
    }

    res.status(500).json({
      message: 'Ocurrio un error inesperado. Intenta nuevamente mas tarde.',
    });
  },
);

const port = env.PORT;

app.listen(port, () => {
  console.log(`[chatbot] Servidor listo en el puerto ${port}`);
});

export default app;
