import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { espaco } from '@/shared/theme/tokens';
import { useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Marcado, Texto } from '@/shared/ui';

import { CONFIG_CAMPOS, ETAPAS_ONBOARDING } from '../campos';
import { FORMULARIO_VAZIO, perfilSchema, type FormularioPerfilValores } from '../schema';
import type { Perfil } from '../types';
import { CampoPerfil } from './CampoPerfil';

const TOTAL = ETAPAS_ONBOARDING.length;

const DESTAQUES = [
  'Meta de água pelo seu peso',
  'Calorias e macros do seu objetivo',
  'Dieta montada por IA em segundos',
];

function BoasVindas({ onComecar }: { onComecar: () => void }) {
  const c = useCores();

  return (
    <View style={estilos.etapa}>
      <Texto variante="gigante" accessibilityRole="header">
        Apex<Marcado>Fit</Marcado>
      </Texto>
      <Texto variante="subtitulo">Seu treino fora da academia também conta.</Texto>

      <View style={estilos.destaques}>
        {DESTAQUES.map((texto) => (
          <View key={texto} style={estilos.destaque}>
            <View style={[estilos.marcador, { backgroundColor: c.destaque }]} />
            <Texto style={estilos.textoDestaque}>{texto}</Texto>
          </View>
        ))}
      </View>

      <Texto variante="legenda" secundario>
        São 6 perguntas rápidas. Seus dados ficam no seu celular.
      </Texto>
      <Botao titulo="Começar" onPress={onComecar} />
    </View>
  );
}

type Props = {
  onSalvar: (perfil: Perfil) => void;
};

/** Onboarding com uma pergunta por tela. Mesmo schema e mesmos campos da edição. */
export function OnboardingEtapas({ onSalvar }: Props) {
  // -1 = tela de boas-vindas
  const [indice, setIndice] = useState(-1);

  const {
    control,
    handleSubmit,
    trigger,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormularioPerfilValores, unknown, Perfil>({
    resolver: zodResolver(perfilSchema),
    defaultValues: FORMULARIO_VAZIO,
    mode: 'onTouched',
  });

  const etapa = indice >= 0 ? ETAPAS_ONBOARDING[indice] : null;
  const ultima = indice === TOTAL - 1;

  useEffect(() => {
    if (etapa) {
      AccessibilityInfo.announceForAccessibility(
        `Etapa ${indice + 1} de ${TOTAL}: ${etapa.titulo}`,
      );
    }
  }, [etapa, indice]);

  if (!etapa) {
    return <BoasVindas onComecar={() => setIndice(0)} />;
  }

  async function continuar() {
    if (!etapa) {
      return;
    }

    // Valida só os campos desta etapa; o resto ainda nem apareceu
    const valido = await trigger(etapa.campos);

    if (!valido) {
      return;
    }

    if (ultima) {
      await handleSubmit(onSalvar)();
      return;
    }

    setIndice(indice + 1);
  }

  const camposTexto = etapa.campos.filter((nome) => CONFIG_CAMPOS[nome].tipo === 'texto');

  return (
    <View style={estilos.etapa}>
      <View style={estilos.progresso}>
        <Texto variante="rotulo" secundario>
          Etapa {indice + 1} de {TOTAL}
        </Texto>
        <BarraProgresso
          valor={(indice + 1) / TOTAL}
          rotuloAcessivel={`Etapa ${indice + 1} de ${TOTAL}`}
        />
      </View>

      <View style={estilos.cabecalho}>
        <Texto variante="titulo" accessibilityRole="header">
          {etapa.titulo}
        </Texto>
        <Texto secundario>{etapa.descricao}</Texto>
      </View>

      {/* A key remonta os campos a cada etapa, para o autoFocus funcionar */}
      <View key={etapa.id} style={estilos.campos}>
        {etapa.campos.map((nome) => {
          const posicao = camposTexto.indexOf(nome);
          const proximo = posicao === -1 ? undefined : camposTexto[posicao + 1];

          return (
            <CampoPerfil
              key={nome}
              nome={nome}
              control={control}
              errors={errors}
              autoFocus={posicao === 0}
              ultimo={proximo === undefined}
              onProximo={() => (proximo ? setFocus(proximo) : continuar())}
            />
          );
        })}
      </View>

      <View style={estilos.botoes}>
        <Botao
          titulo={ultima ? 'Criar meu perfil' : 'Continuar'}
          onPress={continuar}
          carregando={isSubmitting}
        />
        <Botao titulo="Voltar" variante="texto" onPress={() => setIndice(indice - 1)} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  etapa: {
    gap: espaco.lg,
    paddingTop: espaco.md,
  },
  progresso: {
    gap: espaco.sm,
  },
  cabecalho: {
    gap: espaco.xs,
  },
  campos: {
    gap: espaco.md,
  },
  botoes: {
    gap: espaco.xs,
  },
  destaques: {
    gap: espaco.sm,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  marcador: {
    width: 10,
    height: 10,
  },
  textoDestaque: {
    flex: 1,
  },
});
