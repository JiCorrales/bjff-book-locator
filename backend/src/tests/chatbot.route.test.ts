import request from 'supertest';
import express from 'express';

// Establecer el timeout del asistente ANTES de importar la ruta
process.env.CHATBOT_ASSISTANT_TIMEOUT_MS = '50';

describe('Chatbot route /api/chatbot/conversation', () => {
  const makeApp = async (assistant: any) => {
    const { createChatbotRouter } = await import('../routes/chatbot');
    const app = express();
    app.use(express.json());
    app.use('/api/chatbot', createChatbotRouter(assistant));
    return app;
  };

  it('retorna 400 si falta el arreglo conversation', async () => {
    const dummy = ({
      reply: async () => 'OK',
    } as unknown);

    const app = await makeApp(dummy);

    await request(app)
      .post('/api/chatbot/conversation')
      .send({})
      .expect(400);
  });

  it('responde con el asistente inyectado si no hay timeout', async () => {
    const fastAssistant = ({
      reply: async () => 'Prueba OK',
    } as unknown);

    const app = await makeApp(fastAssistant);

    const res = await request(app)
      .post('/api/chatbot/conversation')
      .send({ conversation: [{ role: 'user', content: 'Hola' }] })
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toHaveProperty('content');
    expect(res.body.message.content).toContain('Prueba OK');
  });

  it('usa el fallback local cuando el asistente remoto se demora (timeout)', async () => {
    // Asistente que nunca resuelve -> debe activarse el fallback local
    const neverResolving = ({
      reply: () => new Promise<string>(() => {}),
    } as unknown);

    const app = await makeApp(neverResolving);

    const res = await request(app)
      .post('/api/chatbot/conversation')
      .send({ conversation: [{ role: 'user', content: 'Horarios y servicios disponibles' }] })
      .expect(200);

    expect(typeof res.body?.message?.content).toBe('string');
    expect(res.body.message.content.toLowerCase()).toContain('horarios y servicios');
  });
});