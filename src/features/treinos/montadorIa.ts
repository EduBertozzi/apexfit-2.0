import { exercicioDeAquecimento, itemPadrao } from './aquecimento';
import {
  CIRCUITO_PADRAO,
  circuitoDoDia,
  circuitoValido,
  noFormatoDoCircuito,
  passoNoCircuito,
  textoCircuito,
} from './circuito';
import { REGIOES } from './catalogo';
import {
  AREAS_TREINO,
  LIMITES_MONTADOR,
  type AreaEscolhida,
  type AreaTreino,
  type CircuitoCardio,
  type DiaMontado,
  type EquipamentoTreino,
  type EscolhasSemana,
  type NivelTreino,
} from './contratoIa';
import { diasDoTexto } from './diasIa';
import { grupoDe, inferirGrupo, NOME_GRUPO } from './grupos';
import { LIMITES } from './schema';
import { NOME_DIA, SIGLAS_DIA } from './semana';
import type { DadosExercicio, DadosTreino } from './types';

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

// ---------------------------------------------------------------------------
// Quantos exercícios por dia
// ---------------------------------------------------------------------------

/**
 * Exercícios por dia (sem o aquecimento) quando a pessoa não mexe no contador.
 * Iniciante 5 (uns 40 min com 3 séries), intermediário 6, avançado 7 (volume
 * maior, quem treina há tempo aguenta). Cardio conta como 1.
 */
export const EXERCICIOS_POR_NIVEL: Record<NivelTreino, number> = {
  iniciante: 5,
  intermediario: 6,
  avancado: 7,
};

/**
 * Quem recebe os exercícios que sobram primeiro: áreas grandes (perna, costas,
 * peito) antes das pequenas. Cardio fica sempre com 1.
 */
const ORDEM_POR_TAMANHO: readonly AreaTreino[] = [
  'perna',
  'costas',
  'peito',
  'ombro',
  'braco',
  'abdominal',
];

const { min: MIN_EXERCICIOS, max: MAX_EXERCICIOS } = LIMITES_MONTADOR.exerciciosPorDia;

function entre(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/** O dia tem alguma área de força? Só cardio (ou nada) não tem contador. */
function temForca(dia: DiaMontado): boolean {
  return dia.areas.some((item) => item.area !== 'cardio');
}

/** Áreas que entram no contador: todas, menos o cardio em circuito (bloco à parte). */
function areasNoContador(dia: DiaMontado): AreaEscolhida[] {
  const circuito = circuitoDoDia(dia);

  return dia.areas.filter((item) => !(item.area === 'cardio' && circuito));
}

/** Menor quantidade do dia: o limite do contador ou 1 por área, o que for maior. */
export function minimoExercicios(dia: DiaMontado): number {
  return Math.max(MIN_EXERCICIOS, areasNoContador(dia).length);
}

/**
 * Quantos exercícios o dia tem de verdade (sem o aquecimento e sem o circuito
 * de cardio): o escolhido ou o padrão do nível, nunca menos que 1 por área (a
 * quantidade sobe junto) nem mais que o limite. Dia só de cardio contínuo: 1;
 * só de circuito ou sem área: 0.
 */
export function exerciciosDoDia(dia: DiaMontado, nivel: NivelTreino): number {
  if (!temForca(dia)) {
    return areasNoContador(dia).length;
  }

  return entre(
    dia.exercicios ?? EXERCICIOS_POR_NIVEL[nivel],
    minimoExercicios(dia),
    MAX_EXERCICIOS,
  );
}

export type QuantidadeDaArea = { area: AreaEscolhida; quantidade: number };

/**
 * Reparte os exercícios do dia entre as áreas, na ordem das áreas do dia:
 * 1 para cada, cardio contínuo fica com 1 e o resto vai um por vez para as
 * áreas de força, das grandes para as pequenas. Ex: peito e braço com 5 dá
 * peito 3 e braço 2; com 6, 3 e 3. Cardio em circuito fica com os exercícios
 * do circuito, fora da conta.
 */
export function distribuirExercicios(dia: DiaMontado, nivel: NivelTreino): QuantidadeDaArea[] {
  const contadas = areasNoContador(dia);
  const quantidades = new Map<AreaTreino, number>(contadas.map((item) => [item.area, 1]));
  const forca = ORDEM_POR_TAMANHO.filter((area) => quantidades.has(area));
  let sobra = exerciciosDoDia(dia, nivel) - contadas.length;
  const circuito = circuitoDoDia(dia);

  if (circuito) {
    quantidades.set('cardio', circuito.exercicios);
  }

  for (let i = 0; sobra > 0 && forca.length > 0; i++, sobra--) {
    const area = forca[i % forca.length];
    quantidades.set(area, (quantidades.get(area) ?? 0) + 1);
  }

  return dia.areas.map((area) => ({ area, quantidade: quantidades.get(area.area) ?? 1 }));
}

/** O que o contador "exercícios" do dia mostra (valores e textos). */
export function contadorExercicios(dia: DiaMontado, nivel: NivelTreino) {
  const valor = exerciciosDoDia(dia, nivel);
  const padrao = dia.exercicios === undefined;
  const noDiaTexto = textoNoDia(dia.dia);
  // Mais áreas que exercícios: a quantidade sobe para 1 por área
  const subiu = valor > (dia.exercicios ?? EXERCICIOS_POR_NIVEL[nivel]);

  return {
    /** Dia só de cardio ou sem área não tem contador. */
    visivel: temForca(dia),
    valor,
    padrao,
    podeMenos: valor > minimoExercicios(dia),
    podeMais: valor < MAX_EXERCICIOS,
    rotuloAcessivel: `${textoExercicios(valor)} ${noDiaTexto}`,
    valorAcessivel: padrao ? `padrão do nível ${NOME_NIVEL[nivel]}` : 'escolhido por você',
    rotuloMenos: `menos um exercício ${noDiaTexto}`,
    rotuloMais: `mais um exercício ${noDiaTexto}`,
    legenda: subiu
      ? 'pelo menos 1 por área, sem contar o aquecimento'
      : padrao
        ? `padrão do nível ${NOME_NIVEL[nivel]}, sem contar o aquecimento`
        : 'sem contar o aquecimento',
  };
}

export type ModoCardio = 'continuo' | 'circuito';

/** Opções de cardio do dia, para as pílulas "contínuo" e "circuito". */
export function opcoesCardio(dia: DiaMontado) {
  const atual: ModoCardio = circuitoDoDia(dia) ? 'circuito' : 'continuo';
  const noDiaTexto = textoNoDia(dia.dia);

  return {
    /** Só aparece quando o dia tem cardio. */
    visivel: dia.areas.some((item) => item.area === 'cardio'),
    legenda:
      atual === 'circuito'
        ? 'exercícios curtos com o peso do corpo, em voltas. não entram na conta dos exercícios'
        : 'um aparelho ou corrida, por minutos',
    opcoes: (['continuo', 'circuito'] as const).map((modo) => ({
      modo,
      rotulo: modo === 'continuo' ? 'contínuo' : 'circuito',
      selecionada: modo === atual,
      rotuloAcessivel: `cardio ${modo === 'continuo' ? 'contínuo' : 'em circuito'} ${noDiaTexto}`,
    })),
  };
}

const ROTULOS_CIRCUITO: Record<
  keyof CircuitoCardio,
  { rotulo: string; falado: (valor: number) => string; valor: (valor: number) => string }
> = {
  exercicios: {
    rotulo: 'exercícios no circuito',
    falado: (valor) => `${textoExercicios(valor)} no circuito`,
    valor: String,
  },
  segundos: {
    rotulo: 'segundos por exercício',
    falado: (valor) => `${valor} segundos por exercício`,
    valor: (valor) => `${valor} s`,
  },
  voltas: {
    rotulo: 'voltas',
    falado: (valor) => (valor === 1 ? '1 volta' : `${valor} voltas`),
    valor: String,
  },
};

/** Os três contadores do circuito (exercícios, segundos e voltas) com os textos. */
export function contadoresCircuito(dia: DiaMontado) {
  const circuito = circuitoDoDia(dia);

  if (!circuito) {
    return [];
  }

  const noDiaTexto = textoNoDia(dia.dia);

  return (Object.keys(ROTULOS_CIRCUITO) as (keyof CircuitoCardio)[]).map((campo) => {
    const textos = ROTULOS_CIRCUITO[campo];
    const { min, max } = LIMITES_MONTADOR.circuito[campo];
    const valor = circuito[campo];

    return {
      campo,
      rotulo: textos.rotulo,
      valorTexto: textos.valor(valor),
      rotuloAcessivel: `${textos.falado(valor)} ${noDiaTexto}`,
      rotuloMenos: `diminuir ${textos.rotulo} ${noDiaTexto}`,
      rotuloMais: `aumentar ${textos.rotulo} ${noDiaTexto}`,
      podeMenos: valor > min,
      podeMais: valor < max,
    };
  });
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

/**
 * Um exercício a mais ou a menos no dia. A partir daqui o número fica fixo
 * (não muda mais com o nível) até a pessoa voltar para o padrão.
 */
export function passoExercicios(
  escolhas: EscolhasSemana,
  dia: number,
  sentido: 1 | -1,
): EscolhasSemana {
  return noDia(escolhas, dia, (item) => {
    if (!temForca(item)) {
      return item;
    }

    const exercicios = entre(
      exerciciosDoDia(item, escolhas.nivel) + sentido,
      minimoExercicios(item),
      MAX_EXERCICIOS,
    );

    return { ...item, exercicios };
  });
}

/** Cardio contínuo (um aparelho, por minutos) ou em circuito. */
export function modoCardio(
  escolhas: EscolhasSemana,
  dia: number,
  modo: 'continuo' | 'circuito',
): EscolhasSemana {
  return noDia(escolhas, dia, (item) => {
    if (modo === 'circuito') {
      return { ...item, circuito: item.circuito ?? CIRCUITO_PADRAO };
    }

    const { circuito: _circuito, ...resto } = item;

    return resto;
  });
}

/** Um passo num dos números do circuito (exercícios, segundos ou voltas). */
export function passoCircuito(
  escolhas: EscolhasSemana,
  dia: number,
  campo: keyof CircuitoCardio,
  sentido: 1 | -1,
): EscolhasSemana {
  return noDia(escolhas, dia, (item) =>
    item.circuito ? { ...item, circuito: passoNoCircuito(item.circuito, campo, sentido) } : item,
  );
}

/** Volta o dia para o padrão do nível. */
export function exerciciosPadrao(escolhas: EscolhasSemana, dia: number): EscolhasSemana {
  return noDia(escolhas, dia, ({ exercicios: _exercicios, ...resto }) => resto);
}

/** Copia as áreas e regiões de um dia para outro (atalho "igual a segunda"). */
export function copiarDia(escolhas: EscolhasSemana, de: number, para: number): EscolhasSemana {
  const origem = escolhas.dias.find((item) => item.dia === de);

  if (!origem || de === para) {
    return escolhas;
  }

  return noDia(escolhas, para, (item) => {
    const copia = {
      dia: item.dia,
      areas: origem.areas.map((area) => ({ ...area, regioes: [...area.regioes] })),
    };

    // A quantidade e o circuito vêm juntos; o que a origem não tem, o destino também não
    return {
      ...copia,
      ...(origem.exercicios === undefined ? {} : { exercicios: origem.exercicios }),
      ...(origem.circuito === undefined ? {} : { circuito: { ...origem.circuito } }),
    };
  });
}

/** Dias marcados que já têm áreas e podem servir de modelo para `dia`. */
export function diasParaCopiar(escolhas: EscolhasSemana, dia: number): number[] {
  return escolhas.dias
    .filter((item) => item.dia !== dia && item.areas.length > 0)
    .map((item) => item.dia);
}

/**
 * Dia salvo: sem quantidade de exercícios (versões antigas) ou com uma fora
 * do limite, fica no padrão do nível.
 */
function diaValido(dia: DiaMontado): DiaMontado {
  const { exercicios, circuito: salvo, ...resto } = dia;
  const valida =
    typeof exercicios === 'number' &&
    Number.isInteger(exercicios) &&
    exercicios >= MIN_EXERCICIOS &&
    exercicios <= MAX_EXERCICIOS;
  const circuito = circuitoValido(salvo);

  return {
    ...resto,
    ...(valida ? { exercicios } : {}),
    ...(circuito ? { circuito } : {}),
  };
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
    dias: Array.isArray(dados.dias) ? ordenar(dados.dias.map(diaValido)) : ESCOLHAS_PADRAO.dias,
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

/** "1 exercício", "6 exercícios". */
export function textoExercicios(quantidade: number): string {
  return quantidade === 1 ? '1 exercício' : `${quantidade} exercícios`;
}

/** "na segunda", "no sábado". */
export function textoNoDia(dia: number): string {
  return `${dia === 0 || dia === 6 ? 'no' : 'na'} ${NOME_DIA[dia]}`;
}

/** Partes do resumo: foco, quantidade (se houver) e circuito (se houver). */
function partesDoDia(dia: DiaMontado, nivel: NivelTreino): string[] {
  const quantidade = exerciciosDoDia(dia, nivel);
  const circuito = circuitoDoDia(dia);

  return [
    focoDoDia(dia),
    quantidade > 0 ? textoExercicios(quantidade) : null,
    circuito ? textoCircuito(circuito) : null,
  ].filter((parte) => parte !== null);
}

/**
 * Resumo da linha do dia no montador: "peito e braço (tríceps) · 6 exercícios"
 * ou "perna e cardio · 5 exercícios · circuito: 4 exercícios de 40 s, 3 voltas".
 */
export function resumoDoDia(dia: DiaMontado, nivel: NivelTreino): string {
  return dia.areas.length === 0
    ? 'toque para escolher o que treinar'
    : partesDoDia(dia, nivel).join(' · ');
}

/** Para o leitor de tela: "segunda, peito e braço (tríceps), 6 exercícios". */
export function rotuloDoDia(dia: DiaMontado, nivel: NivelTreino): string {
  return dia.areas.length === 0
    ? `${NOME_DIA[dia.dia]}, sem áreas escolhidas`
    : [NOME_DIA[dia.dia], ...partesDoDia(dia, nivel)].join(', ');
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

/** Nome para comparar exercícios: sem acento, caixa nem espaço sobrando. */
function chaveDoNome(nome: string): string {
  return nome
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Grupo de um exercício da IA; "outro" ainda tenta pelo nome. */
function grupoDaIa(exercicio: DadosExercicio) {
  const grupo = grupoDe(exercicio);

  return grupo === 'outro' ? inferirGrupo(exercicio.nome) : grupo;
}

/**
 * Deixa no treino só o que a pessoa pediu para o dia: o aquecimento (quando
 * ligado) e as áreas escolhidas, cada uma com a quantidade de
 * `distribuirExercicios`. Área com exercício a mais é cortada; com a menos,
 * completa com os de grupo desconhecido da IA e depois com a `reserva` (o
 * treino offline do dia), sem repetir nome.
 */
function ajustarTreino(
  treino: DadosTreino,
  dia: DiaMontado,
  nivel: NivelTreino,
  comAquecimento: boolean,
  reserva: readonly DadosExercicio[],
) {
  const exercicios = treino.exercicios ?? [];
  const aquecimento = exercicios.filter((item) => grupoDe(item) === 'aquecimento');
  const semAquecimento = exercicios.filter((item) => grupoDe(item) !== 'aquecimento');
  const desconhecidos = semAquecimento.filter((item) => grupoDaIa(item) === 'outro');
  const usados = new Set<string>();
  const resto: DadosExercicio[] = [];

  const circuito = circuitoDoDia(dia);

  for (const { area, quantidade } of distribuirExercicios(dia, nivel)) {
    const fontes = [
      semAquecimento.filter((item) => grupoDaIa(item) === area.area),
      desconhecidos,
      reserva.filter((item) => grupoDe(item) === area.area),
    ];
    let colocados = 0;

    for (const fonte of fontes) {
      while (colocados < quantidade && fonte.length > 0) {
        const item = fonte.shift()!;
        const chave = chaveDoNome(item.nome);

        // O mesmo exercício duas vezes no dia não conta
        if (!usados.has(chave)) {
          usados.add(chave);
          // No circuito, todo cardio sai com as voltas e os segundos escolhidos
          resto.push(
            area.area === 'cardio' && circuito ? noFormatoDoCircuito(item, circuito) : item,
          );
          colocados++;
        }
      }
    }
  }

  return { aquecimento: comAquecimento ? aquecimento : [], resto };
}

/**
 * Monta os treinos finais da semana: um por dia escolhido, com `dias: [dia]`,
 * nome "treino de segunda", só as áreas pedidas, na quantidade escolhida, e o
 * aquecimento na frente. Dia que a IA deixou vazio (ou sem nada das áreas) usa
 * o treino `reserva` (o do modo offline), para nunca faltar treino; a reserva
 * também completa a área que a IA deixou com exercícios a menos.
 */
export function prepararSemana(
  gerados: readonly DadosTreino[],
  escolhas: EscolhasSemana,
  reserva: readonly DadosTreino[] = [],
): DadosTreino[] {
  const { nivel } = escolhas;
  const comAquecimento = escolhas.aquecimento.ativo;
  const doUsuario = comAquecimento ? escolhas.aquecimento.itens.map(exercicioDeAquecimento) : [];
  const casados = casarComDias(gerados, escolhas.dias);
  const reservas = casarComDias(reserva, escolhas.dias);

  return escolhas.dias.flatMap((dia, indice) => {
    const opcoes = [casados[indice], reservas[indice]].filter(
      (treino): treino is DadosTreino => treino !== undefined,
    );

    const extras = reservas[indice]?.exercicios ?? [];

    for (const treino of opcoes) {
      const { aquecimento, resto } = ajustarTreino(treino, dia, nivel, comAquecimento, extras);

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
