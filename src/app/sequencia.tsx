import { primeiroNome } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { AvisoUltimaChance } from '@/features/treinos/components/AvisoUltimaChance';
import { BolinhasSemana } from '@/features/treinos/components/BolinhasSemana';
import { CalendarioSequencia } from '@/features/treinos/components/CalendarioSequencia';
import { CartaoCongelador } from '@/features/treinos/components/CartaoCongelador';
import { CompartilharSequencia } from '@/features/treinos/components/CompartilharSequencia';
import { HeroiSequencia } from '@/features/treinos/components/HeroiSequencia';
import { MarcosSequencia } from '@/features/treinos/components/MarcosSequencia';
import { NumerosSequencia } from '@/features/treinos/components/NumerosSequencia';
import { useSequencia } from '@/features/treinos/useSequencia';
import { useHoje } from '@/shared/lib/useHoje';
import { useCores } from '@/shared/theme/useCores';
import { Cartao, Tela } from '@/shared/ui';

/** Sequência de treinos: chama, última chance, semana, congelador, calendário, recordes, marcos e compartilhar. */
export default function Sequencia() {
  const c = useCores();
  const hoje = useHoje();
  const sequencia = useSequencia(hoje);
  const nome = usePerfilStore((state) => primeiroNome(state.perfil?.nome ?? ''));

  return (
    <Tela bordas={['bottom']}>
      <HeroiSequencia dias={sequencia.atual} rotulo={sequencia.rotulo} frase={sequencia.frase} />

      <AvisoUltimaChance hoje={hoje} />

      <Cartao titulo="esta semana">
        <BolinhasSemana
          bolinhas={sequencia.semana}
          paleta={{
            vazio: c.superficieSecundaria,
            contorno: c.texto,
            rotulo: c.textoSecundario,
            congelado: c.congelado,
          }}
        />
      </Cartao>

      <CartaoCongelador
        congeladores={sequencia.congeladores}
        texto={sequencia.textoCongeladores}
        proximo={sequencia.textoProximoCongelador}
      />

      <NumerosSequencia
        recorde={sequencia.recorde}
        noMes={sequencia.noMes}
        total={sequencia.total}
      />

      <CalendarioSequencia hoje={hoje} />

      <MarcosSequencia lista={sequencia.marcos.lista} proximo={sequencia.marcos.proximo} />

      <CompartilharSequencia
        dias={sequencia.atual}
        rotulo={sequencia.rotulo}
        frase={sequencia.frase}
        bolinhas={sequencia.semana}
        nome={nome}
        treinoDeHoje={sequencia.treinoDeHoje}
      />
    </Tela>
  );
}
