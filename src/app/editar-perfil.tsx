import { router } from 'expo-router';

import { FormularioPerfil } from '@/features/perfil/components/FormularioPerfil';
import { perfilParaFormulario } from '@/features/perfil/schema';
import { usePerfilStore } from '@/features/perfil/store';
import type { Perfil } from '@/features/perfil/types';
import { Tela } from '@/shared/ui';

export default function EditarPerfil() {
  const perfil = usePerfilStore((state) => state.perfil);
  const salvarPerfil = usePerfilStore((state) => state.salvarPerfil);

  if (!perfil) {
    return null;
  }

  function salvar(novoPerfil: Perfil) {
    salvarPerfil(novoPerfil);
    router.back();
  }

  return (
    <Tela bordas={['bottom']}>
      <FormularioPerfil
        valoresIniciais={perfilParaFormulario(perfil)}
        textoBotao="Salvar alterações"
        onSalvar={salvar}
      />
    </Tela>
  );
}
