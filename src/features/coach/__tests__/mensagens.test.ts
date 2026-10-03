import { paraMensagensApi } from '../mensagens';

describe('paraMensagensApi', () => {
  it('converte papéis do app para os da API', () => {
    expect(
      paraMensagensApi([
        { papel: 'usuario', texto: 'Oi' },
        { papel: 'coach', texto: 'Bora!' },
        { papel: 'usuario', texto: 'Monta minha dieta' },
      ]),
    ).toEqual([
      { role: 'user', content: 'Oi' },
      { role: 'assistant', content: 'Bora!' },
      { role: 'user', content: 'Monta minha dieta' },
    ]);
  });

  it('descarta mensagens do coach antes da primeira do usuário (ex: boas-vindas)', () => {
    expect(
      paraMensagensApi([
        { papel: 'coach', texto: 'Fala, Eduardo!' },
        { papel: 'usuario', texto: 'Oi' },
      ]),
    ).toEqual([{ role: 'user', content: 'Oi' }]);
  });
});
