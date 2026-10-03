import type { Perfil } from '@/features/perfil/types';

import type { PlanoDieta } from '../contrato';
import { useDietaStore } from '../store';

const PERFIL: Perfil = {
  nome: 'Eduardo',
  idade: 21,
  alturaCm: 188,
  pesoKg: 75,
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'manter',
};

const PLANO: PlanoDieta = {
  resumo: 'Plano de manutenção.',
  caloriasDia: 2830,
  macros: { proteinaG: 120, carboidratoG: 446, gorduraG: 63 },
  refeicoes: [
    {
      nome: 'Café da manhã',
      horario: '07:00',
      calorias: 600,
      itens: [{ alimento: 'Ovos mexidos', quantidade: '3 unidades' }],
      substituicoes: [],
    },
  ],
  dicas: ['Beba água ao longo do dia.'],
  aviso: 'Consulte um nutricionista.',
};

function responder(status: number, corpo: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(corpo),
  });
}

beforeEach(() => {
  useDietaStore.setState({ plano: null, geradoEm: null, gerando: false, erro: null });
});

describe('useDietaStore.gerar', () => {
  it('salva o plano quando o servidor responde certo', async () => {
    responder(200, { plano: PLANO });

    await useDietaStore.getState().gerar(PERFIL);

    const estado = useDietaStore.getState();
    expect(estado.plano).toEqual(PLANO);
    expect(estado.geradoEm).not.toBeNull();
    expect(estado.gerando).toBe(false);
    expect(estado.erro).toBeNull();
  });

  it('envia o perfil para /api/dieta', async () => {
    responder(200, { plano: PLANO });

    await useDietaStore.getState().gerar(PERFIL);

    const [url, opcoes] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/dieta');
    expect(JSON.parse(opcoes.body)).toEqual({ perfil: PERFIL });
  });

  it('mostra a mensagem do servidor quando dá erro e mantém o plano antigo', async () => {
    useDietaStore.setState({ plano: PLANO });
    responder(503, { erro: 'Servidor sem ANTHROPIC_API_KEY configurada.' });

    await useDietaStore.getState().gerar(PERFIL);

    const estado = useDietaStore.getState();
    expect(estado.erro).toBe('Servidor sem ANTHROPIC_API_KEY configurada.');
    expect(estado.plano).toEqual(PLANO);
  });

  it('não chama o servidor com perfil incompleto', async () => {
    responder(200, { plano: PLANO });

    await useDietaStore.getState().gerar({ ...PERFIL, objetivo: undefined });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(useDietaStore.getState().erro).toContain('Complete seu perfil');
  });

  it('recusa resposta em formato inesperado', async () => {
    responder(200, { plano: { resumo: 'faltando campos' } });

    await useDietaStore.getState().gerar(PERFIL);

    expect(useDietaStore.getState().plano).toBeNull();
    expect(useDietaStore.getState().erro).toContain('formato inesperado');
  });
});
