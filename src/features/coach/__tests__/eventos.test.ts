import { escreverEvento, lerEventos } from '../eventos';

describe('lerEventos', () => {
  it('lê várias linhas completas', () => {
    const buffer =
      escreverEvento({ tipo: 'texto', texto: 'Bora' }) +
      escreverEvento({ tipo: 'texto', texto: ' treinar' }) +
      escreverEvento({ tipo: 'fim' });

    const { eventos, resto } = lerEventos(buffer);

    expect(eventos).toEqual([
      { tipo: 'texto', texto: 'Bora' },
      { tipo: 'texto', texto: ' treinar' },
      { tipo: 'fim' },
    ]);
    expect(resto).toBe('');
  });

  it('guarda a linha cortada pela rede para o próximo pedaço', () => {
    const linha = escreverEvento({ tipo: 'texto', texto: 'água' });
    const primeiro = lerEventos(linha.slice(0, 10));

    expect(primeiro.eventos).toEqual([]);

    const segundo = lerEventos(primeiro.resto + linha.slice(10));

    expect(segundo.eventos).toEqual([{ tipo: 'texto', texto: 'água' }]);
  });

  it('ignora linhas inválidas sem quebrar as outras', () => {
    const buffer = '{quebrado\n' + '{"tipo":"desconhecido"}\n' + escreverEvento({ tipo: 'fim' });

    expect(lerEventos(buffer).eventos).toEqual([{ tipo: 'fim' }]);
  });
});
