import { LocalNlpAssistantService } from './localNlp.service';

describe('LocalNlpAssistantService', () => {
  const svc = new LocalNlpAssistantService();

  const ask = (content: string) => svc.reply([{ role: 'user', content }]);

  it('responde a búsqueda por código', async () => {
    const text = await ask('Buscar libro por codigo CR863 L318p7');
    expect(text.toLowerCase()).toContain('buscar un libro por código');
  });

  it('responde a horarios y servicios', async () => {
    const text = await ask('¿Cuáles son los horarios y servicios disponibles?');
    expect(text.toLowerCase()).toContain('horarios y servicios');
  });

  it('responde a políticas de préstamo', async () => {
    const text = await ask('¿Cuáles son las políticas de préstamo?');
    expect(text.toLowerCase()).toContain('políticas de préstamo');
  });

  it('fallback cuando no comprende', async () => {
    const text = await ask('blablabla xyzz');
    expect(text.toLowerCase()).toContain('no estoy seguro de haber comprendido');
  });
});