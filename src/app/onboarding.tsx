import { FormularioPerfil } from '@/features/perfil/components/FormularioPerfil';
import { usePerfilStore } from '@/features/perfil/store';
import { Marcado, Tela, Texto } from '@/shared/ui';

export default function Onboarding() {
  const salvarPerfil = usePerfilStore((state) => state.salvarPerfil);

  return (
    <Tela>
      <Texto variante="gigante" accessibilityRole="header">
        Apex<Marcado>Fit</Marcado>
      </Texto>
      <Texto secundario>Vamos montar seu perfil. Leva menos de um minuto.</Texto>

      {/* Ao salvar, o _layout percebe que agora existe perfil e leva para o app */}
      <FormularioPerfil textoBotao="Começar" onSalvar={salvarPerfil} />
    </Tela>
  );
}
