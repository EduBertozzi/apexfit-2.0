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

  it('troca e remove a foto, e salvar o formulário mantém a foto', () => {
    usePerfilStore.getState().salvarPerfil(PERFIL);
    usePerfilStore.getState().definirFoto('file:///docs/perfil/foto-1.jpg');

    expect(usePerfilStore.getState().perfil?.fotoUri).toBe('file:///docs/perfil/foto-1.jpg');

    // O formulário de edição não manda a foto
    usePerfilStore.getState().salvarPerfil({ ...PERFIL, pesoKg: 72 });

    expect(usePerfilStore.getState().perfil).toEqual({
      ...PERFIL,
      pesoKg: 72,
      fotoUri: 'file:///docs/perfil/foto-1.jpg',
    });

    usePerfilStore.getState().definirFoto(undefined);

    expect(usePerfilStore.getState().perfil).toEqual({ ...PERFIL, pesoKg: 72 });
  });

  it('sem perfil, definir foto não cria perfil', () => {
    usePerfilStore.getState().definirFoto('file:///x.jpg');

    expect(usePerfilStore.getState().perfil).toBeNull();
  });

  it('apaga o perfil', () => {
    usePerfilStore.getState().salvarPerfil(PERFIL);
    usePerfilStore.getState().apagarPerfil();

    expect(usePerfilStore.getState().perfil).toBeNull();
  });
});
