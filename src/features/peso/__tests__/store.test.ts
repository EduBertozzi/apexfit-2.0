import AsyncStorage from '@react-native-async-storage/async-storage';

import { usePerfilStore } from '@/features/perfil/store';
import type { Perfil } from '@/features/perfil/types';

import { usePesoStore } from '../store';

const PERFIL: Perfil = { nome: 'Eduardo', idade: 21, alturaCm: 188, pesoKg: 75 };
const HOJE = new Date(2026, 9, 3, 8, 0);
const ONTEM_A_NOITE = new Date(2026, 9, 2, 23, 30);
const FIM_DO_MES = new Date(2026, 8, 30, 21, 0);

beforeEach(async () => {
  usePesoStore.setState({ registros: [] });
  usePerfilStore.setState({ perfil: PERFIL });
  await AsyncStorage.clear();
});

describe('usePesoStore', () => {
  it('registra o peso do dia e grava no aparelho', async () => {
    expect(usePesoStore.getState().registrar(74.6, HOJE)).toBe(true);

    expect(usePesoStore.getState().registros).toEqual([{ data: '2026-10-03', kg: 74.6 }]);

    const salvo = JSON.parse((await AsyncStorage.getItem('apexfit/peso')) ?? '{}');

    expect(salvo.state.registros).toEqual([{ data: '2026-10-03', kg: 74.6 }]);
  });

  it('no mesmo dia, o último peso substitui o anterior', () => {
    const { registrar } = usePesoStore.getState();

    registrar(75, HOJE);
    registrar(74.8, new Date(2026, 9, 3, 20, 0));

    expect(usePesoStore.getState().registros).toEqual([{ data: '2026-10-03', kg: 74.8 }]);
  });

  it('separa os dias na virada do mês pelo horário local', () => {
    const { registrar } = usePesoStore.getState();

    registrar(76, FIM_DO_MES);
    registrar(75.5, ONTEM_A_NOITE);
    registrar(75, HOJE);

    expect(usePesoStore.getState().registros.map((r) => r.data)).toEqual([
      '2026-09-30',
      '2026-10-02',
      '2026-10-03',
    ]);
  });

  it('recusa peso fora dos limites sem mexer em nada', () => {
    expect(usePesoStore.getState().registrar(12, HOJE)).toBe(false);

    expect(usePesoStore.getState().registros).toEqual([]);
    expect(usePerfilStore.getState().perfil?.pesoKg).toBe(75);
  });

  it('atualiza o peso do perfil com o registro mais recente', () => {
    usePesoStore.getState().registrar(73.9, HOJE);

    expect(usePerfilStore.getState().perfil).toEqual({ ...PERFIL, pesoKg: 73.9 });
  });

  it('registrar um dia antigo não muda o perfil se há peso mais novo', () => {
    const { registrar } = usePesoStore.getState();

    registrar(74, HOJE);
    registrar(78, FIM_DO_MES);

    expect(usePerfilStore.getState().perfil?.pesoKg).toBe(74);
  });

  it('ao remover o mais recente, o perfil volta para o anterior', () => {
    const { registrar, remover } = usePesoStore.getState();

    registrar(76, FIM_DO_MES);
    registrar(74, HOJE);
    remover('2026-10-03');

    expect(usePesoStore.getState().registros).toEqual([{ data: '2026-09-30', kg: 76 }]);
    expect(usePerfilStore.getState().perfil?.pesoKg).toBe(76);
  });

  it('não cria perfil quando não existe', () => {
    usePerfilStore.setState({ perfil: null });
    usePesoStore.getState().registrar(74, HOJE);

    expect(usePerfilStore.getState().perfil).toBeNull();
    expect(usePesoStore.getState().registros).toHaveLength(1);
  });

  it('apaga tudo', () => {
    usePesoStore.getState().registrar(74, HOJE);
    usePesoStore.getState().apagarTudo();

    expect(usePesoStore.getState().registros).toEqual([]);
  });
});
