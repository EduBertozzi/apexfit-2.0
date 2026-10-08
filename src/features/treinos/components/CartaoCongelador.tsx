import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { espaco, raio, semana } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Texto } from '@/shared/ui';

import { EXPLICACAO_CONGELADOR, EXPLICACAO_DESCANSO, MAXIMO_CONGELADORES } from '../regraSequencia';

type Props = {
  congeladores: number;
  /** "1 congelador guardado" */
  texto: string;
  /** "faltam 3 dias de sequência para ganhar outro" */
  proximo: string;
};

/** Congeladores guardados (flocos cheios e vazios) e como a regra funciona. */
export function CartaoCongelador({ congeladores, texto, proximo }: Props) {
  const c = useCores();

  return (
    <Cartao titulo="congelador">
      <View style={estilos.linha} accessible accessibilityLabel={`${texto}. ${proximo}`}>
        <View style={estilos.flocos}>
          {Array.from({ length: MAXIMO_CONGELADORES }, (_, indice) => {
            const cheio = indice < congeladores;

            return (
              <View
                key={indice}
                style={[
                  estilos.floco,
                  { backgroundColor: cheio ? c.congelado : c.superficieSecundaria },
                ]}
              >
                <Ionicons
                  name={cheio ? 'snow' : 'snow-outline'}
                  size={24}
                  color={cheio ? semana.texto : c.textoSecundario}
                />
              </View>
            );
          })}
        </View>
        <View style={estilos.textos}>
          <Texto variante="subtitulo">{texto}</Texto>
          <Texto variante="legenda" secundario>
            {proximo}
          </Texto>
        </View>
      </View>
      <Texto variante="legenda" secundario>
        {EXPLICACAO_CONGELADOR}
      </Texto>
      <Texto variante="legenda" secundario>
        {EXPLICACAO_DESCANSO}
      </Texto>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
  },
  flocos: {
    flexDirection: 'row',
    gap: espaco.sm,
  },
  floco: {
    width: 48,
    height: 48,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
});
