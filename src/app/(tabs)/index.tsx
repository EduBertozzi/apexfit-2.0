import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { CartaoAguaInicio } from '@/features/hidratacao/components/CartaoAguaInicio';
import {
  CartaoCaloriasInicio,
  CartaoDietaInicio,
} from '@/features/nutricao/components/CartoesInicio';
import { calcularMetaAguaMl, primeiroNome } from '@/features/perfil/calculos';
import { Avatar } from '@/features/perfil/components/Avatar';
import { usePerfilStore } from '@/features/perfil/store';
import { CabecalhoTreinoHoje } from '@/features/treinos/components/CabecalhoTreinoHoje';
import { FaixaSemana } from '@/features/treinos/components/FaixaSemana';
import { GradeTreinoHoje } from '@/features/treinos/components/GradeTreinoHoje';
import { legendaTreinoDoDia } from '@/features/treinos/logica';
import { useSemanaDeTreinos, useTreinoDoDia } from '@/features/treinos/store';
import { espaco, familia } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Tela } from '@/shared/ui';

export default function Inicio() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const metaManualMl = useAjustesStore((state) => state.metaAguaManualMl);
  const { situacao } = useTreinoDoDia();
  const semana = useSemanaDeTreinos();

  if (!perfil) {
    return null;
  }

  const nome = primeiroNome(perfil.nome);
  const metaAguaMl = metaAguaEfetiva(calcularMetaAguaMl(perfil.pesoKg), metaManualMl);

  return (
    <Tela>
      <View style={estilos.cabecalho}>
        <Pressable
          onPress={() => router.push('/perfil')}
          accessibilityRole="button"
          accessibilityLabel="abrir seu perfil"
          hitSlop={8}
          style={({ pressed }) => pressed && { opacity: 0.75 }}
        >
          <Avatar nome={perfil.nome} fotoUri={perfil.fotoUri} tamanho={60} />
        </Pressable>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          style={[estilos.saudacao, { color: c.texto }]}
        >
          bora,{'\n'}
          <Text style={estilos.nome}>{nome}!</Text>
        </Text>
      </View>

      <FaixaSemana dias={semana.dias} resumo={semana.resumo} />

      <CabecalhoTreinoHoje
        nomeDoDia={semana.nomeDeHoje}
        legenda={legendaTreinoDoDia(situacao)}
        sequencia={semana.sequencia}
      />

      <GradeTreinoHoje
        agua={<CartaoAguaInicio metaMl={metaAguaMl} />}
        calorias={<CartaoCaloriasInicio perfil={perfil} />}
        dieta={<CartaoDietaInicio />}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    marginTop: espaco.sm,
  },
  saudacao: {
    flexShrink: 1,
    fontFamily: familia.corpo,
    fontSize: 24,
    lineHeight: 30,
  },
  nome: {
    fontFamily: familia.display,
    fontSize: 32,
  },
});
