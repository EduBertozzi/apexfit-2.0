import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { OpcoesCompartilhar } from './compartilhar';
import type { ResultadoCompartilhar } from './resultadoCompartilhar';

type Html2Canvas = typeof import('html2canvas').default;

/**
 * O html2canvas fica num pedaço separado do bundle, carregado sob demanda.
 * `prepararCaptura` aquece o módulo quando a tela abre, para o toque em
 * "compartilhar" não esperar o download (o Safari só deixa compartilhar logo
 * depois do toque). Mesma abordagem do Hertz.
 */
let carregando: Promise<Html2Canvas> | null = null;

function carregarHtml2canvas(): Promise<Html2Canvas> {
  if (!carregando) {
    carregando = import('html2canvas')
      .then((modulo) => modulo.default)
      .catch((erro) => {
        carregando = null;
        throw erro;
      });
  }

  return carregando;
}

export function prepararCaptura() {
  carregarHtml2canvas().catch(() => {});
}

function baixar(url: string, arquivo: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = arquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * No navegador a ref já é o elemento da página: o html2canvas desenha a View num canvas.
 * Compartilha pela Web Share API com o arquivo PNG (Safari no iPhone, Chrome no Android);
 * sem ela, baixa a imagem.
 */
export async function compartilharView(
  ref: RefObject<View | null>,
  { arquivo = 'apexfit.png', titulo = 'Apex', largura }: OpcoesCompartilhar = {},
): Promise<ResultadoCompartilhar> {
  const elemento = ref.current as unknown as HTMLElement | null;

  if (!elemento) {
    return 'erro';
  }

  let dataUrl: string;

  try {
    const html2canvas = await carregarHtml2canvas();
    const canvas = await html2canvas(elemento, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      // Mesma resolução pedida no celular (ex: 1080 de largura para stories)
      scale: largura ? largura / elemento.offsetWidth : 2,
      width: elemento.offsetWidth,
      height: elemento.offsetHeight,
    });
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    return 'erro';
  }

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], arquivo, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (dados: ShareData) => boolean };

    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: titulo });

      return 'compartilhado';
    }
  } catch (erro) {
    // Cancelar o menu não é erro
    if ((erro as Error)?.name === 'AbortError') {
      return 'compartilhado';
    }
  }

  baixar(dataUrl, arquivo);

  return 'baixado';
}
