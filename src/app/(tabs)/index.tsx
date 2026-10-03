import { StyleSheet, View } from 'react-native';

import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { CartaoDieta } from '@/features/dieta/components/CartaoDieta';
import { CartaoHidratacao } from '@/features/hidratacao/components/CartaoHidratacao';
import { CartaoSemana } from '@/features/hidratacao/components/CartaoSemana';
import { CartaoMetas } from '@/features/nutricao/components/CartaoMetas';
import { calcularMetaAguaMl, primeiroNome } from '@/features/perfil/calculos';
import { CartaoImc } from '@/features/perfil/components/CartaoImc';
import { usePerfilStore } from '@/features/perfil/store';
import { dataPorExtenso } from '@/shared/lib/data';
import { espaco } from '@/shared/theme/tokens';
import { Cartao, Marcado, Tela, Texto } from '@/shared/ui';

export default function Hoje() {
  const perfil = usePerfilStore((state) => state.perfil);
  const metaManualMl = useAjustesStore((state) => state.metaAguaManualMl);

  if (!perfil) {
    return null;
  }

  const metaAguaMl = metaAguaEfetiva(calcularMetaAguaMl(perfil.pesoKg), metaManualMl);

  return (
    <Tela>
      <View>
        <Texto variante="rotulo" secundario>
          {dataPorExtenso(new Date())}
        </Texto>
        <Texto variante="gigante" accessibilityRole="header">
          Bora,{'\n'}
          <Marcado>{primeiroNome(perfil.nome)}.</Marcado>
        </Texto>
      </View>

      <CartaoHidratacao metaMl={metaAguaMl} />

      <CartaoMetas perfil={perfil} />

      <CartaoDieta perfil={perfil} />

      <View style={estilos.linha}>
        <CartaoImc perfil={perfil} style={estilos.metade} />

        <Cartao titulo="Treino de hoje" variante="tracejado" style={estilos.metade}>
          <Texto variante="subtitulo">Em breve</Texto>
          <Texto variante="legenda" secundario>
            Monte seus treinos e marque o que já fez.
          </Texto>
        </Cartao>
      </View>

      <CartaoSemana metaMl={metaAguaMl} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  metade: {
    flex: 1,
  },
});
