import {
  ajustarPorcao,
  ALIMENTOS,
  buscarAlimento,
  medidaCaseira,
  nutrientesDaPorcao,
  textoQuantidade,
} from '../alimentos';
import { MODELOS } from '../cardapios';
import { alimentoPermitido, lerRestricoes, normalizarTexto } from '../restricoes';

describe('tabela de alimentos', () => {
  it('tem uns 40 alimentos do dia a dia', () => {
    expect(Object.keys(ALIMENTOS).length).toBeGreaterThanOrEqual(38);
    expect(ALIMENTOS.arroz.nome).toBe('Arroz branco');
    expect(ALIMENTOS.feijao.nome).toBe('Feijão carioca');
  });

  it('calorias batem com os macros (4, 4, 9), com folga para fibras e arredondamento', () => {
    for (const alimento of Object.values(ALIMENTOS)) {
      const conta = alimento.proteina * 4 + alimento.carboidrato * 4 + alimento.gordura * 9;

      expect(Math.abs(conta - alimento.kcal)).toBeLessThanOrEqual(
        Math.max(5, alimento.kcal * 0.15),
      );
    }
  });

  it('as trocas e os modelos só citam alimentos que existem', () => {
    for (const alimento of Object.values(ALIMENTOS)) {
      (alimento.trocas ?? []).forEach((id) => expect(ALIMENTOS[id]).toBeDefined());
    }

    for (const modelos of Object.values(MODELOS)) {
      for (const modelo of modelos) {
        modelo.itens.forEach((item) =>
          item.opcoes.forEach(({ id }) => expect(ALIMENTOS[id]).toBeDefined()),
        );
      }
    }
  });

  it('busca falha alto para id desconhecido', () => {
    expect(() => buscarAlimento('pizza')).toThrow('pizza');
  });

  it('calcula nutrientes por 100 g e por unidade', () => {
    expect(nutrientesDaPorcao(ALIMENTOS.frango, 150).proteina).toBeCloseTo(48);
    expect(nutrientesDaPorcao(ALIMENTOS.ovo, 2).kcal).toBeCloseTo(146);
    expect(nutrientesDaPorcao(ALIMENTOS.salada, 999).kcal).toBeCloseTo(15);
  });
});

describe('medidas caseiras', () => {
  it('arredonda para meias medidas com gênero certo', () => {
    const colher = ALIMENTOS.tapioca.medida;
    const file = ALIMENTOS.frango.medida;

    expect(medidaCaseira(colher, 20)).toBe('1 colher de sopa');
    expect(medidaCaseira(colher, 30)).toBe('1 colher de sopa e meia');
    expect(medidaCaseira(colher, 80)).toBe('4 colheres de sopa');
    expect(medidaCaseira(colher, 5)).toBe('meia colher de sopa');
    expect(medidaCaseira(file, 50)).toBe('meio filé médio');
    expect(medidaCaseira(file, 250)).toBe('2 filés médios e meio');
  });

  it('formata a quantidade de cada tipo', () => {
    expect(textoQuantidade(ALIMENTOS.feijao, 180)).toBe('180 g (2 conchas)');
    expect(textoQuantidade(ALIMENTOS.leite, 200)).toBe('200 ml (1 copo)');
    expect(textoQuantidade(ALIMENTOS.ovo, 1)).toBe('1 unidade');
    expect(textoQuantidade(ALIMENTOS['pao-integral'], 2)).toBe('2 fatias');
    expect(textoQuantidade(ALIMENTOS.salada, 100)).toBe('À vontade (1 prato raso)');
  });

  it('ajusta a porção ao passo e aos limites', () => {
    expect(ajustarPorcao(ALIMENTOS.arroz, 123)).toBe(120);
    expect(ajustarPorcao(ALIMENTOS.arroz, 10)).toBe(ALIMENTOS.arroz.min);
    expect(ajustarPorcao(ALIMENTOS.ovo, 9)).toBe(ALIMENTOS.ovo.max);
    expect(ajustarPorcao(ALIMENTOS.aveia, 32)).toBe(30);
  });
});

describe('lerRestricoes', () => {
  it('normaliza acentos e maiúsculas', () => {
    expect(normalizarTexto('Intolerância à LACTOSE')).toBe('intolerancia a lactose');
  });

  it('sem texto, nada bloqueado', () => {
    expect(lerRestricoes(undefined).bloqueadas.size).toBe(0);
    expect(lerRestricoes('nenhuma').rotulos).toEqual([]);
  });

  it('reconhece as restrições mais comuns', () => {
    expect(lerRestricoes('intolerância à lactose').rotulos).toEqual(['sem lactose']);
    expect(lerRestricoes('Sou vegetariana').rotulos).toEqual(['vegetariano']);
    expect(lerRestricoes('doença celíaca').rotulos).toEqual(['sem glúten']);
    expect(lerRestricoes('alergia a amendoim e castanhas').rotulos).toEqual([
      'sem amendoim',
      'sem castanhas',
    ]);
    expect(lerRestricoes('alergia a ovo').rotulos).toEqual(['sem ovo']);
    expect(lerRestricoes('alergia a frutos do mar').rotulos).toEqual(['sem peixe']);
    expect(lerRestricoes('APLV').rotulos).toEqual(['sem leite e derivados']);
  });

  it('vegano cobre vegetariano e lactose sem repetir no resumo', () => {
    const r = lerRestricoes('vegano, sem lactose');

    expect(r.rotulos).toEqual(['vegano']);
    expect(alimentoPermitido(ALIMENTOS.ovo, r)).toBe(false);
    expect(alimentoPermitido(ALIMENTOS['iogurte-sem-lactose'], r)).toBe(false);
    expect(alimentoPermitido(ALIMENTOS.tofu, r)).toBe(true);
  });

  it('lactose só bloqueia as versões com lactose', () => {
    const r = lerRestricoes('lactose');

    expect(alimentoPermitido(ALIMENTOS.leite, r)).toBe(false);
    expect(alimentoPermitido(ALIMENTOS['leite-sem-lactose'], r)).toBe(true);
  });
});
