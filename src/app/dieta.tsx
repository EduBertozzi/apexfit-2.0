import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PlanoDietaDetalhe } from '@/features/dieta/components/PlanoDietaDetalhe';
import { SeletorDias } from '@/features/dieta/components/SeletorDias';
import { planoDesatualizado } from '@/features/dieta/logica';
import {
  diasDoSeletor,
  legendaDoDia,
  planoDoDia,
  temPlanoProprio,
  tituloPlanoDoDia,
  TITULO_VOLTAR_AO_PADRAO,
  treinoNoDia,
} from '@/features/dieta/semana';
import { useDietaStore } from '@/features/dieta/store';
import { calcularNecessidades } from '@/features/nutricao/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { useTreinosStore } from '@/features/treinos/store';
import { espaco, raio } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function Dieta() {
  const c = useCores();
  const perfil = usePerfilStore((state) => state.perfil);
  const padrao = useDietaStore((state) => state.plano);
  const porDia = useDietaStore((state) => state.porDia);
  const origem = useDietaStore((state) => state.origem);
  const gerandoAlgo = useDietaStore((state) => state.gerando);
  const diaGerando = useDietaStore((state) => state.diaGerando);
  const erro = useDietaStore((state) => state.erro);
  const gerar = useDietaStore((state) => state.gerar);
  const usarPlanoDaSemana = useDietaStore((state) => state.usarPlanoDaSemana);
  const treinos = useTreinosStore((state) => state.treinos);
  // Abre no dia de hoje (0 = domingo)
  const [hoje] = useState(() => new Date().getDay());
  const [dia, setDia] = useState(hoje);

  if (!perfil) {
    return null;
  }

  const semana = { plano: padrao, porDia };
  const plano = planoDoDia(semana, dia);
  const proprio = temPlanoProprio(semana, dia);
  // Carregando aqui: a semana toda ou exatamente este dia
  const gerando = gerandoAlgo && (diaGerando === null || diaGerando === dia);

  return (
    <Tela bordas={['bottom']}>
      {padrao ? (
        <View style={estilos.semana}>
          <SeletorDias dias={diasDoSeletor(semana, hoje)} selecionado={dia} onSelecionar={setDia} />
          <Texto variante="legenda" secundario style={estilos.legenda}>
            {legendaDoDia(semana, dia, hoje)}
          </Texto>
        </View>
      ) : null}

      {gerando && (!plano || diaGerando === dia) ? (
        <Cartao>
          <View style={estilos.carregando}>
            <ActivityIndicator size="large" color={c.texto} />
            <Texto variante="subtitulo">montando seu plano</Texto>
            <Texto secundario style={estilos.centro}>
              a IA está montando as refeições com as suas metas. pode levar até 1 minuto.
            </Texto>
          </View>
        </Cartao>
      ) : null}

      {erro ? (
        <Texto style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}

      {plano &&
      planoDesatualizado(plano.caloriasDia, calcularNecessidades(perfil)?.metaCalorias ?? null) ? (
        <Cartao titulo="plano desatualizado" variante="tracejado">
          <Texto>
            seu perfil mudou depois que este plano foi feito. gere um novo para bater com a sua meta
            atual.
          </Texto>
        </Cartao>
      ) : null}

      {plano && origem === 'demo' ? (
        <View style={estilos.demo}>
          <View style={[estilos.selo, { backgroundColor: c.superficieSecundaria }]}>
            <Texto variante="legenda">modo demonstração</Texto>
          </View>
          <Texto variante="legenda" secundario>
            sem IA disponível, o próprio app montou este plano com as suas metas.
          </Texto>
        </View>
      ) : null}

      {plano ? <PlanoDietaDetalhe plano={plano} /> : null}

      {plano ? (
        <Botao
          titulo="mudar algo com o coach"
          variante="destaque"
          onPress={() => router.push('/coach')}
        />
      ) : null}

      {plano ? (
        <Botao
          titulo={tituloPlanoDoDia(dia)}
          variante="secundario"
          onPress={() => gerar(perfil, { dia, treinoDoDia: treinoNoDia(treinos, dia) })}
          carregando={gerandoAlgo && diaGerando === dia}
          desabilitado={gerandoAlgo && diaGerando !== dia}
        />
      ) : null}

      {proprio ? (
        <Botao
          titulo={TITULO_VOLTAR_AO_PADRAO}
          variante="secundario"
          onPress={() => usarPlanoDaSemana(dia)}
          desabilitado={gerandoAlgo}
        />
      ) : null}

      {!gerando || plano ? (
        <Botao
          titulo={plano ? 'novo plano da semana' : 'tentar de novo'}
          variante={plano ? 'secundario' : 'primario'}
          onPress={() => gerar(perfil)}
          carregando={gerandoAlgo && diaGerando === null}
          desabilitado={gerandoAlgo && diaGerando !== null}
        />
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  semana: {
    gap: espaco.xs,
  },
  legenda: {
    paddingHorizontal: espaco.xs,
  },
  carregando: {
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.lg,
  },
  centro: {
    textAlign: 'center',
  },
  demo: {
    gap: espaco.xs,
    paddingHorizontal: espaco.xs,
  },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: espaco.xs,
    borderRadius: raio.total,
  },
});
