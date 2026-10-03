import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GraficoPeso } from '@/features/peso/components/GraficoPeso';
import {
  ajustarPeso,
  formatarKg,
  pesoInicial,
  podeAjustarPeso,
  registrosRecentes,
  resumoPeso,
  rotuloDia,
  variacaoPorExtenso,
} from '@/features/peso/logica';
import { usePesoStore } from '@/features/peso/store';
import { usePerfilStore } from '@/features/perfil/store';
import { confirmar } from '@/shared/lib/confirmar';
import { chaveDoDia } from '@/shared/lib/data';
import { espaco, familia } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Contador, Tela, Texto } from '@/shared/ui';

export default function PesoTela() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const registros = usePesoStore((state) => state.registros);
  const registrar = usePesoStore((state) => state.registrar);
  const remover = usePesoStore((state) => state.remover);

  const [kg, setKg] = useState(() => pesoInicial(registros, perfil?.pesoKg ?? 70));
  const [salvo, setSalvo] = useState(false);

  if (!perfil) {
    return null;
  }

  const hoje = chaveDoDia(new Date());
  const resumo = resumoPeso(registros, hoje, perfil.pesoKg);

  function mudar(direcao: 1 | -1) {
    setKg(ajustarPeso(kg, direcao));
    setSalvo(false);
  }

  function salvar() {
    setSalvo(registrar(kg));
  }

  async function apagar(data: string) {
    const ok = await confirmar(
      'Remover registro',
      `Apagar o peso de ${rotuloDia(data, hoje).toLowerCase()}?`,
      'Remover',
    );

    if (ok) {
      remover(data);
    }
  }

  return (
    <Tela bordas={['bottom']}>
      <Cartao variante="heroi">
        <Texto variante="rotulo" style={{ color: c.textoHeroiSecundario }}>
          {resumo.temRegistros ? 'Peso atual' : 'Peso do perfil'}
        </Texto>
        <Texto variante="destaque" style={{ color: c.textoHeroi }}>
          {formatarKg(resumo.atualKg)}
        </Texto>
        <Texto variante="legenda" style={{ color: c.textoHeroiSecundario }}>
          {variacaoPorExtenso(resumo.variacao30, 30)}
        </Texto>
        <GraficoPeso registros={registros} />
      </Cartao>

      <Cartao titulo="Registrar">
        <Contador
          rotulo="peso"
          valorTexto={formatarKg(kg)}
          onMenos={() => mudar(-1)}
          onMais={() => mudar(1)}
          podeMenos={podeAjustarPeso(kg, -1)}
          podeMais={podeAjustarPeso(kg, 1)}
        />
        <Botao titulo="Salvar peso de hoje" onPress={salvar} />
        {salvo ? (
          <Texto variante="legenda" accessibilityLiveRegion="polite">
            Peso de hoje salvo. Suas metas de água e calorias já usam ele.
          </Texto>
        ) : resumo.registrouHoje ? (
          <Texto variante="legenda" secundario>
            Você já registrou hoje. Salvar de novo troca o valor.
          </Texto>
        ) : (
          <Texto variante="legenda" secundario>
            Pese de manhã, em jejum, para comparar dias parecidos.
          </Texto>
        )}
      </Cartao>

      {registros.length > 0 ? (
        <Cartao titulo="Últimos registros">
          {registrosRecentes(registros).map((registro) => (
            <View key={registro.data} style={estilos.linha}>
              <Texto secundario style={estilos.dia}>
                {rotuloDia(registro.data, hoje)}
              </Texto>
              <Texto style={estilos.valor}>{formatarKg(registro.kg)}</Texto>
              <View style={estilos.remover}>
                <Botao
                  titulo={`Remover peso de ${rotuloDia(registro.data, hoje)}`}
                  icone="trash-outline"
                  variante="texto"
                  onPress={() => apagar(registro.data)}
                />
              </View>
            </View>
          ))}
        </Cartao>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  dia: {
    flex: 1,
  },
  valor: {
    fontFamily: familia.corpoForte,
  },
  remover: {
    width: 48,
  },
});
