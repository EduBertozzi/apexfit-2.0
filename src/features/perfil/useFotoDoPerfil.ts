import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { confirmar } from '@/shared/lib/confirmar';

import { apagarArquivoDaFoto, escolherFotoDaGaleria } from './arquivoFoto';
import { usePerfilStore } from './store';

/** Trocar e remover a foto do perfil, com o arquivo antigo apagado do aparelho. */
export function useFotoDoPerfil() {
  const fotoUri = usePerfilStore((state) => state.perfil?.fotoUri);
  const definirFoto = usePerfilStore((state) => state.definirFoto);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocar() {
    setErro(null);
    setCarregando(true);

    try {
      const nova = await escolherFotoDaGaleria();

      if (nova) {
        const antiga = usePerfilStore.getState().perfil?.fotoUri;
        definirFoto(nova);
        apagarArquivoDaFoto(antiga);
        AccessibilityInfo.announceForAccessibility('Foto do perfil trocada');
      }
    } catch {
      setErro('não deu para salvar a foto. tente outra imagem.');
    } finally {
      setCarregando(false);
    }
  }

  async function remover() {
    const confirmado = await confirmar(
      'remover a foto?',
      'o perfil volta a mostrar a inicial do seu nome.',
      'remover',
    );

    if (!confirmado) {
      return;
    }

    const antiga = usePerfilStore.getState().perfil?.fotoUri;
    definirFoto(undefined);
    apagarArquivoDaFoto(antiga);
  }

  return { fotoUri, carregando, erro, trocar, remover };
}
