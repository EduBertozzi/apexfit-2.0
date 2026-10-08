import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { espaco, familia, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';
import { CartaoToque, ESPACO_DA_SETA } from '@/shared/ui/CartaoToque';

import { usePlanoDaSemana } from '../store';

/** Atalho da tela de treinos para "minha semana", com as siglas dos 7 dias. */
export function CartaoMinhaSemana() {
  const c = useCores();
  const { plano, resumo } = usePlanoDaSemana();

  return (
    <CartaoToque
      rotuloAcessivel={`minha semana, ${resumo}`}
      dica="Abre o plano da semana para escolher o treino de cada dia"
      onPress={() => router.push('/treino/semana')}
      testID="cartao-minha-semana"
    >
      <View style={estilos.titulo}>
        <Texto variante="subtitulo" style={estilos.nome}>
          minha semana
        </Texto>
        <Texto variante="legenda" secundario>
          {resumo}
        </Texto>
      </View>
      <View style={estilos.dias}>
        {plano.map((entrada) => {
          const comTreino = entrada.tipo === 'treino';

          return (
            <View
              key={entrada.dia}
              style={[
                estilos.dia,
                { backgroundColor: comTreino ? c.destaque : c.superficieSecundaria },
              ]}
            >
              <Texto
                variante="legenda"
                maxFontSizeMultiplier={1.2}
                style={[
                  estilos.sigla,
                  { color: comTreino ? c.textoSobreDestaque : c.textoSecundario },
                ]}
              >
                {entrada.sigla}
              </Texto>
            </View>
          );
        })}
      </View>
    </CartaoToque>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    paddingRight: ESPACO_DA_SETA,
    gap: 2,
  },
  nome: {
    fontFamily: familia.displayLeve,
  },
  dias: {
    flexDirection: 'row',
    gap: espaco.xs,
    marginTop: espaco.sm,
  },
  dia: {
    flex: 1,
    minHeight: 32,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigla: {
    fontFamily: familia.rotulo,
  },
});
