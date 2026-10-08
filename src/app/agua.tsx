import { metaAguaEfetiva } from '@/features/ajustes/logica';
import { useAjustesStore } from '@/features/ajustes/store';
import { CartaoHidratacao } from '@/features/hidratacao/components/CartaoHidratacao';
import { CartaoSemana } from '@/features/hidratacao/components/CartaoSemana';
import { calcularMetaAguaMl } from '@/features/perfil/calculos';
import { usePerfilStore } from '@/features/perfil/store';
import { Tela } from '@/shared/ui';

/** Água do dia (copos rápidos, desfazer) e a semana. Aberta pelo card de água da tela inicial. */
export default function Agua() {
  const perfil = usePerfilStore((state) => state.perfil);
  const metaManualMl = useAjustesStore((state) => state.metaAguaManualMl);

  if (!perfil) {
    return null;
  }

  const metaAguaMl = metaAguaEfetiva(calcularMetaAguaMl(perfil.pesoKg), metaManualMl);

  return (
    <Tela bordas={['bottom']}>
      <CartaoHidratacao metaMl={metaAguaMl} />
      <CartaoSemana metaMl={metaAguaMl} />
    </Tela>
  );
}
