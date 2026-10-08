import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { espaco, raio, type CorCategoria } from '@/shared/theme/tokens';
import { useCategorias, useCores } from '@/shared/theme/useCores';
import { BarraProgresso, Botao, Logo, Texto } from '@/shared/ui';

import { CONFIG_CAMPOS, ETAPAS_ONBOARDING } from '../campos';
import { FORMULARIO_VAZIO, perfilSchema, type FormularioPerfilValores } from '../schema';
import type { Perfil } from '../types';
import { CampoPerfil } from './CampoPerfil';

const TOTAL = ETAPAS_ONBOARDING.length;

const DESTAQUES: {
  texto: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  cor: CorCategoria;
}[] = [
  { texto: 'meta de água pelo seu peso', icone: 'water', cor: 'agua' },
  { texto: 'calorias e macros do seu objetivo', icone: 'flame', cor: 'braco' },
  { texto: 'dieta montada por IA em segundos', icone: 'sparkles', cor: 'aquecimento' },
];

function BoasVindas({ onComecar }: { onComecar: () => void }) {
  const c = useCores();
  const categorias = useCategorias();

  return (
    <View style={estilos.etapa}>
      <Logo tamanho={88} />
      <View style={estilos.cabecalho}>
        <Texto variante="gigante" accessibilityRole="header">
          ApexFit
        </Texto>
        <Texto variante="subtitulo" secundario>
          seu treino fora da academia também conta.
        </Texto>
      </View>

      <View style={estilos.destaques}>
        {DESTAQUES.map((destaque) => (
          <View key={destaque.texto} style={[estilos.destaque, { backgroundColor: c.superficie }]}>
            <View style={[estilos.icone, { backgroundColor: categorias.fundo[destaque.cor] }]}>
              <Ionicons name={destaque.icone} size={20} color={c.textoSobreDestaque} />
            </View>
            <Texto style={estilos.textoDestaque}>{destaque.texto}</Texto>
          </View>
        ))}
      </View>

      <Texto variante="legenda" secundario style={estilos.legenda}>
        são 6 perguntas rápidas. seus dados ficam no seu celular.
      </Texto>
      <Botao titulo="começar" onPress={onComecar} />
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
          etapa {indice + 1} de {TOTAL}
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
          titulo={ultima ? 'criar meu perfil' : 'continuar'}
          onPress={continuar}
          carregando={isSubmitting}
        />
        <Botao titulo="voltar" variante="texto" onPress={() => setIndice(indice - 1)} />
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
    gap: espaco.sm,
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
    gap: espaco.md - 4,
    padding: espaco.md - 4,
    borderRadius: raio.lg,
    borderCurve: 'continuous',
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: raio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legenda: {
    paddingHorizontal: espaco.xs,
  },
  textoDestaque: {
    flex: 1,
  },
});
