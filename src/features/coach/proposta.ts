import type { PlanoDieta } from '@/features/dieta/contrato';
import { mesclarPlano, resumoMudancasDieta, type SlotRefeicao } from '@/features/dieta/mesclar';
import type { DietaPorDia } from '@/features/dieta/semana';
import type { OrigemPlano } from '@/features/dieta/store';
import { textoDosDias } from '@/features/treinos/diasIa';
import { comDias } from '@/features/treinos/ia';
import { novoId } from '@/features/treinos/logica';
import { mesclarTreinos, restringirAosDias, resumoMudancas } from '@/features/treinos/mesclar';
import type { DadosTreino, GeradorId, Treino } from '@/features/treinos/types';
import { formatarNumero } from '@/shared/lib/numero';
import { minusculaInicial } from '@/shared/lib/texto';

import type { ModoMudanca } from './intencao';

/**
 * Proposta do coach: dieta ou treinos novos que só são salvos quando a pessoa
 * toca em "aplicar". Fica dentro da mensagem do chat (e é salva com ela),
 * junto com o que havia antes, para o "desfazer". Lógica pura.
 */

export type EstadoProposta = 'pendente' | 'aplicado' | 'descartado';

export type ResumoProposta = {
  /** Ex: "2.830 kcal em 5 refeições" ou "3 treinos". */
  titulo: string;
  /** O que muda, ex: "café da manhã trocado". Vazio num plano novo sem nada antes. */
  mudancas: string[];
  /** A lista: refeições com kcal, ou treinos com dias e exercícios. */
  linhas: string[];
};

export type AnteriorDieta = {
  plano: PlanoDieta | null;
  /** Dias com plano próprio antes de aplicar (propostas antigas não têm). */
  porDia?: DietaPorDia;
  origem: OrigemPlano | null;
  geradoEm: string | null;
};

export type PropostaDieta = {
  tipo: 'dieta';
  estado: EstadoProposta;
  resumo: ResumoProposta;
  plano: PlanoDieta;
  origem: OrigemPlano;
  /** Plano novo ou ajuste (propostas antigas não têm: valem como plano novo). */
  modo?: ModoMudanca;
  /** Dias da semana que a proposta muda ("almoço de quarta"). Sem o campo, a semana. */
  dias?: number[];
  /** Num ajuste: as refeições pedidas (o resto de cada dia fica igual). */
  alvos?: SlotRefeicao[];
  /** Só depois de aplicar, até a próxima proposta de dieta ser aplicada. */
  anterior?: AnteriorDieta;
};

export type PropostaTreinos = {
  tipo: 'treinos';
  estado: EstadoProposta;
  resumo: ResumoProposta;
  treinos: Treino[];
  /** Só depois de aplicar, até a próxima proposta de treinos ser aplicada. */
  anterior?: { treinos: Treino[] };
};

export type Proposta = PropostaDieta | PropostaTreinos;

function plural(quantidade: number, um: string, varios: string): string {
  return `${quantidade} ${quantidade === 1 ? um : varios}`;
}

/** "sexta: almoço trocado" quando a proposta é de dias específicos. */
function prefixoDias(linha: string, dias: readonly number[]): string {
  return dias.length > 0 ? `${textoDosDias(dias)}: ${linha}` : linha;
}

/**
 * Plano proposto pela IA ou pelo modo demonstração. `atual`: o plano que vale
 * hoje no alvo (o do dia citado ou o da semana). `dias`: dias citados no
 * pedido; só eles mudam. Ajuste sem mudança: `null`.
 */
export function propostaDeDieta(
  atual: PlanoDieta | null,
  proposto: PlanoDieta,
  opcoes: {
    modo: ModoMudanca;
    alvos: readonly SlotRefeicao[];
    origem: OrigemPlano;
    dias?: readonly number[];
  },
): PropostaDieta | null {
  const dias = [...new Set(opcoes.dias ?? [])].sort((a, b) => a - b);
  const ajuste = opcoes.modo === 'ajuste' && atual !== null;
  const plano = ajuste ? mesclarPlano(atual, proposto, opcoes.alvos) : proposto;
  const umDia = dias.length === 1 ? 'esse dia' : 'esses dias';
  const mudancas = ajuste
    ? resumoMudancasDieta(atual, plano).map((linha) => prefixoDias(linha, dias))
    : dias.length > 0
      ? [prefixoDias(`plano novo só para ${umDia}`, dias)]
      : atual
        ? ['plano novo no lugar do atual']
        : [];

  // Ajuste que não mudou nada não vira proposta
  if (ajuste && mudancas.length === 0) {
    return null;
  }

  const titulo = `${formatarNumero(plano.caloriasDia)} kcal em ${plural(plano.refeicoes.length, 'refeição', 'refeições')}`;

  return {
    tipo: 'dieta',
    estado: 'pendente',
    plano,
    origem: opcoes.origem,
    modo: ajuste ? 'ajuste' : 'novo',
    ...(dias.length > 0 ? { dias } : {}),
    ...(ajuste && opcoes.alvos.length > 0 ? { alvos: [...opcoes.alvos] } : {}),
    resumo: {
      titulo: prefixoDias(titulo, dias),
      mudancas,
      linhas: plano.refeicoes.map(
        (refeicao) =>
          `${refeicao.horario} ${minusculaInicial(refeicao.nome)}: ${formatarNumero(refeicao.calorias)} kcal`,
      ),
    },
  };
}

/**
 * `propostos`: treinos já normalizados (`paraDadosTreino`). Num conjunto novo,
 * cada treino ganha dias da semana (os pedidos ou os padrão). Num ajuste,
 * os dias e os ids dos atuais ficam. Sem treinos (ou ajuste sem mudança), `null`.
 */
export function propostaDeTreinos(
  atuais: readonly Treino[],
  propostos: readonly DadosTreino[],
  opcoes: { modo: ModoMudanca; diasPedidos?: readonly number[]; diasAlvo?: readonly number[] },
  gerarId: GeradorId = novoId,
): PropostaTreinos | null {
  if (propostos.length === 0) {
    return null;
  }

  const ajuste = opcoes.modo === 'ajuste' && atuais.length > 0;
  const dados = ajuste ? propostos : comDias(propostos, opcoes.diasPedidos);
  // Pedido com dia ("o supino da sexta"): só o treino daquele dia pode mudar
  const diasAlvo = ajuste ? (opcoes.diasAlvo ?? []) : [];
  const treinos = restringirAosDias(atuais, mesclarTreinos(atuais, dados, gerarId), diasAlvo);
  const mudancas = ajuste
    ? resumoMudancas(atuais, treinos, { diasAlvo })
    : atuais.length > 0
      ? [`substitui ${plural(atuais.length, 'treino atual', 'treinos atuais')}`]
      : [];

  if (ajuste && mudancas.length === 0) {
    return null;
  }

  return {
    tipo: 'treinos',
    estado: 'pendente',
    treinos,
    resumo: {
      titulo: plural(treinos.length, 'treino', 'treinos'),
      mudancas,
      linhas: treinos.map((treino) => {
        const exercicios = plural(treino.exercicios.length, 'exercício', 'exercícios');
        const dias = treino.dias && treino.dias.length > 0 ? `${textoDosDias(treino.dias)}, ` : '';

        return `${minusculaInicial(treino.nome)}: ${dias}${exercicios}`;
      }),
    },
  };
}

function semAnterior<P extends Proposta>(proposta: P): P {
  const copia = { ...proposta };
  delete copia.anterior;

  return copia;
}

/** Aplica: guarda o que havia antes, para o "desfazer". */
export function aplicarProposta<P extends Proposta>(proposta: P, anterior: P['anterior']): P {
  return { ...proposta, estado: 'aplicado', anterior };
}

export function recusarProposta<P extends Proposta>(proposta: P): P {
  return { ...semAnterior(proposta), estado: 'descartado' };
}

/** Desfaz: volta a ficar pendente (dá para aplicar de novo) e sem o "antes". */
export function desfazerProposta<P extends Proposta>(proposta: P): P {
  return { ...semAnterior(proposta), estado: 'pendente' };
}

/** Pode desfazer: aplicada e ainda com o "antes" guardado. */
export function podeDesfazer(proposta: Proposta): boolean {
  return proposta.estado === 'aplicado' && proposta.anterior !== undefined;
}

type ComProposta = { id: string; proposta?: Proposta };

/**
 * Depois de aplicar uma proposta, as outras do mesmo tipo perdem o "desfazer":
 * só a última aplicada guarda o que havia antes.
 */
export function esquecerAnteriores<M extends ComProposta>(
  mensagens: readonly M[],
  tipo: Proposta['tipo'],
  exceto: string,
): M[] {
  return mensagens.map((mensagem) => {
    const { proposta } = mensagem;

    if (mensagem.id === exceto || !proposta || proposta.tipo !== tipo || !proposta.anterior) {
      return mensagem;
    }

    return { ...mensagem, proposta: semAnterior(proposta) };
  });
}
