import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { extensaoDaImagem } from './foto';

/**
 * ÚNICO arquivo da feature que toca na galeria e no sistema de arquivos.
 * A foto escolhida é copiada para a pasta de documentos do app: a original
 * fica no cache do seletor, que o sistema pode limpar a qualquer hora.
 */

const NOME_PASTA = 'perfil';

function pastaDasFotos() {
  return new Directory(Paths.document, NOME_PASTA);
}

/**
 * Abre a galeria com corte quadrado e devolve o endereço da cópia salva.
 * `null` se a pessoa cancelar.
 */
export async function escolherFotoDaGaleria(): Promise<string | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  const origem = resultado.canceled ? undefined : resultado.assets[0]?.uri;

  if (!origem) {
    return null;
  }

  // No navegador não há pasta de documentos: guarda o endereço que o seletor devolveu
  if (Platform.OS === 'web') {
    return origem;
  }

  const pasta = pastaDasFotos();
  pasta.create({ intermediates: true, idempotent: true });

  // Nome novo a cada troca: o cache de imagens não mostra a foto antiga no lugar
  const destino = new File(pasta, `foto-${Date.now()}.${extensaoDaImagem(origem)}`);
  await new File(origem).copy(destino);

  return destino.uri;
}

/** Apaga o arquivo de uma foto antiga. Falhar aqui não pode travar a tela. */
export function apagarArquivoDaFoto(uri: string | undefined) {
  if (!uri || Platform.OS === 'web') {
    return;
  }

  try {
    const arquivo = new File(uri);

    if (arquivo.exists) {
      arquivo.delete();
    }
  } catch {
    // Arquivo já não existe ou está fora da pasta do app: nada a fazer
  }
}

/** "Apagar meus dados": remove a pasta inteira de fotos do perfil. */
export function apagarTodasAsFotos() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const pasta = pastaDasFotos();

    if (pasta.exists) {
      pasta.delete();
    }
  } catch {
    // Sem pasta ou sem módulo nativo (testes): nada a apagar
  }
}
