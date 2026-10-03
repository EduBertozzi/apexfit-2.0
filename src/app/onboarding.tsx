import { OnboardingEtapas } from '@/features/perfil/components/OnboardingEtapas';
import { usePerfilStore } from '@/features/perfil/store';
import { Tela } from '@/shared/ui';

export default function Onboarding() {
  const salvarPerfil = usePerfilStore((state) => state.salvarPerfil);

  return (
    <Tela>
      {/* Ao salvar, o _layout percebe que agora existe perfil e leva para o app */}
      <OnboardingEtapas onSalvar={salvarPerfil} />
    </Tela>
  );
}
