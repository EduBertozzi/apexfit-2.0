/**
 * Lembretes de beber água: regras puras (sem React e sem expo-notifications).
 *
 * Limitação conhecida: os lembretes são agendados no sistema como notificações
 * diárias fixas. O celular dispara sozinho, mesmo com o app fechado, então não dá
 * para "pular" um lembrete porque a meta de água do dia já foi batida. Para isso
 * seria preciso reagendar a cada copo ou usar push do servidor (fica para depois).
 */

/** Horário no formato "HH:MM", 24 horas. */
export type Horario = string;

export const INTERVALOS_MIN = [60, 90, 120, 180] as const;
export type IntervaloMin = (typeof INTERVALOS_MIN)[number];

export const NOME_INTERVALO: Record<IntervaloMin, string> = {
  60: '1h',
  90: '1h30',
  120: '2h',
  180: '3h',
};

/** Passo dos seletores de início e fim. */
export const PASSO_HORARIO_MIN = 30;

const ULTIMO_MINUTO_DO_DIA = 23 * 60 + 30;

export type ConfigLembretes = {
  inicio: Horario;
  fim: Horario;
  intervaloMin: number;
};

export type Lembrete = {
  /** Identificador estável: o mesmo horário substitui o agendamento anterior. */
  id: string;
  hora: number;
  minuto: number;
  titulo: string;
  corpo: string;
};

export const PREFIXO_ID = 'apexfit-agua-';

export const TITULO_LEMBRETE = 'Bora beber água';

export const MENSAGENS_LEMBRETE = [
  'Hora da água. Um copo agora e você segue no ritmo.',
  'Pausa rápida: um copo de água e de volta ao jogo.',
  'Seu corpo pediu. Bora de água?',
  'Mais um copo para a meta. Você está no caminho.',
  'Água agora, energia depois. Bora.',
] as const;

/** "08:30" vira 510 (minutos desde a meia-noite). Formato inválido vira `null`. */
export function paraMinutos(horario: Horario): number | null {
  const partes = /^(\d{2}):(\d{2})$/.exec(horario);

  if (!partes) {
    return null;
  }

  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);

  if (horas > 23 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

/** 510 vira "08:30". */
export function paraHorario(totalMinutos: number): Horario {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export function intervaloValido(intervaloMin: number): intervaloMin is IntervaloMin {
  return (INTERVALOS_MIN as readonly number[]).includes(intervaloMin);
}

/** Mensagem de erro para mostrar, ou `null` se a configuração estiver certa. */
export function validarConfig({ inicio, fim, intervaloMin }: ConfigLembretes): string | null {
  const inicioMin = paraMinutos(inicio);
  const fimMin = paraMinutos(fim);

  if (inicioMin === null || fimMin === null) {
    return 'horário inválido. use o formato 08:00.';
  }

  if (inicioMin >= fimMin) {
    return 'O início precisa ser antes do fim.';
  }

  if (!intervaloValido(intervaloMin)) {
    return 'escolha um intervalo de 1h, 1h30, 2h ou 3h.';
  }

  return null;
}

/** Horários do dia, do início ao fim (inclusive), de intervalo em intervalo. */
export function horariosDoDia(config: ConfigLembretes): Horario[] {
  if (validarConfig(config) !== null) {
    return [];
  }

  const inicioMin = paraMinutos(config.inicio) as number;
  const fimMin = paraMinutos(config.fim) as number;
  const horarios: Horario[] = [];

  for (let atual = inicioMin; atual <= fimMin; atual += config.intervaloMin) {
    horarios.push(paraHorario(atual));
  }

  return horarios;
}

/** Varia a mensagem ao longo do dia, sempre na mesma ordem. */
export function mensagemDoLembrete(indice: number): string {
  const total = MENSAGENS_LEMBRETE.length;

  return MENSAGENS_LEMBRETE[((indice % total) + total) % total];
}

/** Tudo que o módulo de notificações precisa para agendar. */
export function montarLembretes(config: ConfigLembretes): Lembrete[] {
  return horariosDoDia(config).map((horario, indice) => {
    const totalMinutos = paraMinutos(horario) as number;

    return {
      id: `${PREFIXO_ID}${horario.replace(':', '')}`,
      hora: Math.floor(totalMinutos / 60),
      minuto: totalMinutos % 60,
      titulo: TITULO_LEMBRETE,
      corpo: mensagemDoLembrete(indice),
    };
  });
}

/** "8 lembretes por dia, das 08:00 às 22:00". */
export function resumoLembretes(config: ConfigLembretes): string {
  const total = horariosDoDia(config).length;

  if (total === 0) {
    return 'nenhum lembrete com esses horários.';
  }

  const quantidade = total === 1 ? '1 lembrete por dia' : `${total} lembretes por dia`;

  return `${quantidade}, das ${config.inicio} às ${config.fim}`;
}

/**
 * Move o início em 30 min, sem passar da meia-noite e sem encostar no fim.
 * Se não puder mudar, devolve o mesmo horário.
 */
export function ajustarInicio(config: ConfigLembretes, direcao: 1 | -1): Horario {
  const atual = paraMinutos(config.inicio);
  const fim = paraMinutos(config.fim);

  if (atual === null || fim === null) {
    return config.inicio;
  }

  const proximo = atual + direcao * PASSO_HORARIO_MIN;

  return proximo < 0 || proximo >= fim ? config.inicio : paraHorario(proximo);
}

/** Move o fim em 30 min, até 23:30 e sempre depois do início. */
export function ajustarFim(config: ConfigLembretes, direcao: 1 | -1): Horario {
  const atual = paraMinutos(config.fim);
  const inicio = paraMinutos(config.inicio);

  if (atual === null || inicio === null) {
    return config.fim;
  }

  const proximo = atual + direcao * PASSO_HORARIO_MIN;

  return proximo > ULTIMO_MINUTO_DO_DIA || proximo <= inicio ? config.fim : paraHorario(proximo);
}
