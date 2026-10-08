import { ajustarMetaManual, metaAguaEfetiva, migrarAjustes, resolverEsquema } from '../logica';
import { useAjustesStore } from '../store';

describe('resolverEsquema', () => {
  it('segue o celular no modo automático', () => {
    expect(resolverEsquema('sistema', 'dark')).toBe('escuro');
    expect(resolverEsquema('sistema', 'light')).toBe('claro');
    expect(resolverEsquema('sistema', null)).toBe('claro');
  });

  it('a escolha do usuário vence o celular', () => {
    expect(resolverEsquema('claro', 'dark')).toBe('claro');
    expect(resolverEsquema('escuro', 'light')).toBe('escuro');
  });
});

describe('metaAguaEfetiva', () => {
  it('usa a automática quando não há meta manual', () => {
    expect(metaAguaEfetiva(2650, null)).toBe(2650);
  });

  it('usa a manual quando existe', () => {
    expect(metaAguaEfetiva(2650, 3000)).toBe(3000);
  });
});

describe('ajustarMetaManual', () => {
  it('soma e subtrai de 250 em 250', () => {
    expect(ajustarMetaManual(3000, 1)).toBe(3250);
    expect(ajustarMetaManual(3000, -1)).toBe(2750);
  });

  it('de um valor quebrado, vai para o múltiplo de 250 mais próximo na direção', () => {
    expect(ajustarMetaManual(2650, 1)).toBe(2750);
    expect(ajustarMetaManual(2650, -1)).toBe(2500);
  });

  it('não passa dos limites', () => {
    expect(ajustarMetaManual(1000, -1)).toBe(1000);
    expect(ajustarMetaManual(6000, 1)).toBe(6000);
  });
});

describe('useAjustesStore', () => {
  it('começa no padrão e restaura depois de mudar', () => {
    const { definirTema, definirVibracao, definirMetaAguaManual, restaurarPadrao } =
      useAjustesStore.getState();

    definirTema('escuro');
    definirVibracao(false);
    definirMetaAguaManual(3000);
    expect(useAjustesStore.getState()).toMatchObject({
      tema: 'escuro',
      vibracao: false,
      metaAguaManualMl: 3000,
    });

    restaurarPadrao();
    expect(useAjustesStore.getState()).toMatchObject({
      tema: 'sistema',
      vibracao: true,
      metaAguaManualMl: null,
    });
  });
});

describe('migrarAjustes', () => {
  it('quem estava no escuro antigo (o padrão salvo) passa a seguir o celular', () => {
    expect(migrarAjustes({ tema: 'escuro', vibracao: false }, 1)).toEqual({
      tema: 'sistema',
      vibracao: false,
    });
  });

  it('mantém quem escolheu claro ou automático', () => {
    expect(migrarAjustes({ tema: 'claro' }, 1)).toEqual({ tema: 'claro' });
    expect(migrarAjustes({ tema: 'sistema' }, 0)).toEqual({ tema: 'sistema' });
  });

  it('não mexe em quem já está na versão nova', () => {
    expect(migrarAjustes({ tema: 'escuro' }, 2)).toEqual({ tema: 'escuro' });
  });
});
