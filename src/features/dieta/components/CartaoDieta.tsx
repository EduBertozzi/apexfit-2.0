import { router } from 'expo-router';

import { calcularNecessidades } from '@/features/nutricao/calculos';
import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';
import { useCores } from '@/shared/theme/useCores';
import { Botao, Cartao, Texto } from '@/shared/ui';

import { planoDesatualizado } from '../logica';
import { useDietaStore } from '../store';

export function CartaoDieta({ perfil }: { perfil: Perfil }) {
  const c = useCores();
  const plano = useDietaStore((state) => state.plano);
  const gerando = useDietaStore((state) => state.gerando);
  const erro = useDietaStore((state) => state.erro);
  const gerar = useDietaStore((state) => state.gerar);

  const necessidades = calcularNecessidades(perfil);
  const liberada = necessidades !== null;

  function montar() {
    gerar(perfil);
    router.push('/dieta');
  }

  if (plano) {
    return (
      <Cartao titulo="sua dieta">
        <Texto variante="subtitulo">
          {plano.refeicoes.length} refeições, {formatarNumero(plano.caloriasDia)} kcal
        </Texto>
        {planoDesatualizado(plano.caloriasDia, necessidades?.metaCalorias ?? null) ? (
          <Texto variante="legenda" style={{ color: c.erro }}>
            Seu perfil mudou e este plano não bate mais com sua meta. Gere um novo.
          </Texto>
        ) : (
          <Texto secundario numberOfLines={2}>
            {plano.resumo}
          </Texto>
        )}
        <Botao titulo="ver minha dieta" onPress={() => router.push('/dieta')} />
        <Botao
          titulo="ajustar com o coach"
          variante="secundario"
          onPress={() => router.push('/coach')}
        />
      </Cartao>
    );
  }

  return (
    <Cartao titulo="dieta com IA">
      <Texto secundario>
        {liberada
          ? 'Um plano de refeições feito com as suas calorias e macros, em segundos.'
          : 'Complete seu perfil para liberar a dieta montada por IA.'}
      </Texto>
      {erro ? (
        <Texto variante="legenda" style={{ color: c.erro }} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
      <Botao
        titulo="montar minha dieta"
        onPress={montar}
        desabilitado={!liberada}
        carregando={gerando}
      />
    </Cartao>
  );
}
