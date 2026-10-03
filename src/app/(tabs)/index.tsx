import { CartaoHidratacao } from '@/features/hidratacao/components/CartaoHidratacao';
import { calcularMetaAguaMl, primeiroNome } from '@/features/perfil/calculos';
import { CartaoImc } from '@/features/perfil/components/CartaoImc';
import { usePerfilStore } from '@/features/perfil/store';
import { dataPorExtenso } from '@/shared/lib/data';
import { Botao, Cartao, Tela, Texto } from '@/shared/ui';

export default function Hoje() {
  const perfil = usePerfilStore((state) => state.perfil);

  if (!perfil) {
    return null;
  }

  return (
    <Tela>
      <Texto variante="legenda" secundario>
        {dataPorExtenso(new Date())}
      </Texto>
      <Texto variante="titulo" accessibilityRole="header">
        Olá, {primeiroNome(perfil.nome)}!
      </Texto>

      <CartaoHidratacao metaMl={calcularMetaAguaMl(perfil.pesoKg)} />

      <CartaoImc perfil={perfil} />

      <Cartao titulo="Treino de hoje">
        <Texto secundario>Em breve: monte seus treinos e marque o que já fez.</Texto>
      </Cartao>

      <Cartao titulo="Dieta com IA">
        <Texto secundario>Em breve: um plano alimentar montado a partir do seu perfil.</Texto>
        <Botao titulo="Montar minha dieta" onPress={() => {}} desabilitado />
      </Cartao>
    </Tela>
  );
}
