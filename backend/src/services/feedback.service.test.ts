import { feedbackRepository } from './feedback.service';

describe('feedbackRepository', () => {
  it('almacena y devuelve feedback', () => {
    const before = feedbackRepository.all().length;
    feedbackRepository.add({
      rating: 'up',
      assistantMessage: 'Mensaje de prueba',
      comment: 'Muy útil',
      createdAt: new Date().toISOString(),
    });
    const after = feedbackRepository.all().length;
    expect(after).toBe(before + 1);
  });
});