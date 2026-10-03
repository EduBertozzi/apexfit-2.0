import {
  ajustarFim,
  ajustarInicio,
  horariosDoDia,
  MENSAGENS_LEMBRETE,
  mensagemDoLembrete,
  montarLembretes,
  paraHorario,
  paraMinutos,
  resumoLembretes,
  validarConfig,
} from '../logica';

const PADRAO = { inicio: '08:00', fim: '22:00', intervaloMin: 120 };

describe('paraMinutos e paraHorario', () => {
  it('convertem nos dois sentidos', () => {
    expect(paraMinutos('08:30')).toBe(510);
    expect(paraHorario(510)).toBe('08:30');
    expect(paraHorario(0)).toBe('00:00');
  });

  it('recusam formato inválido', () => {
    expect(paraMinutos('8:30')).toBeNull();
    expect(paraMinutos('24:00')).toBeNull();
    expect(paraMinutos('10:60')).toBeNull();
    expect(paraMinutos('abc')).toBeNull();
  });
});

describe('validarConfig', () => {
  it('aceita a configuração padrão', () => {
    expect(validarConfig(PADRAO)).toBeNull();
  });

  it('exige início antes do fim', () => {
    expect(validarConfig({ ...PADRAO, inicio: '22:00', fim: '08:00' })).toMatch(/antes do fim/);
    expect(validarConfig({ ...PADRAO, inicio: '10:00', fim: '10:00' })).toMatch(/antes do fim/);
  });

  it('só aceita os intervalos da lista', () => {
    for (const intervaloMin of [60, 90, 120, 180]) {
      expect(validarConfig({ ...PADRAO, intervaloMin })).toBeNull();
    }
    expect(validarConfig({ ...PADRAO, intervaloMin: 45 })).toMatch(/intervalo/);
  });

  it('recusa horário mal escrito', () => {
    expect(validarConfig({ ...PADRAO, inicio: '8h' })).toMatch(/inválido/);
  });
});

describe('horariosDoDia', () => {
  it('vai do início ao fim, incluindo o fim quando cai certinho', () => {
    expect(horariosDoDia(PADRAO)).toEqual([
      '08:00',
      '10:00',
      '12:00',
      '14:00',
      '16:00',
      '18:00',
      '20:00',
      '22:00',
    ]);
  });

  it('para antes do fim quando o intervalo não fecha certinho', () => {
    expect(horariosDoDia({ inicio: '08:00', fim: '12:00', intervaloMin: 90 })).toEqual([
      '08:00',
      '09:30',
      '11:00',
    ]);
  });

  it('não gera nada com configuração inválida', () => {
    expect(horariosDoDia({ ...PADRAO, inicio: '23:00' })).toEqual([]);
    expect(horariosDoDia({ ...PADRAO, intervaloMin: 30 })).toEqual([]);
  });
});

describe('mensagemDoLembrete', () => {
  it('varia e volta ao começo depois da última', () => {
    expect(mensagemDoLembrete(0)).not.toBe(mensagemDoLembrete(1));
    expect(mensagemDoLembrete(MENSAGENS_LEMBRETE.length)).toBe(mensagemDoLembrete(0));
  });

  it('não tem emoji nem travessão', () => {
    for (const mensagem of MENSAGENS_LEMBRETE) {
      expect(mensagem).not.toMatch(/[—–]|\p{Extended_Pictographic}/u);
    }
  });
});

describe('montarLembretes', () => {
  it('monta um lembrete por horário, com id estável e mensagens variadas', () => {
    const lembretes = montarLembretes({ inicio: '08:00', fim: '11:00', intervaloMin: 90 });

    expect(lembretes.map(({ id, hora, minuto }) => ({ id, hora, minuto }))).toEqual([
      { id: 'apexfit-agua-0800', hora: 8, minuto: 0 },
      { id: 'apexfit-agua-0930', hora: 9, minuto: 30 },
      { id: 'apexfit-agua-1100', hora: 11, minuto: 0 },
    ]);
    expect(new Set(lembretes.map((lembrete) => lembrete.corpo)).size).toBe(3);
  });
});

describe('resumoLembretes', () => {
  it('conta os lembretes e mostra a janela', () => {
    expect(resumoLembretes(PADRAO)).toBe('8 lembretes por dia, das 08:00 às 22:00');
  });

  it('usa singular com um lembrete só', () => {
    expect(resumoLembretes({ inicio: '08:00', fim: '08:30', intervaloMin: 60 })).toBe(
      '1 lembrete por dia, das 08:00 às 08:30',
    );
  });

  it('avisa quando não há lembrete', () => {
    expect(resumoLembretes({ ...PADRAO, intervaloMin: 10 })).toMatch(/Nenhum/);
  });
});

describe('ajustarInicio e ajustarFim', () => {
  it('andam de 30 em 30 minutos', () => {
    expect(ajustarInicio(PADRAO, 1)).toBe('08:30');
    expect(ajustarInicio(PADRAO, -1)).toBe('07:30');
    expect(ajustarFim(PADRAO, 1)).toBe('22:30');
    expect(ajustarFim(PADRAO, -1)).toBe('21:30');
  });

  it('o início não encosta no fim e o fim não passa do início', () => {
    const colados = { ...PADRAO, inicio: '10:00', fim: '10:30' };

    expect(ajustarInicio(colados, 1)).toBe('10:00');
    expect(ajustarFim(colados, -1)).toBe('10:30');
  });

  it('respeitam os limites do dia', () => {
    expect(ajustarInicio({ ...PADRAO, inicio: '00:00' }, -1)).toBe('00:00');
    expect(ajustarFim({ ...PADRAO, fim: '23:30' }, 1)).toBe('23:30');
  });
});
