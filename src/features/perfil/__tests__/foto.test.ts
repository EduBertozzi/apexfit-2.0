import { comFoto, extensaoDaImagem, inicialDoNome, manterFoto } from '../foto';
import type { Perfil } from '../types';

const PERFIL: Perfil = { nome: 'Lucas', idade: 20, alturaCm: 175, pesoKg: 70 };

describe('comFoto', () => {
  it('troca a foto', () => {
    expect(comFoto(PERFIL, 'file:///a.jpg').fotoUri).toBe('file:///a.jpg');
  });

  it('remover tira o campo de vez', () => {
    const semFoto = comFoto({ ...PERFIL, fotoUri: 'file:///a.jpg' }, undefined);

    expect(semFoto).toEqual(PERFIL);
    expect('fotoUri' in semFoto).toBe(false);
  });
});

describe('manterFoto', () => {
  it('salvar o formulário não apaga a foto', () => {
    const anterior = { ...PERFIL, fotoUri: 'file:///a.jpg' };

    expect(manterFoto(anterior, { ...PERFIL, pesoKg: 72 })).toEqual({
      ...PERFIL,
      pesoKg: 72,
      fotoUri: 'file:///a.jpg',
    });
  });

  it('sem perfil anterior ou sem foto, salva como veio', () => {
    expect(manterFoto(null, PERFIL)).toBe(PERFIL);
    expect(manterFoto(PERFIL, PERFIL)).toBe(PERFIL);
  });

  it('foto nova no perfil novo vence', () => {
    const novo = { ...PERFIL, fotoUri: 'file:///b.jpg' };

    expect(manterFoto({ ...PERFIL, fotoUri: 'file:///a.jpg' }, novo).fotoUri).toBe('file:///b.jpg');
  });
});

describe('inicialDoNome', () => {
  it.each([
    ['lucas silva', 'L'],
    ['  élida', 'É'],
    ['', '?'],
  ])('"%s" vira "%s"', (nome, letra) => {
    expect(inicialDoNome(nome)).toBe(letra);
  });
});

describe('extensaoDaImagem', () => {
  it.each([
    ['file:///cache/ImagePicker/abc.jpeg', 'jpeg'],
    ['file:///cache/x.PNG', 'png'],
    ['file:///cache/x.heic?v=1', 'heic'],
    ['content://media/external/images/123', 'jpg'],
  ])('%s → %s', (uri, extensao) => {
    expect(extensaoDaImagem(uri)).toBe(extensao);
  });
});
