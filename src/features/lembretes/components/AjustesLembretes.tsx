import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';

import { Contador, Interruptor, Opcoes, Secao, Texto } from '@/shared/ui';

import {
  ajustarFim,
  ajustarInicio,
  INTERVALOS_MIN,
  NOME_INTERVALO,
  resumoLembretes,
} from '../logica';
import { notificacoesSuportadas } from '../notificacoes';
import { useLembretesStore } from '../store';

const OPCOES_INTERVALO = INTERVALOS_MIN.map((minutos) => ({
  valor: String(minutos),
  rotulo: NOME_INTERVALO[minutos],
}));

const AVISO_NEGADO =
  'o celular não deixou o Apex mandar notificações. para receber os lembretes, libere as notificações do app nos ajustes do celular e tente de novo.';

export function AjustesLembretes() {
  const ativo = useLembretesStore((state) => state.ativo);
  const inicio = useLembretesStore((state) => state.inicio);
  const fim = useLembretesStore((state) => state.fim);
  const intervaloMin = useLembretesStore((state) => state.intervaloMin);
  const ligar = useLembretesStore((state) => state.ligar);
  const desligar = useLembretesStore((state) => state.desligar);
  const definirIntervalo = useLembretesStore((state) => state.definirIntervalo);
  const mudarInicio = useLembretesStore((state) => state.mudarInicio);
  const mudarFim = useLembretesStore((state) => state.mudarFim);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!notificacoesSuportadas()) {
    return (
      <Secao titulo="lembretes de água">
        <Texto variante="legenda" secundario>
          lembretes só funcionam no app do celular (Android ou iPhone). no navegador não dá para
          agendar notificações.
        </Texto>
      </Secao>
    );
  }

  const config = { inicio, fim, intervaloMin };

  async function alternar(ligado: boolean) {
    if (!ligado) {
      setAviso(null);
      await desligar();
      return;
    }

    const resultado = await ligar();

    setAviso(
      resultado === 'negado'
        ? AVISO_NEGADO
        : resultado === 'indisponivel'
          ? 'não deu para ligar os lembretes neste aparelho.'
          : null,
    );
  }

  return (
    <Secao titulo="lembretes de água">
      <Interruptor
        rotulo="lembrar de beber água"
        descricao="uma notificação no intervalo escolhido, mesmo com o app fechado."
        valor={ativo}
        onMudar={alternar}
        testID="ajuste-lembretes"
      />

      {aviso ? (
        <Texto variante="legenda" accessibilityLiveRegion="polite">
          {aviso}
        </Texto>
      ) : null}

      {ativo ? (
        <Opcoes
          rotulo="intervalo"
          opcoes={OPCOES_INTERVALO}
          valor={String(intervaloMin)}
          onMudar={(valor) => definirIntervalo(Number(valor))}
          testID="ajuste-lembretes-intervalo"
        />
      ) : null}

      {ativo ? (
        <View style={estilos.horario}>
          <Texto variante="rotulo" secundario>
            começa às
          </Texto>
          <Contador
            rotulo="horário de início dos lembretes"
            valorTexto={inicio}
            onMenos={() => mudarInicio(-1)}
            onMais={() => mudarInicio(1)}
            podeMenos={ajustarInicio(config, -1) !== inicio}
            podeMais={ajustarInicio(config, 1) !== inicio}
          />
        </View>
      ) : null}

      {ativo ? (
        <View style={estilos.horario}>
          <Texto variante="rotulo" secundario>
            termina às
          </Texto>
          <Contador
            rotulo="horário de fim dos lembretes"
            valorTexto={fim}
            onMenos={() => mudarFim(-1)}
            onMais={() => mudarFim(1)}
            podeMenos={ajustarFim(config, -1) !== fim}
            podeMais={ajustarFim(config, 1) !== fim}
          />
          <Texto variante="legenda" secundario accessibilityLiveRegion="polite">
            {resumoLembretes(config)}. os lembretes tocam mesmo se você já bateu a meta do dia.
          </Texto>
        </View>
      ) : null}
    </Secao>
  );
}

const estilos = StyleSheet.create({
  horario: {
    gap: espaco.sm,
  },
});
