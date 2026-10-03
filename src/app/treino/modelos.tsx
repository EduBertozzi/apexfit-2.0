import { router } from 'expo-router';

import { ListaModelos } from '@/features/treinos/components/ListaModelos';
import { Tela, Texto } from '@/shared/ui';

export default function Modelos() {
  return (
    <Tela bordas={['bottom']}>
      <Texto secundario>
        Um toque adiciona todos os treinos do modelo. Depois é só ajustar as cargas.
      </Texto>
      <ListaModelos onUsado={() => router.back()} />
    </Tela>
  );
}
