import { mensagemDoCompartilhar } from '../resultadoCompartilhar';

describe('mensagemDoCompartilhar', () => {
  it('menu aberto: não precisa avisar nada', () => {
    expect(mensagemDoCompartilhar('compartilhado')).toBeNull();
  });

  it('avisa quando baixou, quando não dá e quando falhou', () => {
    expect(mensagemDoCompartilhar('baixado')).toMatch(/baixada/);
    expect(mensagemDoCompartilhar('indisponivel')).toMatch(/não dá para compartilhar/);
    expect(mensagemDoCompartilhar('erro')).toMatch(/tente de novo/);
  });

  it('textos em minúsculas, sem travessão', () => {
    for (const resultado of ['baixado', 'indisponivel', 'erro'] as const) {
      const texto = mensagemDoCompartilhar(resultado)!;

      expect(texto).toBe(texto.toLowerCase());
      expect(texto).not.toMatch(/[–—]/);
    }
  });
});
