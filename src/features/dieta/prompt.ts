import type { Perfil } from '@/features/perfil/types';
import { formatarNumero } from '@/shared/lib/numero';

/**
 * Monta o texto que será enviado para a IA gerar a dieta.
 *
 * ⚠️ Ainda não é usado: a chamada para a IA vai ficar num BACKEND,
 * nunca direto no app (a chave da API vazaria). Ver docs/ARQUITETURA.md.
 */
export function montarPromptDieta(perfil: Perfil): string {
  const naoInformado = 'não informado';

  const gordura =
    perfil.percentualGordura === undefined
      ? naoInformado
      : `${formatarNumero(perfil.percentualGordura, 1)}%`;

  const linhas = [
    'Você é um assistente nutricional virtual. Monte uma dieta baseada nos dados abaixo.',
    'Inclua um aviso para o usuário consultar um médico ou nutricionista real.',
    perfil.idade < 18
      ? 'O usuário é menor de idade: não sugira déficit calórico agressivo nem suplementos.'
      : null,
    `Idade: ${perfil.idade} anos`,
    `Peso: ${formatarNumero(perfil.pesoKg, 1)} kg`,
    `Altura: ${formatarNumero(perfil.alturaCm, 0)} cm`,
    `Gordura corporal: ${gordura}`,
    `Restrições/Saúde: ${perfil.restricoes ?? naoInformado}`,
    'Calcule os macros e divida em refeições diárias.',
  ];

  return linhas.filter((linha) => linha !== null).join('\n');
}
