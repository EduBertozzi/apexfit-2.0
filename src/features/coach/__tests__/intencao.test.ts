import {
  confirmarPlano,
  metaDoContexto,
  modoDaDieta,
  modoDoTreino,
  pedeMudancaDeDieta,
  pedeMudancaDeTreino,
  refeicoesPedidas,
} from '../intencao';

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

describe('pedeMudancaDeTreino com nome de exercício', () => {
  it.each(['troca o leg press por agachamento', 'tira a prancha', 'substitui o supino por flexão'])(
    'reconhece: "%s"',
    (mensagem) => {
      expect(pedeMudancaDeTreino(mensagem)).toBe(true);
    },
  );

  it.each(['troca o arroz por batata', 'posso trocar o supino por flexão?'])(
    'não confunde: "%s"',
    (mensagem) => {
      expect(pedeMudancaDeTreino(mensagem)).toBe(false);
    },
  );
});

describe('modoDoTreino', () => {
  it.each([
    'Monta meu treino',
    'refaz minha ficha',
    'quero um novo treino',
    'Cria uma divisão nova',
    'treino de 4 dias',
    'monta um treino em casa',
  ])('plano novo: "%s"', (mensagem) => {
    expect(modoDoTreino(mensagem, true)).toBe('novo');
  });

  it.each([
    'troca o leg press por agachamento livre',
    'Troca os exercícios do treino A',
    'tira a prancha do treino B',
    'aumenta as séries do supino',
    'faz o treino A sem leg press',
  ])('ajuste: "%s"', (mensagem) => {
    expect(modoDoTreino(mensagem, true)).toBe('ajuste');
  });

  it('sem treinos salvos é sempre novo', () => {
    expect(modoDoTreino('troca o leg press por agachamento', false)).toBe('novo');
  });
});

describe('refeicoesPedidas e modoDaDieta', () => {
  it.each([
    ['troca o café da manhã', ['cafe']],
    ['muda o almoço e a janta', ['almoco', 'jantar']],
    ['tira o café do lanche', ['lanche']],
    ['quero outro café', ['cafe']],
    ['ceia mais leve', ['ceia']],
    ['monta minha dieta', []],
  ])('"%s" cita %j', (mensagem, slots) => {
    expect(refeicoesPedidas(mensagem)).toEqual(slots);
  });

  it.each(['Monta minha dieta', 'Faz uma dieta nova pra mim', 'Quero um cardápio novo'])(
    'plano novo: "%s"',
    (mensagem) => {
      expect(modoDaDieta(mensagem, true)).toBe('novo');
    },
  );

  it.each(['Troca o café da manhã', 'tira o leite do lanche', 'dieta sem lactose'])(
    'ajuste: "%s"',
    (mensagem) => {
      expect(modoDaDieta(mensagem, true)).toBe('ajuste');
    },
  );

  it('sem plano salvo é sempre novo', () => {
    expect(modoDaDieta('troca o café da manhã', false)).toBe('novo');
  });
});

describe('confirmarPlano num ajuste', () => {
  it('lista só o que mudou e pede para aplicar', () => {
    const texto = confirmarPlano(
      {
        resumo: 'x',
        caloriasDia: 2000,
        macros: { proteinaG: 1, carboidratoG: 1, gorduraG: 1 },
        refeicoes: [],
        dicas: [],
        aviso: 'x',
      },
      ['café da manhã trocado'],
    );

    expect(texto).toContain('- café da manhã trocado');
    expect(texto).toContain('aplicar');
    expect(texto).not.toMatch(/[—–]/);
  });
});
