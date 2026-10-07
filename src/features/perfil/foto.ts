import type { Perfil } from './types';

/** Copia o perfil trocando a foto; `undefined` remove o campo (não guarda `fotoUri: undefined`). */
export function comFoto(perfil: Perfil, fotoUri: string | undefined): Perfil {
  const { fotoUri: _antiga, ...resto } = perfil;

  return fotoUri ? { ...resto, fotoUri } : resto;
}

/**
 * O formulário de perfil não conhece a foto. Ao salvar, a foto do perfil
 * anterior continua, a menos que o novo perfil já traga uma.
 */
export function manterFoto(anterior: Perfil | null, novo: Perfil): Perfil {
  if (novo.fotoUri || !anterior?.fotoUri) {
    return novo;
  }

  return { ...novo, fotoUri: anterior.fotoUri };
}

/** Letra do avatar quando não há foto: "eduardo" → "E". */
export function inicialDoNome(nome: string): string {
  const letra = nome.trim().charAt(0);

  return letra ? letra.toLocaleUpperCase('pt-BR') : '?';
}

/** Extensão do arquivo escolhido, para o nome da cópia ("jpg" se não der para saber). */
export function extensaoDaImagem(uri: string): string {
  const extensao = /\.([a-z0-9]{2,5})(?:[?#].*)?$/i.exec(uri)?.[1];

  return extensao ? extensao.toLowerCase() : 'jpg';
}
