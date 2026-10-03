import { useDietaStore } from '@/features/dieta/store';
import { useHidratacaoStore } from '@/features/hidratacao/store';
import { usePerfilStore } from '@/features/perfil/store';

import { apagarTodosOsDados } from '../apagarDados';
import { useAjustesStore } from '../store';

describe('apagarTodosOsDados', () => {
  it('limpa perfil, água, dieta e ajustes', () => {
    usePerfilStore
      .getState()
      .salvarPerfil({ nome: 'Eduardo', idade: 21, alturaCm: 188, pesoKg: 75 });
    useHidratacaoStore.getState().adicionar(250);
    useDietaStore.setState({ plano: null, geradoEm: '2026-10-03T10:00:00.000Z' });
    useAjustesStore.getState().definirTema('escuro');

    apagarTodosOsDados();

    expect(usePerfilStore.getState().perfil).toBeNull();
    expect(useHidratacaoStore.getState().registros).toEqual({});
    expect(useDietaStore.getState().geradoEm).toBeNull();
    expect(useAjustesStore.getState().tema).toBe('sistema');
  });
});
