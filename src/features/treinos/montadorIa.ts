import { exercicioDeAquecimento, itemPadrao } from './aquecimento';
import { REGIOES } from './catalogo';
import {
  AREAS_TREINO,
  type AreaTreino,
  type DiaMontado,
  type EquipamentoTreino,
  type EscolhasSemana,
  type NivelTreino,
} from './contratoIa';
import { diasDoTexto } from './diasIa';
import { grupoDe, NOME_GRUPO } from './grupos';
import { LIMITES } from './schema';
import { NOME_DIA, SIGLAS_DIA } from './semana';
import type { DadosTreino } from './types';

/**
 * Montador da semana (central de IA): a pessoa marca os dias, escolhe as áreas
 * de cada dia (e, se quiser, as regiões) e personaliza nível, equipamento,
 * o que evitar e o aquecimento. Lógica pura: a store e a tela só chamam isto.
 */

export const NOME_NIVEL: Record<NivelTreino, string> = {
  iniciante: 'iniciante',
  intermediario: 'intermediário',
  avancado: 'avançado',
};

export const NOME_EQUIPAMENTO: Record<EquipamentoTreino, string> = {
  academia: 'academia completa',
  halteres: 'halteres',
  corpo: 'peso do corpo',
};

/** Semana começando na segunda, como a pessoa fala. */
export const DIAS_DA_SEMANA: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/** Ordem de um dia na semana que começa na segunda (segunda = 0, domingo = 6). */
function posicaoNaSemana(dia: number): number {
  return (dia + 6) % 7;
}

export const ESCOLHAS_PADRAO: EscolhasSemana = {
  dias: [
    {
      dia: 1,
      areas: [
        { area: 'peito', regioes: [] },
        { area: 'braco', regioes: ['triceps'] },
      ],
    },
    { dia: 3, areas: [{ area: 'perna', regioes: [] }] },
    {
      dia: 5,
      areas: [
        { area: 'costas', regioes: [] },
        { area: 'braco', regioes: ['biceps'] },
      ],
    },
  ],
  nivel: 'iniciante',
  equipamento: 'academia',
  evitar: '',
  livre: '',
  aquecimento: {
    ativo: true,
    itens: [itemPadrao('polichinelo'), itemPadrao('mobilidade de quadril')],
  },
};

// ---------------------------------------------------------------------------
// Mudanças nas escolhas (sempre devolvem um objeto novo)
// ---------------------------------------------------------------------------

function ordenar(dias: readonly DiaMontado[]): DiaMontado[] {
  return [...dias].sort((a, b) => posicaoNaSemana(a.dia) - posicaoNaSemana(b.dia));
}

function noDia(
  escolhas: EscolhasSemana,
  dia: number,
  mudar: (dia: DiaMontado) => DiaMontado,
): EscolhasSemana {
  return {
    ...escolhas,
    dias: escolhas.dias.map((item) => (item.dia === dia ? mudar(item) : item)),
  };
}

/** Marca ou desmarca um dia de treino. Dia novo começa sem áreas. */
export function alternarDiaTreino(escolhas: EscolhasSemana, dia: number): EscolhasSemana {
  if (escolhas.dias.some((item) => item.dia === dia)) {
    return { ...escolhas, dias: escolhas.dias.filter((item) => item.dia !== dia) };
  }

  return { ...escolhas, dias: ordenar([...escolhas.dias, { dia, areas: [] }]) };
}

/** Marca ou desmarca uma área no dia. Ao desmarcar, as regiões dela saem junto. */
export function alternarArea(
  escolhas: EscolhasSemana,
  dia: number,
  area: AreaTreino,
): EscolhasSemana {
  return noDia(escolhas, dia, (item) => {
    const temArea = item.areas.some((escolhida) => escolhida.area === area);
    const areas = temArea
      ? item.areas.filter((escolhida) => escolhida.area !== area)
      : [...item.areas, { area, regioes: [] }];

    // Mantém a ordem fixa das áreas (peito, costas, ombro...)
    return {
      ...item,
      areas: areas.sort((a, b) => AREAS_TREINO.indexOf(a.area) - AREAS_TREINO.indexOf(b.area)),
    };
  });
}

/** Marca ou desmarca uma região dentro da área. Nenhuma marcada: a área toda. */
export function alternarRegiao(
  escolhas: EscolhasSemana,
  dia: number,
  area: AreaTreino,
  regiao: string,
): EscolhasSemana {
  const ordem = REGIOES[area].map((item) => item.id);

  if (!ordem.includes(regiao)) {
    return escolhas;
  }

  return noDia(escolhas, dia, (item) => ({
    ...item,
    areas: item.areas.map((escolhida) => {
      if (escolhida.area !== area) {
        return escolhida;
      }

      const regioes = escolhida.regioes.includes(regiao)
        ? escolhida.regioes.filter((id) => id !== regiao)
        : [...escolhida.regioes, regiao];

      // Todas marcadas é o mesmo que nenhuma: volta para "a área toda"
      return {
        ...escolhida,
        regioes:
          regioes.length === ordem.length
            ? []
            : regioes.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b)),
      };
    }),
  }));
}

/** Copia as áreas e regiões de um dia para outro (atalho "igual a segunda"). */
export function copiarDia(escolhas: EscolhasSemana, de: number, para: number): EscolhasSemana {
  const origem = escolhas.dias.find((item) => item.dia === de);

  if (!origem || de === para) {
    return escolhas;
  }

  return noDia(escolhas, para, (item) => ({
    ...item,
    areas: origem.areas.map((area) => ({ ...area, regioes: [...area.regioes] })),
  }));
}

/** Dias marcados que já têm áreas e podem servir de modelo para `dia`. */
export function diasParaCopiar(escolhas: EscolhasSemana, dia: number): number[] {
  return escolhas.dias
    .filter((item) => item.dia !== dia && item.areas.length > 0)
    .map((item) => item.dia);
}

/**
 * Escolhas salvas no aparelho podem ser de uma versão antiga ou estar
 * estragadas: o que não fizer sentido volta para o padrão.
 */
export function escolhasValidas(salvas: unknown): EscolhasSemana {
  if (typeof salvas !== 'object' || salvas === null) {
    return ESCOLHAS_PADRAO;
  }

  const dados = salvas as Partial<EscolhasSemana>;

  return {
    ...ESCOLHAS_PADRAO,
    ...dados,
    dias: Array.isArray(dados.dias) ? ordenar(dados.dias) : ESCOLHAS_PADRAO.dias,
    aquecimento:
      dados.aquecimento && Array.isArray(dados.aquecimento.itens)
        ? dados.aquecimento
        : ESCOLHAS_PADRAO.aquecimento,
  };
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

function juntar(itens: readonly string[]): string {
  return itens.length > 1
    ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
    : (itens[0] ?? '');
}

/** "treino de segunda", "treino de sábado". */
export function nomeTreinoDoDia(dia: number): string {
  return `treino de ${NOME_DIA[dia]}`;
}

/** Nome de uma região da área: "bíceps". */
export function nomeRegiao(area: AreaTreino, regiao: string): string {
  return REGIOES[area].find((item) => item.id === regiao)?.nome ?? regiao;
}

/** "braço (bíceps e tríceps)" ou só "perna" quando é a área toda. */
export function textoArea(area: AreaTreino, regioes: readonly string[]): string {
  const nome = NOME_GRUPO[area];

  return regioes.length === 0
    ? nome
    : `${nome} (${juntar(regioes.map((regiao) => nomeRegiao(area, regiao)))})`;
}

/** Foco do treino do dia: "peito e braço (tríceps)". Vazio quando não há áreas. */
export function focoDoDia(dia: DiaMontado): string {
  return juntar(dia.areas.map((item) => textoArea(item.area, item.regioes)));
}

/** Resumo da linha do dia no montador. */
export function resumoDoDia(dia: DiaMontado): string {
  return dia.areas.length === 0 ? 'toque para escolher o que treinar' : focoDoDia(dia);
}

/** Para o leitor de tela: "segunda, peito e braço (tríceps)". */
export function rotuloDoDia(dia: DiaMontado): string {
  return `${NOME_DIA[dia.dia]}, ${dia.areas.length === 0 ? 'sem áreas escolhidas' : focoDoDia(dia)}`;
}

/** Sigla do dia ("seg"), para a fileira de dias. */
export function siglaDoDia(dia: number): string {
  return SIGLAS_DIA[dia];
}

export function nomeDoDia(dia: number): string {
  return NOME_DIA[dia];
}

/** Texto do botão principal: "gerar 3 treinos". */
/**
 * Uma linha com as escolhas, para o montador fechado:
 * "seg, qua e sex · iniciante · academia completa · com aquecimento".
 */
export function resumoEscolhas(escolhas: EscolhasSemana): string {
  const dias =
    escolhas.dias.length === 0
      ? 'nenhum dia marcado'
      : juntarComE(ordemDaSemana(escolhas.dias.map((dia) => dia.dia)).map(siglaDoDia));
  const aquecimento = escolhas.aquecimento.ativo ? 'com aquecimento' : 'sem aquecimento';

  return [
    dias,
    NOME_NIVEL[escolhas.nivel],
    NOME_EQUIPAMENTO[escolhas.equipamento],
    aquecimento,
  ].join(' · ');
}

/** Segunda primeiro e domingo no fim, como no montador. */
function ordemDaSemana(dias: readonly number[]): number[] {
  return [...dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
}

function juntarComE(partes: readonly string[]): string {
  return partes.length <= 1
    ? (partes[0] ?? '')
    : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

export function textoBotaoGerar(escolhas: EscolhasSemana): string {
  const total = escolhas.dias.length;

  return total === 1 ? 'gerar 1 treino' : `gerar ${total} treinos`;
}

// ---------------------------------------------------------------------------
// Resultado da IA (ou do modo offline) virando os treinos da semana
// ---------------------------------------------------------------------------

function cortar(texto: string, max: number): string {
  return texto.length <= max ? texto : texto.slice(0, max).trim();
}

/**
 * Qual treino vai para qual dia: primeiro pelo nome ("treino de quarta"),
 * depois na ordem em que vieram. Treinos a mais que os dias ficam de fora.
 */
function casarComDias(
  treinos: readonly DadosTreino[],
  dias: readonly DiaMontado[],
): (DadosTreino | undefined)[] {
  const resultado: (DadosTreino | undefined)[] = dias.map(() => undefined);
  const sobra: DadosTreino[] = [];

  for (const treino of treinos) {
    const citados = diasDoTexto(treino.nome);
    const posicao = citados.length === 1 ? dias.findIndex((item) => item.dia === citados[0]) : -1;

    if (posicao >= 0 && resultado[posicao] === undefined) {
      resultado[posicao] = treino;
    } else {
      sobra.push(treino);
    }
  }

  return resultado.map((treino) => treino ?? sobra.shift());
}

/**
 * Deixa no treino só o que a pessoa pediu para o dia: as áreas escolhidas e o
 * aquecimento (quando ligado, sempre primeiro). "Outros" ficam, porque a IA
 * às vezes não sabe o grupo de um exercício válido.
 */
function soAreasDoDia(treino: DadosTreino, dia: DiaMontado, comAquecimento: boolean) {
  const areas = new Set<string>(dia.areas.map((item) => item.area));
  const exercicios = treino.exercicios ?? [];
  const aquecimento = exercicios.filter((item) => grupoDe(item) === 'aquecimento');
  const resto = exercicios.filter((item) => {
    const grupo = grupoDe(item);

    return grupo !== 'aquecimento' && (grupo === 'outro' || areas.has(grupo));
  });

  return { aquecimento: comAquecimento ? aquecimento : [], resto };
}

/**
 * Monta os treinos finais da semana: um por dia escolhido, com `dias: [dia]`,
 * nome "treino de segunda", só as áreas pedidas e o aquecimento na frente.
 * Dia que a IA deixou vazio (ou sem nada das áreas) usa o treino `reserva`
 * (o do modo offline), para nunca faltar treino.
 */
export function prepararSemana(
  gerados: readonly DadosTreino[],
  escolhas: EscolhasSemana,
  reserva: readonly DadosTreino[] = [],
): DadosTreino[] {
  const comAquecimento = escolhas.aquecimento.ativo;
  const doUsuario = comAquecimento ? escolhas.aquecimento.itens.map(exercicioDeAquecimento) : [];
  const casados = casarComDias(gerados, escolhas.dias);
  const reservas = casarComDias(reserva, escolhas.dias);

  return escolhas.dias.flatMap((dia, indice) => {
    const opcoes = [casados[indice], reservas[indice]].filter(
      (treino): treino is DadosTreino => treino !== undefined,
    );

    for (const treino of opcoes) {
      const { aquecimento, resto } = soAreasDoDia(treino, dia, comAquecimento);

      if (resto.length === 0) {
        continue;
      }

      // O aquecimento que a pessoa escolheu vale mais que o inventado pela IA
      const exercicios = [...(doUsuario.length > 0 ? doUsuario : aquecimento), ...resto];

      return [
        {
          nome: nomeTreinoDoDia(dia.dia),
          foco: cortar(focoDoDia(dia), LIMITES.foco.max),
          exercicios,
          dias: [dia.dia],
        },
      ];
    }

    return [];
  });
}
