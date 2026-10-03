# Roadmap de features

Status: ✅ pronto · 🚧 próximo · 💡 ideia

## O que veio da v1

| Feature da v1               | Como estava                                                   | Na 2.0                                                    |
| --------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| Cadastro com dados físicos  | Travava ao digitar "." ou vírgula; só checava se estava vazio | ✅ Onboarding com validação campo a campo, aceita vírgula |
| Login com senha             | Senha em texto puro no celular                                | ✅ Removido (ver ARQUITETURA.md); volta com backend       |
| Contador de água            | Zerava ao girar a tela; meta fixa 3000 ml                     | ✅ Salvo por dia, meta pelo peso, desfazer                |
| Meta de água pelo peso      | Calculada mas nunca usada                                     | ✅ Usada de verdade (35 ml/kg)                            |
| "Treino de hoje"            | Texto fixo no layout                                          | 🚧 Card de "em breve" até existir a feature               |
| Calorias do dia             | Texto fixo no layout                                          | ✅ Meta e macros calculadas pelo perfil e objetivo        |
| Botão "Montar dieta com IA" | Toast "em breve"                                              | ✅ Gerada pelo Claude via rota de servidor                |

## Próximas versões

### 2.1 Experiência (UI/UX)

- ✅ Protótipo das telas (canvas com 7 direções + 6 variações da escolhida)
- ✅ Identidade visual "Volt": paleta menta, Barlow Condensed, claro e escuro
- 🚧 Logo, ícone e splash novos (ainda são os da 2.0)
- ✅ Onboarding em etapas (uma pergunta por tela)
- ✅ Aba Ajustes: tema, meta de água, vibração, privacidade
- 🚧 Animações e feedback ao bater a meta de água (destaque e vibração prontos; falta animação)

### 2.2 Progresso

- 💡 Registro de peso ao longo do tempo + gráfico
- ✅ Histórico de água dos últimos 7 dias e sequência de metas batidas
- 💡 Histórico de 30 dias
- 💡 Lembretes de beber água (notificações locais)
- ✅ Meta de água personalizada (editar manualmente)

### 2.3 Treinos

- 💡 Cadastro de treinos (A/B/C), exercícios, séries e cargas
- 💡 Marcar treino como feito, sequência de dias

### 3.0 Backend + IA

- 💡 Conta de usuário de verdade (ex: Supabase Auth)
- 💡 Dados sincronizados na nuvem
- ✅ Dieta gerada por IA via rota de servidor (chave nunca no app)
- 🚧 Publicar o servidor (EAS Hosting) para a dieta funcionar fora do modo desenvolvimento
- 💡 Termo de consentimento LGPD

## Como uma feature nova entra

1. Vira uma **issue** no GitHub com o que o usuário consegue fazer
2. Alguém cria a branch `feat/nome-da-feature`
3. Começa pela **lógica pura + teste**, depois store, depois tela
4. Abre PR, outra pessoa revisa, CI verde, merge
