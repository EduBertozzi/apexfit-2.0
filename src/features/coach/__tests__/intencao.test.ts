import { confirmarPlano, metaDoContexto, pedeMudancaDeDieta } from '../intencao';

describe('pedeMudancaDeDieta', () => {
  it.each([
    'Monta minha dieta',
    'monta minha dieta, mas sem ovo',
    'Troca o café da manhã',
    'muda o almoço pra algo mais leve',
    'Faz uma dieta nova pra mim',
    'tira o leite do lanche',
    'Quero um cardápio novo',
    'Pode montar minha dieta?',
    'Consegue trocar o jantar?',
  ])('reconhece pedido: "%s"', (mensagem) => {
    expect(pedeMudancaDeDieta(mensagem)).toBe(true);
  });

  it.each([
    'Como estou na água hoje?',
    'O que como antes do treino?',
    'Posso trocar arroz por batata no almoço?',
    'Quantas calorias tem meu jantar?',
    'Bora treinar hoje',
    'Oi coach',
  ])('não confunde com pergunta ou papo: "%s"', (mensagem) => {
    expect(pedeMudancaDeDieta(mensagem)).toBe(false);
  });
});

describe('metaDoContexto', () => {
  it('lê a meta formatada em pt-BR', () => {
    expect(metaDoContexto('## Metas\nMeta de calorias: 2.830 kcal\n')).toBe(2830);
  });

  it('é undefined quando o perfil não tem metas', () => {
    expect(metaDoContexto('Sem metas: o perfil ainda não tem sexo')).toBeUndefined();
  });
});

describe('confirmarPlano', () => {
  it('resume o plano salvo sem traço nem emoji', () => {
    const texto = confirmarPlano({
      resumo: 'x',
      caloriasDia: 2830,
      macros: { proteinaG: 120, carboidratoG: 446, gorduraG: 63 },
      refeicoes: [
        {
          nome: 'Almoço',
          horario: '12:00',
          calorias: 850,
          itens: [
            { alimento: 'Frango grelhado', quantidade: '150 g' },
            { alimento: 'Arroz integral', quantidade: '180 g' },
            { alimento: 'Brócolis', quantidade: '100 g' },
          ],
          substituicoes: [],
        },
      ],
      dicas: [],
      aviso: 'x',
    });

    expect(texto).toContain('2.830 kcal em 1 refeições');
    expect(texto).toContain('12:00 Almoço: frango grelhado e arroz integral');
    expect(texto).not.toMatch(/[—–]/);
  });
});
