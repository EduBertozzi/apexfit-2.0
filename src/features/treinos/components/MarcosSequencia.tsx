import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { espaco, familia, fonte, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Cartao, Texto } from '@/shared/ui';

import { textoDoProximoMarco, type Marco, type ProximoMarco } from '../sequencia';

type Props = {
  lista: readonly Marco[];
  proximo: ProximoMarco | null;
};

const SELO = 48;

/** Selos de 7, 30, 100, 250 e 365 dias e a barra até o próximo. */
export function MarcosSequencia({ lista, proximo }: Props) {
  const c = useCores();
  const cat = useCategorias();

  return (
    <Cartao titulo="marcos">
      <View style={estilos.linha}>
        {lista.map((marco) => (
          <View
            key={marco.dias}
            accessible
            accessibilityLabel={`${marco.dias} dias, ${marco.alcancado ? 'conquistado' : 'ainda não'}`}
            style={estilos.marco}
          >
            <View
              style={[
                estilos.selo,
                { backgroundColor: marco.alcancado ? c.destaque : c.superficieSecundaria },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={[
                  estilos.numero,
                  { color: marco.alcancado ? c.textoSobreDestaque : c.textoSecundario },
                ]}
              >
                {marco.dias}
              </Text>
              {marco.alcancado ? (
                <View style={[estilos.check, { backgroundColor: c.superficie }]}>
                  <Ionicons name="checkmark-circle" size={22} color={c.texto} />
                </View>
              ) : null}
            </View>
            <Texto variante="legenda" secundario>
              dias
            </Texto>
          </View>
        ))}
      </View>

      {proximo ? (
        <View style={estilos.proximo}>
          <Texto variante="rotulo">{textoDoProximoMarco(proximo)}</Texto>
          <BarraProgresso
            valor={proximo.fracao}
            cor={cat.fundo.cardio}
            rotuloAcessivel={textoDoProximoMarco(proximo)}
            animado
          />
        </View>
      ) : (
        <Texto variante="rotulo">todos os marcos conquistados</Texto>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: espaco.sm,
  },
  marco: {
    alignItems: 'center',
    gap: espaco.xs,
  },
  selo: {
    width: SELO,
    height: SELO,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontFamily: familia.display,
    fontSize: fonte.cabecalho,
  },
  check: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderRadius: raio.total,
  },
  proximo: {
    gap: espaco.sm,
    marginTop: espaco.sm,
  },
});
