import { confirmar, ouvirConfirmacoes, type PedidoConfirmacao } from '../confirmar';

describe('confirmar', () => {
  it('sem diálogo na tela responde "não" (nunca apaga sem perguntar)', async () => {
    await expect(confirmar('apagar?', 'some tudo.', 'apagar')).resolves.toBe(false);
  });

  it('entrega a pergunta ao diálogo e devolve a resposta', async () => {
    let recebido: PedidoConfirmacao | undefined;
    const parar = ouvirConfirmacoes((pedido) => {
      recebido = pedido;
    });

    const resposta = confirmar('remover a foto?', 'o perfil volta à inicial.', 'remover');
    expect(recebido).toMatchObject({ titulo: 'remover a foto?', textoConfirmar: 'remover' });
    recebido?.responder(true);
    // Responder de novo não muda nada
    recebido?.responder(false);

    await expect(resposta).resolves.toBe(true);
    parar();
  });

  it('o último diálogo montado (folha por cima) é quem pergunta', async () => {
    const raiz = jest.fn();
    const folha = jest.fn((pedido: PedidoConfirmacao) => pedido.responder(false));
    const pararRaiz = ouvirConfirmacoes(raiz);
    const pararFolha = ouvirConfirmacoes(folha);

    await expect(confirmar('a?', 'b', 'c')).resolves.toBe(false);
    expect(folha).toHaveBeenCalledTimes(1);
    expect(raiz).not.toHaveBeenCalled();

    pararFolha();
    void confirmar('a?', 'b', 'c');
    expect(raiz).toHaveBeenCalledTimes(1);
    pararRaiz();
  });
});
