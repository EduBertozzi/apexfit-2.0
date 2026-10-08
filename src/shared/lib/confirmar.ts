/**
 * Pergunta de confirmação do app ("apagar?", "remover?"), mostrada pelo
 * `DialogoConfirmacao` (shared/ui) no estilo do app, igual no celular e no web.
 * Substitui o Alert nativo, que no Android deixa os botões em CAIXA ALTA.
 *
 * Quem mostra é o último `DialogoConfirmacao` montado: o do layout raiz, ou o de
 * uma folha/modal aberta por cima (no iPhone, a folha cobre o que é da raiz).
 */

export type PedidoConfirmacao = {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  responder: (confirmado: boolean) => void;
};

type Ouvinte = (pedido: PedidoConfirmacao) => void;

const ouvintes: Ouvinte[] = [];

export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar: string,
): Promise<boolean> {
  const ouvinte = ouvintes.at(-1);

  // Sem diálogo na tela não há como perguntar: não faz a ação destrutiva
  if (!ouvinte) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let respondido = false;

    ouvinte({
      titulo,
      mensagem,
      textoConfirmar,
      responder: (confirmado) => {
        if (!respondido) {
          respondido = true;
          resolve(confirmado);
        }
      },
    });
  });
}

/** Registra quem mostra as perguntas. Devolve a função que cancela o registro. */
export function ouvirConfirmacoes(ouvinte: Ouvinte): () => void {
  ouvintes.push(ouvinte);

  return () => {
    const indice = ouvintes.lastIndexOf(ouvinte);

    if (indice !== -1) {
      ouvintes.splice(indice, 1);
    }
  };
}
