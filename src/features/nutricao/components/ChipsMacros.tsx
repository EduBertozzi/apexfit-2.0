import { StyleSheet, View } from 'react-native';

import { espaco, raio } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { Texto } from '@/shared/ui';

type Macros = { proteinaG: number; carboidratoG: number; gorduraG: number };

/**
 * Proteína, carboidrato e gordura como pílulas pastel com texto escuro.
 * Cada macro tem sempre a mesma cor no app inteiro.
 */
export function ChipsMacros({ macros }: { macros: Macros }) {
  const c = useCores();
  const { fundo } = useCategorias();

  const itens = [
    { rotulo: 'proteína', gramas: macros.proteinaG, cor: fundo.braco },
    { rotulo: 'carbo', gramas: macros.carboidratoG, cor: fundo.peito },
    { rotulo: 'gordura', gramas: macros.gorduraG, cor: fundo.perna },
  ];

  return (
    <View style={estilos.linha}>
      {itens.map((item) => (
        <View
          key={item.rotulo}
          accessible
          accessibilityLabel={`${item.rotulo === 'carbo' ? 'carboidrato' : item.rotulo}: ${item.gramas} gramas`}
          style={[estilos.chip, { backgroundColor: item.cor }]}
        >
          <Texto variante="legenda" style={{ color: c.textoSobreDestaque }}>
            {item.rotulo}
          </Texto>
          <Texto variante="rotulo" style={{ color: c.textoSobreDestaque }}>
            {item.gramas} g
          </Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: espaco.xs + 2,
    paddingHorizontal: espaco.md - 4,
    paddingVertical: espaco.xs + 2,
    borderRadius: raio.total,
  },
});
