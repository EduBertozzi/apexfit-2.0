import { exerciciosDe, MISTO } from '../catalogo';
import {
  abaInicial,
  alternarDia,
  alternarSelecao,
  desmarcarUltimo,
  grupoInicial,
  marcarMaisUm,
  mesmosDias,
  montarCardio,
  montarMusculacao,
  moverExercicioNoGrupo,
  moverNoGrupo,
  outrosTreinosNoDia,
  padraoDaRegiao,
  passo,
  PASSOS,
  posicaoNoGrupo,
  regiaoInicial,
  reordenarExercicioNoGrupo,
  reordenarNoGrupo,
  descricaoBotaoSalvar,
  textoBotaoSalvar,
  textoDias,
  textoDiasAcessivel,
  validarNomeLivre,
} from '../montagem';
import type { Exercicio, GrupoMuscular, Treino } from '../types';

function ex(id: string, grupo: GrupoMuscular): Exercicio {
  return { id, nome: id, grupo, series: 3, repeticoes: '10' };
}

describe('abas e valores iniciais', () => {
  it('aceita só abas conhecidas', () => {
    expect(abaInicial('plano')).toBe('plano');
    expect(abaInicial('cardio')).toBe('cardio');
    expect(abaInicial('qualquer')).toBe('musculacao');
    expect(abaInicial(undefined)).toBe('musculacao');
  });

  it('grupo inicial é o do último exercício de musculação', () => {
    expect(grupoInicial({ exercicios: [] })).toBe('peito');
    expect(grupoInicial({ exercicios: [ex('a', 'perna'), ex('b', 'braco')] })).toBe('braco');
    expect(grupoInicial({ exercicios: [ex('a', 'cardio')] })).toBe('peito');
  });

  it('região inicial é misto quando há várias', () => {
    expect(regiaoInicial('braco')).toBe(MISTO);
    expect(regiaoInicial('outro')).toBeUndefined();
  });

  it('padrão de séries e repetições vem do primeiro exercício da região', () => {
    expect(padraoDaRegiao('perna', 'panturrilha')).toEqual({ series: 4, repeticoes: 15 });
    expect(padraoDaRegiao('outro', undefined)).toEqual({ series: 3, repeticoes: 12 });
  });

  it('passo respeita os limites', () => {
    expect(passo(5, -1, PASSOS.minutos)).toBe(5);
    expect(passo(10, 1, PASSOS.minutos)).toBe(15);
    expect(passo(20, 1, PASSOS.series)).toBe(20);
    expect(passo(1, -1, PASSOS.repeticoes)).toBe(1);
  });
});

describe('seleção', () => {
  const triceps = exerciciosDe('braco', 'triceps');

  it('alterna mantendo a ordem', () => {
    expect(alternarSelecao(['a'], 'b')).toEqual(['a', 'b']);
    expect(alternarSelecao(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('mais um marca o próximo livre; menos um tira o último', () => {
    const um = marcarMaisUm(triceps, []);
    const dois = marcarMaisUm(triceps, um);

    expect(dois).toEqual([triceps[0].nome, triceps[1].nome]);
    expect(desmarcarUltimo(dois)).toEqual(um);
    expect(desmarcarUltimo([])).toEqual([]);

    const todos = triceps.map((item) => item.nome);
    expect(marcarMaisUm(triceps, todos)).toEqual(todos);
  });
});

describe('montarMusculacao', () => {
  it('usa o grupo e os contadores, e soma o nome digitado no fim', () => {
    const dados = montarMusculacao({
      selecionados: ['Tríceps corda'],
      nomeLivre: '  Tríceps coice ',
      grupo: 'braco',
      series: 4,
      repeticoes: 10,
    });

    expect(dados).toEqual([
      { nome: 'Tríceps corda', grupo: 'braco', series: 4, repeticoes: '10' },
      { nome: 'Tríceps coice', grupo: 'braco', series: 4, repeticoes: '10' },
    ]);
  });

  it('ignora nome digitado vazio, curto ou repetido', () => {
    const base = {
      selecionados: ['Rosca direta'],
      grupo: 'braco' as const,
      series: 3,
      repeticoes: 12,
    };

    expect(montarMusculacao({ ...base, nomeLivre: '' })).toHaveLength(1);
    expect(montarMusculacao({ ...base, nomeLivre: 'a' })).toHaveLength(1);
    expect(montarMusculacao({ ...base, nomeLivre: 'ROSCA DIRETA' })).toHaveLength(1);
  });

  it('sem grupo, adivinha pelo nome', () => {
    const [dados] = montarMusculacao({
      selecionados: [],
      nomeLivre: 'Supino maluco',
      series: 3,
      repeticoes: 10,
    });

    expect(dados.grupo).toBe('peito');
  });

  it('valida o nome digitado', () => {
    expect(validarNomeLivre('')).toEqual({ valido: false });
    expect(validarNomeLivre('a').erro).toMatch(/pelo menos/);
    expect(validarNomeLivre('x'.repeat(61)).erro).toMatch(/no máximo/);
    expect(validarNomeLivre('Supino')).toEqual({ valido: true });
  });
});

describe('montarCardio e texto do botão', () => {
  it('cardio vira 1 série de N min', () => {
    expect(montarCardio({ selecionados: ['Esteira', 'Escada'], minutos: 20 })).toEqual([
      { nome: 'Esteira', grupo: 'cardio', series: 1, repeticoes: '20 min' },
      { nome: 'Escada', grupo: 'cardio', series: 1, repeticoes: '20 min' },
    ]);
  });

  it('botão fala quantos vão entrar', () => {
    expect(textoBotaoSalvar('musculacao', 0)).toBe('adicionar');
    expect(textoBotaoSalvar('musculacao', 1)).toBe('adicionar 1');
    expect(textoBotaoSalvar('cardio', 3)).toBe('adicionar 3');
    expect(textoBotaoSalvar('plano', 0)).toBe('salvar dias');
    expect(textoBotaoSalvar('plano', 2)).toBe('adicionar 2');
  });

  it('o leitor de tela ouve o botão por extenso', () => {
    expect(descricaoBotaoSalvar('musculacao', 1)).toBe('adicionar 1 exercício');
    expect(descricaoBotaoSalvar('cardio', 3)).toBe('adicionar 3 exercícios');
    expect(descricaoBotaoSalvar('plano', 0)).toBe('salvar dias');
  });
});

describe('plano semanal', () => {
  it('alterna dias em ordem e compara conjuntos', () => {
    expect(alternarDia([5, 1], 3)).toEqual([1, 3, 5]);
    expect(alternarDia([1, 3], 1)).toEqual([3]);
    expect(mesmosDias([3, 1], [1, 3])).toBe(true);
    expect(mesmosDias([], undefined)).toBe(true);
    expect(mesmosDias([1], [])).toBe(false);
  });

  it('mostra quem mais cai no dia', () => {
    const treinos: Treino[] = [
      { id: 'a', nome: 'Treino A', exercicios: [], dias: [1, 3] },
      { id: 'b', nome: 'Treino B', exercicios: [], dias: [1] },
      { id: 'c', nome: 'Treino C', exercicios: [] },
    ];

    expect(outrosTreinosNoDia(treinos, 'a', 1)).toEqual(['Treino B']);
    expect(outrosTreinosNoDia(treinos, 'a', 3)).toEqual([]);
  });

  it('texto dos dias', () => {
    expect(textoDias([5, 1, 3])).toBe('seg, qua e sex');
    expect(textoDias([0])).toBe('dom');
    expect(textoDias(undefined)).toBe('sem dia fixo, segue o rodízio');
    expect(textoDiasAcessivel([1, 3])).toBe('segunda e quarta');
  });
});

describe('reordenar dentro do grupo', () => {
  // Ordem salva misturada: a tela mostra perna (p1, p2, p3) e braço (b1, b2) separados
  const lista = [
    ex('p1', 'perna'),
    ex('b1', 'braco'),
    ex('p2', 'perna'),
    ex('b2', 'braco'),
    ex('p3', 'perna'),
  ];
  const ids = (itens: Exercicio[]) => itens.map((item) => item.id);

  it('arrastar leva para a posição dentro do grupo e não mexe nos outros', () => {
    expect(ids(reordenarNoGrupo(lista, 'p3', 0))).toEqual(['p3', 'b1', 'p1', 'b2', 'p2']);
    expect(ids(reordenarNoGrupo(lista, 'p1', 2))).toEqual(['p2', 'b1', 'p3', 'b2', 'p1']);
    expect(ids(reordenarNoGrupo(lista, 'b2', 0))).toEqual(['p1', 'b2', 'p2', 'b1', 'p3']);
  });

  it('destino fora da faixa vai para a ponta; id desconhecido não muda nada', () => {
    expect(ids(reordenarNoGrupo(lista, 'p1', 99))).toEqual(['p2', 'b1', 'p3', 'b2', 'p1']);
    expect(ids(reordenarNoGrupo(lista, 'p2', -5))).toEqual(['p2', 'b1', 'p1', 'b2', 'p3']);
    expect(ids(reordenarNoGrupo(lista, 'x', 0))).toEqual(ids(lista));
  });

  it('subir e descer pulam exercícios de outros grupos', () => {
    expect(ids(moverNoGrupo(lista, 'p2', 'cima'))).toEqual(['p2', 'b1', 'p1', 'b2', 'p3']);
    expect(ids(moverNoGrupo(lista, 'b1', 'baixo'))).toEqual(['p1', 'b2', 'p2', 'b1', 'p3']);
    expect(ids(moverNoGrupo(lista, 'p1', 'cima'))).toEqual(ids(lista));
    expect(ids(moverNoGrupo(lista, 'p3', 'baixo'))).toEqual(ids(lista));
  });

  it('versões que mexem só no treino certo', () => {
    const treinos: Treino[] = [
      { id: 't1', nome: 'A', exercicios: lista },
      { id: 't2', nome: 'B', exercicios: lista },
    ];

    const reordenado = reordenarExercicioNoGrupo(treinos, 't1', 'p3', 0);
    expect(ids(reordenado[0].exercicios)[0]).toBe('p3');
    expect(reordenado[1]).toBe(treinos[1]);

    const movido = moverExercicioNoGrupo(treinos, 't2', 'p2', 'cima');
    expect(ids(movido[1].exercicios)[0]).toBe('p2');
  });

  it('posição para o leitor de tela', () => {
    expect(posicaoNoGrupo(1, 4, 'braço')).toBe('2 de 4 em braço');
  });
});
