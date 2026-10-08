import { MinhaSemana } from '@/features/treinos/components/MinhaSemana';
import { Tela } from '@/shared/ui';

/** "Minha semana": o plano semanal inteiro, um treino por dia. */
export default function Semana() {
  return (
    <Tela bordas={['bottom']}>
      <MinhaSemana />
    </Tela>
  );
}
