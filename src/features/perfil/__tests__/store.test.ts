import AsyncStorage from '@react-native-async-storage/async-storage';

import { usePerfilStore } from '../store';
import type { Perfil } from '../types';

const PERFIL: Perfil = { nome: 'Luiz', idade: 17, alturaCm: 175, pesoKg: 70 };

beforeEach(async () => {
  usePerfilStore.setState({ perfil: null });
  await AsyncStorage.clear();
});

describe('usePerfilStore', () => {
  it('começa sem perfil', () => {
    expect(usePerfilStore.getState().perfil).toBeNull();
  });

  it('salva o perfil e grava no aparelho', async () => {
    usePerfilStore.getState().salvarPerfil(PERFIL);

    expect(usePerfilStore.getState().perfil).toEqual(PERFIL);

    const salvo = JSON.parse((await AsyncStorage.getItem('apexfit/perfil')) ?? '{}');

    expect(salvo.state.perfil).toEqual(PERFIL);
  });

  it('apaga o perfil', () => {
    usePerfilStore.getState().salvarPerfil(PERFIL);
    usePerfilStore.getState().apagarPerfil();

    expect(usePerfilStore.getState().perfil).toBeNull();
  });
});
