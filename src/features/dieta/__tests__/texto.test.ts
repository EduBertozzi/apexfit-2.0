import type { PlanoDieta } from '../contrato';
import { limparLista, limparPlano, limparTextoIa, separarQuantidade } from '../texto';

describe('limparTextoIa', () => {
  it('tira negrito, itálico e código', () => {
    expect(limparTextoIa('**Arroz** integral com *feijão* e `ovo`')).toBe(
      'Arroz integral com feijão e ovo',
    );
    expect(limparTextoIa('__Frango__ grelhado')).toBe('Frango grelhado');
  });

  it('tira títulos, marcadores de lista e citações', () => {
    expect(limparTextoIa('### Café da manhã')).toBe('Café da manhã');
    expect(limparTextoIa('- Pão integral')).toBe('Pão integral');
    expect(limparTextoIa('• Banana')).toBe('Banana');
    expect(limparTextoIa('1. Beba água')).toBe('Beba água');
    expect(limparTextoIa('> Dica importante')).toBe('Dica importante');
  });

  it('troca travessão por vírgula e junta linhas', () => {
    expect(limparTextoIa('Arroz — 100 g')).toBe('Arroz, 100 g');
    expect(limparTextoIa('Plano leve\n\n- com proteína')).toBe('Plano leve com proteína');
  });

  it('mantém letras maiúsculas e números', () => {
    expect(limparTextoIa('Pão francês 2 unidades (50 g)')).toBe('Pão francês 2 unidades (50 g)');
  });

  it('não quebra texto com hífen no meio', () => {
    expect(limparTextoIa('Batata-doce cozida')).toBe('Batata-doce cozida');
  });

  it('link vira só o texto', () => {
    expect(limparTextoIa('veja [aqui](http://x.com)')).toBe('veja aqui');
  });
});

describe('limparLista', () => {
  it('limpa, tira vazios e repetidos', () => {
    expect(limparLista(['- **Água**', '', '**', 'água', 'Sono'])).toEqual(['Água', 'Sono']);
  });
});

describe('limparPlano', () => {
  const plano: PlanoDieta = {
    resumo: '**Plano** de 2.000 kcal',
    caloriasDia: 2000,
    macros: { proteinaG: 120, carboidratoG: 250, gorduraG: 60 },
    refeicoes: [
      {
        nome: '### Almoço',
        horario: '12:00',
        calorias: 700,
        itens: [
          { alimento: '**Arroz branco**', quantidade: '250 g — cerca de 1 xícara e meia' },
          { alimento: '**', quantidade: '1' },
        ],
        substituicoes: ['- Arroz por batata'],
      },
    ],
    dicas: ['* Beba água'],
    aviso: '_Consulte_ um nutricionista.',
  };

  it('limpa todos os textos e mantém os números', () => {
    const limpo = limparPlano(plano);

    expect(limpo.resumo).toBe('Plano de 2.000 kcal');
    expect(limpo.refeicoes[0].nome).toBe('Almoço');
    expect(limpo.refeicoes[0].itens).toEqual([
      { alimento: 'Arroz branco', quantidade: '250 g, cerca de 1 xícara e meia' },
    ]);
    expect(limpo.refeicoes[0].substituicoes).toEqual(['Arroz por batata']);
    expect(limpo.dicas).toEqual(['Beba água']);
    expect(limpo.aviso).toBe('Consulte um nutricionista.');
    expect(limpo.caloriasDia).toBe(2000);
  });

  it('plano já limpo continua igual', () => {
    const limpo = limparPlano(plano);

    expect(limparPlano(limpo)).toEqual(limpo);
  });
});

describe('separarQuantidade', () => {
  it('separa gramas da medida caseira', () => {
    expect(separarQuantidade('250 g, cerca de 1 xícara e meia')).toEqual({
      principal: '250 g',
      detalhe: 'cerca de 1 xícara e meia',
    });
    expect(separarQuantidade('120 g (4 colheres)')).toEqual({
      principal: '120 g',
      detalhe: '4 colheres',
    });
    expect(separarQuantidade('200ml ou 1 copo')).toEqual({
      principal: '200 ml',
      detalhe: '1 copo',
    });
  });

  it('medida sozinha fica toda na direita', () => {
    expect(separarQuantidade('3 unidades')).toEqual({ principal: '3 unidades', detalhe: null });
    expect(separarQuantidade('100 g')).toEqual({ principal: '100 g', detalhe: null });
  });

  it('não corta medida que continua ou sem unidade', () => {
    expect(separarQuantidade('1 banana')).toEqual({ principal: '1 banana', detalhe: null });
    expect(separarQuantidade('1 xícara e meia de arroz')).toEqual({
      principal: null,
      detalhe: '1 xícara e meia de arroz',
    });
  });

  it('texto comprido sem número vai para o detalhe', () => {
    expect(separarQuantidade('à vontade, folhas verdes variadas')).toEqual({
      principal: null,
      detalhe: 'à vontade, folhas verdes variadas',
    });
  });

  it('vazio não mostra nada', () => {
    expect(separarQuantidade('  ')).toEqual({ principal: null, detalhe: null });
  });
});
