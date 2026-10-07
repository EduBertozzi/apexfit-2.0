import { router } from 'expo-router';

import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

/** Central de IA (botão do cérebro): dieta, treinos montados por IA e conversa com o coach. */
export default function Ia() {
  return (
    <Tela>
      <Texto variante="titulo" accessibilityRole="header">
        sua IA
      </Texto>

      <Cartao titulo="dieta">
        <Texto secundario>Plano de refeições feito com as suas metas.</Texto>
        <Botao titulo="ver dieta" onPress={() => router.push('/dieta')} />
      </Cartao>

      <Cartao titulo="treinos">
        <Texto secundario>Monte seus treinos ou peça para a IA montar.</Texto>
        <Botao titulo="ver treinos" onPress={() => router.push('/treinos')} />
      </Cartao>

      <Cartao titulo="coach">
        <Texto secundario>Converse sobre treino, dieta e rotina.</Texto>
        <Botao titulo="conversar" onPress={() => router.push('/coach')} />
      </Cartao>
    </Tela>
  );
}
