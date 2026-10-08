/**
 * O que aconteceu ao tocar em "compartilhar" (ver `compartilhar.ts`).
 * - compartilhado: abriu o menu do sistema (ou a pessoa cancelou nele)
 * - baixado: navegador sem Web Share com arquivo; a imagem foi baixada
 * - indisponivel: o aparelho não tem como compartilhar
 * - erro: a captura da imagem falhou
 */
export type ResultadoCompartilhar = 'compartilhado' | 'baixado' | 'indisponivel' | 'erro';

/** Aviso para mostrar na tela depois de compartilhar. `null` quando não precisa dizer nada. */
export function mensagemDoCompartilhar(resultado: ResultadoCompartilhar): string | null {
  switch (resultado) {
    case 'baixado':
      return 'imagem baixada. agora é só postar nos stories.';
    case 'indisponivel':
      return 'não dá para compartilhar neste aparelho.';
    case 'erro':
      return 'não deu para gerar a imagem. tente de novo.';
    default:
      return null;
  }
}
