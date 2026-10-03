import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { cancelarLembretes } from '@/features/lembretes/notificacoes';
import { useLembretesStore } from '@/features/lembretes/store';
import { usePerfilStore } from '@/features/perfil/store';

import { apagarTodosOsDados } from '../apagarDados';
import { useAjustesStore } from '../store';

jest.mock('@/features/lembretes/notificacoes', () => ({
  notificacoesSuportadas: jest.fn(() => true),
  pedirPermissao: jest.fn(async () => true),
  agendarLembretes: jest.fn(async () => {}),
  cancelarLembretes: jest.fn(async () => {}),
  configurarExibicaoComAppAberto: jest.fn(),
}));

describe('apagarTodosOsDados', () => {
  it('limpa perfil, água, dieta, ajustes e lembretes', async () => {
    usePerfilStore
      .getState()
      .salvarPerfil({ nome: 'Eduardo', idade: 21, alturaCm: 188, pesoKg: 75 });
    useHidratacaoStore.getState().adicionar(250);
    useDietaStore.setState({ plano: null, geradoEm: '2026-10-03T10:00:00.000Z' });
    useAjustesStore.getState().definirTema('escuro');
    await useLembretesStore.getState().ligar();
    jest.mocked(cancelarLembretes).mockClear();

    apagarTodosOsDados();

    expect(usePerfilStore.getState().perfil).toBeNull();
    expect(useHidratacaoStore.getState().registros).toEqual({});
    expect(useDietaStore.getState().geradoEm).toBeNull();
    expect(useAjustesStore.getState().tema).toBe('sistema');
    expect(useLembretesStore.getState().ativo).toBe(false);
    await new Promise((resolver) => setTimeout(resolver, 0));
    expect(cancelarLembretes).toHaveBeenCalled();
  });
});
