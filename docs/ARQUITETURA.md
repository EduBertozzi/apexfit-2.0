# Arquitetura do ApexFit 2.0

## Stack

| Peça         | Escolha                                                         | Por quê                                                            |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Framework    | **Expo (SDK 57) + React Native**                                | Um código só para Android e iPhone; testa no celular com o Expo Go |
| Linguagem    | **TypeScript (strict)**                                         | O editor avisa o erro antes do app quebrar                         |
| Navegação    | **Expo Router**                                                 | Cada arquivo em `src/app/` vira uma tela                           |
| Estado       | **Zustand**                                                     | Simples: uma "store" é só um objeto com dados e funções            |
| Persistência | **AsyncStorage** (via `persist` do Zustand)                     | Guarda os dados no aparelho, sem servidor                          |
| Formulários  | **React Hook Form + Zod**                                       | Zod define as regras uma vez; o formulário só exibe os erros       |
| Testes       | **Jest + React Native Testing Library**                         | Regras de negócio e componentes testados sem precisar de celular   |
| Qualidade    | **ESLint, Prettier, `tsc`** e **GitHub Actions**                | Todo PR é checado automaticamente                                  |
| IA           | **Claude, OpenAI ou Ollama** em **rotas de API** do Expo Router | A chave fica no servidor; o app só chama `/api/*`                  |
| Fontes       | **Lexend** (`@expo-google-fonts`)                               | Identidade "Bento"; carregada no `_layout` antes da splash sair    |

## Organização por feature

O código é separado **por assunto do app**, não por tipo de arquivo. Quem vai mexer em hidratação abre uma pasta só.

```
src/
├── app/                      ← SÓ telas e navegação (Expo Router)
│   ├── _layout.tsx           ← decide: tem perfil? vai pro app. Não tem? onboarding
│   ├── onboarding.tsx        ← criação do perfil (uma pergunta por tela)
│   ├── editar-perfil.tsx     ← modal de edição
│   ├── dieta.tsx             ← plano alimentar gerado pela IA
│   ├── peso.tsx              ← histórico e registro de peso
│   ├── treino/               ← editar treino, sessão do dia, modelos prontos
│   ├── api/
│   │   ├── dieta+api.ts      ← ROTA DE SERVIDOR: recebe o perfil, devolve um plano
│   │   └── coach+api.ts      ← ROTA DE SERVIDOR: chat com o coach em streaming
│   └── (tabs)/
│       ├── _layout.tsx       ← barra de abas
│       ├── index.tsx         ← aba "Hoje"
│       ├── treinos.tsx       ← aba "Treinos"
│       ├── coach.tsx         ← aba "Coach" (chat com IA)
│       ├── perfil.tsx        ← aba "Perfil"
│       └── ajustes.tsx       ← aba "Ajustes" (tema, água, privacidade)
│
├── features/
│   ├── perfil/
│   │   ├── schema.ts         ← regras de validação do cadastro (Zod)
│   │   ├── campos.ts         ← como cada campo aparece + etapas do onboarding
│   │   ├── calculos.ts       ← IMC, meta de água
│   │   ├── store.ts          ← onde o perfil fica guardado
│   │   ├── types.ts
│   │   ├── components/       ← peças de tela dessa feature
│   │   └── __tests__/
│   ├── hidratacao/
│   │   ├── logica.ts         ← somar, desfazer, progresso, "bateu a meta?"
│   │   ├── store.ts
│   │   ├── components/
│   │   └── __tests__/
│   ├── nutricao/
│   │   ├── calculos.ts       ← metabolismo basal, gasto diário, meta de calorias, macros
│   │   └── components/
│   ├── dieta/
│   │   ├── contrato.ts       ← schemas Zod do pedido e do plano (app e servidor usam)
│   │   ├── prompt.ts         ← instruções e dados enviados para a IA
│   │   ├── servidor/         ← SÓ servidor: chamada à IA (nunca importe numa tela)
│   │   ├── api.ts            ← o app chamando /api/dieta
│   │   ├── store.ts          ← plano salvo no aparelho (da semana + dias com plano próprio)
│   │   ├── semana.ts         ← dieta da semana: plano do dia, seletor de dias, migração
│   │   ├── texto.ts          ← limpa markdown da IA e separa "250 g" da medida caseira
│   │   └── __tests__/
│   ├── coach/
│   │   ├── contexto.ts       ← resumo do usuário (perfil, metas, água, peso, treinos, dieta) para a IA
│   │   ├── contextoAtual.ts  ← junta o estado das stores; feature nova entra em `extras`
│   │   ├── servidor/         ← SÓ servidor: conversa em streaming + ferramentas atualizar_dieta e atualizar_treinos
│   │   ├── api.ts, store.ts  ← o app lendo o streaming de /api/coach; conversa salva
│   │   └── components/ChatCoach.tsx
│   ├── peso/                 ← registros diários, tendência de 7 dias, gráfico SVG
│   ├── treinos/              ← treinos A/B/C, modelos prontos, sessão do dia, frequência
│   │   ├── contratoIa.ts, promptIa.ts ← treinos montados pela IA (/api/treino)
│   │   ├── regrasIa.ts       ← os mesmos treinos sem IA (modo demonstração)
│   │   ├── ia.ts, storeIa.ts ← resposta da IA vira treinos salvos (com o grupo de cada exercício)
│   │   └── sequencia.ts      ← página de sequência (recorde, calendário, marcos); mesma regra da chama
│   ├── ia/                   ← textos da central de IA (aba do cérebro)
│   ├── lembretes/            ← lembretes de água (notificações locais; só notificacoes.ts toca no Expo)
│   └── ajustes/
│       ├── logica.ts         ← tema, meta de água manual
│       ├── apagarDados.ts    ← "Apagar meus dados": limpa TODAS as stores
│       └── store.ts
│
├── shared/                   ← o que qualquer feature pode usar
│   ├── ui/                   ← Botão, Campo de texto, Card, Tela...
│   ├── theme/                ← cores, espaçamentos, modo escuro
│   └── lib/                  ← utilidades (converter número, data do dia, armazenamento,
│                               compartilhar imagem: view-shot e expo-sharing; html2canvas na web)
│
└── hooks/                    ← hooks do app inteiro (ex: esperar os dados carregarem)
```

## As 3 camadas (a regra mais importante)

```
 Tela (src/app)  →  Store (features/*/store.ts)  →  Lógica pura (schema.ts, calculos.ts, logica.ts)
   mostra            guarda e salva                 decide e calcula
```

1. **Lógica pura** não importa React nem React Native. Recebe dados, devolve resultado. É aqui que ficam as regras e é aqui que **todo teste começa**.
2. **Store** guarda o estado e salva no aparelho. Chama a lógica pura, nunca faz conta "na mão".
3. **Tela** lê da store, mostra, e chama funções da store quando o usuário toca em algo. **Tela não calcula nada.**

Se você está escrevendo um `if` de regra de negócio dentro de um arquivo de `src/app/`, pare e mova para a feature.

## Decisões importantes (e por quê)

### Sem login na 2.0

A v1 tinha login e senha **guardados no próprio celular**. Isso não protege nada (quem tem o celular tem o banco) e obriga o usuário a digitar senha toda vez. Na 2.0, o app tem **um perfil local** criado no primeiro acesso.

Login de verdade volta junto com o **backend** (ver roadmap), porque aí os dados ficam num servidor e a senha passa a proteger alguma coisa.

### Chave de IA nunca fica no app

Qualquer chave colocada no código do app pode ser extraída do APK em minutos. Por isso a IA é chamada **pelas rotas de servidor** `src/app/api/` (`dieta`, `coach` e `treino`; Expo Router API Routes, `web.output: "server"` no `app.json`). O app só faz `fetch('/api/...')`.

- As chaves vêm de `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` no `.env` (ignorado pelo git; modelo em `.env.example`). **Nunca** use o prefixo `EXPO_PUBLIC_` nelas.
- O servidor **recalcula** as metas a partir do perfil e valida tudo com `dieta/contrato.ts`; não confia no que o app manda.
- Claude: `claude-opus-5-5` com structured outputs (o plano sempre volta no formato do schema) e fallback automático se o modelo recusar.
- OpenAI: `src/shared/servidor/openai.ts`, `fetch` simples na API de Chat Completions, sempre em streaming (o servidor do Expo derruba conexão parada por ~30 s). Structured outputs em modo estrito (`shared/servidor/esquemaEstrito.ts` converte os schemas zod) e function calling no coach. Modelo padrão `gpt-6-luna`; troque com `OPENAI_MODELO`.
- Em desenvolvimento, `npx expo start` já serve as rotas (`/api/dieta` e `/api/coach`).
- Em produção, o servidor roda no **EAS Hosting**: https://apexfit-app.expo.app (projeto `@edubertozzi/apexfit`). O `origin` do plugin `expo-router` no `app.json` aponta para lá, então os apps nativos de produção chamam esse servidor.
- Publicar uma versão nova: `npm run deploy` (gera o build web com as rotas e promove para produção).
- A chave em produção fica nas variáveis de ambiente do EAS, nunca no código. Para a OpenAI (a que a turma usa):
  `npx eas-cli env:create --name OPENAI_API_KEY --value <chave> --environment production --visibility secret`
  e depois `npm run deploy` de novo. Com isso a IA funciona no servidor publicado e a apresentação precisa só do celular Android.
  (Para o Claude, o mesmo comando com `ANTHROPIC_API_KEY`.)
- Para testar no computador: copie `.env.example` para `.env`, preencha `OPENAI_API_KEY=` e rode `npx expo start`.

### Qual IA responde: ordem de escolha

O servidor escolhe a IA na hora (`src/shared/servidor/provedor.ts`), e as rotas devolvem `provedor` (`claude`, `openai` ou `local`) para a tela mostrar quem respondeu:

1. **Claude**: só se existir `ANTHROPIC_API_KEY`. Sem chave, nunca é chamado e nunca cobra.
2. **OpenAI**: só se existir `OPENAI_API_KEY`. É a opção para o servidor publicado.
3. **IA local (Ollama)**: grátis, roda no Mac que está com o `npx expo start`. Instalação: `brew install ollama`, `brew services start ollama`, `ollama pull qwen2.5:7b`. Modelos pequenos erram ao escrever o plano inteiro numa ferramenta, então o servidor reconhece o pedido de dieta ou de treino (`coach/intencao.ts`) e gera o resultado com o formato JSON travado pelo schema. A OpenAI usa o mesmo caminho: no coach, as ferramentas `atualizar_dieta` e `atualizar_treinos` recebem só o pedido em uma frase e uma segunda chamada monta o plano ou os treinos (`coach/servidor/acoes.ts`).
4. **Nenhuma**: a rota responde `SEM_IA` e o app usa o **modo demonstração offline**: dieta por regras (`dieta/regras.ts`, tabela de alimentos e cardápios), treinos por regras (`treinos/regrasIa.ts`, por dias, local e objetivo) e coach por intenções (`coach/demo.ts`), sempre com os dados reais do usuário. Também entra quando não há internet. As telas mostram "modo demonstração".

O servidor publicado (EAS Hosting) não tem Ollama: lá vale a OpenAI (com a chave cadastrada no EAS) ou, sem chave, o modo demonstração.

### Treinos montados pela IA

Na aba do cérebro (`src/app/(tabs)/ia.tsx`) a pessoa escolhe dias por semana, academia ou casa e o tempo, e toca em "gerar treino". A rota `/api/treino` devolve uma sessão por dia ("Treino A", "B"...), cada exercício com o seu `grupo` (aquecimento, peito, costas... cardio), e o app troca os treinos salvos (`treinos/storeIa.ts` chama `substituirTreinos`). A tela inicial agrupa os exercícios nos cards por grupo. O histórico de treinos feitos fica. Treinos novos (da central ou do coach) já ganham dias da semana (`treinos/diasIa.ts`: os dias citados no pedido ou `diasPadrao`). O coach também monta treinos pela ferramenta `atualizar_treinos` e ajusta só uma parte com `ajustar_treino`.

No montador da semana, cada dia tem um contador "exercícios" (sem o aquecimento, de 2 a 12). Sem mexer, vale o padrão do nível (`EXERCICIOS_POR_NIVEL` em `montadorIa.ts`: iniciante 5, intermediário 6, avançado 7); depois de mexer, o número fica salvo no dia (`exercicios`) até "usar o padrão". `distribuirExercicios` reparte o total entre as áreas (1 para cada, o resto uma por vez das grandes para as pequenas; se houver mais áreas que exercícios, o total sobe para 1 por área) e a mesma conta vai para o modo offline (`regrasSemana.ts`) e para o prompt. Depois da IA, `prepararSemana` corta o que veio a mais e completa o que veio a menos com o treino offline do dia, sem repetir nome.

Dia com cardio escolhe "contínuo" (um aparelho por minutos, conta como 1 exercício) ou "circuito" (`circuito.ts`: exercícios curtos com o peso do corpo, padrão 4 de 40 s em 3 voltas). O circuito é um bloco à parte, fora do contador; cada exercício dele vai salvo como `cardio` com séries = voltas e repetições em segundos ("40 s", aceito pelo `schema.ts` e mostrado como "3x 40 s").

### Coach: propõe antes de aplicar

O coach nunca salva dieta ou treinos sozinho. O plano ou os treinos que chegam (IA ou modo demonstração) viram uma **proposta** dentro da mensagem (`coach/proposta.ts`, salva com a conversa): resumo, "aplicar" e "não, obrigado". Aplicar guarda o que havia antes para o "desfazer" (só na última proposta aplicada de cada tipo).

Pedido pequeno muda só o que foi pedido. `coach/intencao.ts` separa plano novo ("monta", "refaz", "novo treino") de ajuste ("troca o leg press por agachamento", "troca o café da manhã"). No ajuste, o app manda `planoAtual` e `treinosAtuais` no pedido, a IA devolve uma cópia editada e as funções puras `mesclarPlano` (`dieta/mesclar.ts`, as outras refeições voltam idênticas) e `mesclarTreinos` (`treinos/mesclar.ts`, exercício com o mesmo nome mantém o id, então sessões e marcas continuam valendo) montam o resultado e o resumo do que mudou.

### Sequência: descanso, congelador e última chance

A chama da tela inicial e a página `/sequencia` usam uma regra só, em `treinos/regraSequencia.ts` (pura, testada em `regraSequencia.test.ts` e `congelador.test.ts`). Ninguém é o super-homem: descansar faz parte.

- **Conta (+1)**: dia com pelo menos 50% do treino; dia de **descanso do plano** semanal (dia sem treino marcado) também conta, desde que já exista uma sequência (descanso nunca começa uma sozinho).
- **Folga do rodízio**: num dia sem treino marcado (rodízio, ou dia livre de um plano misto), **um** dia sem treino logo depois de um dia treinado não quebra. Ele aparece como descanso e conta quando o próximo dia é treinado. Dois dias seguidos sem treino quebram. Falta em dia marcado do plano nunca é folga.
- **Congelador**: a cada 7 dias de sequência (7, 14, 21...) ganha 1, guardando no máximo 2; começa com 0 e quebrar não tira os guardados. A falta que quebraria a sequência gasta um sozinho: o dia fica **congelado** (azul gelo `c.congelado` e floco de neve), a sequência segue, mas o dia não soma. Sem sequência (0), nada é gasto.
- **Hoje** ainda não acabou: sem treino, não conta nem quebra; descanso do plano de hoje já conta. `risco` diz o que aconteceria se hoje passar em branco (`quebra`, `ultimo-congelador`, `congela` ou `nenhum`).
- **Dias congelados ficam salvos** em `useTreinosStore.congelados` (persist versão 2, `migrarTreinos`). Um dia salvo continua congelado mesmo que o plano mude depois, então a sequência nunca quebra para trás. Quem salva é o efeito de `useUltimaChance`.
- **Última chance**: com sequência em jogo e risco `quebra` ou `ultimo-congelador`, aparece o aviso "última chance" na tela inicial (acima da faixa da semana) e na página de sequência, e uma notificação local é agendada para as 20:00 de hoje, só se a permissão já foi dada (o app não pede só por isso). O plano é puro (`treinos/ultimaChance.ts`, `planejarAvisoUltimaChance`); o efeito fino é `treinos/useUltimaChance.ts`, que cancela o aviso quando o treino de hoje é feito. A conversa com o expo-notifications continua toda em `lembretes/notificacoes.ts` (`agendarAvisoUnico`, `cancelarAviso`, `podeNotificar`).
- **Calendários**: na faixa da semana e no calendário da sequência, um anel (`shared/ui/AnelProgresso`, react-native-svg) em volta do número mostra quanto do treino foi feito (cheio = 100%), com as cores da regra do calendário (arco na versão forte `semana.anel`). Hoje fica em branco e o futuro só com o trilho cinza. O calendário da sequência é um mês por página, deslizando para o lado (ou pelas setas), sempre com 6 linhas.

### Dieta da semana e pedidos com dia

A dieta tem um **plano da semana** (`plano`) e, se a pessoa quiser, **dias com plano próprio** (`porDia`, 0 = domingo, igual a `Treino.dias`). `dieta/semana.ts` decide o plano de cada dia (`planoDoDia`) e aplica propostas (`aplicarNaSemana`); a store migrou da versão 1 (um plano só) para a 2. A tela de dieta abre no dia de hoje, com um seletor de dias; `/api/dieta` aceita `dia` para montar o plano de um dia só.

Todo pedido ao coach leva a dieta de todos os dias (`planoAtual` + `dietaPorDia`) e os treinos com dias (`treinosAtuais`). Dia citado no pedido (`intencao.diasCitados`) delimita a mudança: "muda o almoço de quarta" muda só a dieta de quarta; "troca o supino da sexta" muda só o treino marcado na sexta (`treinos/mesclar.restringirAosDias`), e o resumo começa pelo dia ("sexta: supino reto trocado por supino inclinado"). O modo demonstração resolve trocas simples de exercício sem IA (`coach/trocaExercicio.ts`).

### Design system "Bento"

Tudo visual sai de `src/shared/theme/tokens.ts` (cores, `espaco`, `raio`, `familia`, `fonte`). Nada de cor ou medida escrita direto no componente. Regras que valem para qualquer tela nova:

- **Visual**: fundo preto (claro no tema claro), cards `superficie` com `raio.lg` (28), sem borda e com bastante respiro. Botões, chips e seletores são pílulas (`raio.total`); botões só de ícone são redondos e têm no mínimo 44 px.
- **Cores pastel**: o menta (`destaque`) e as cores de categoria (`useCategorias()`) são claros demais para texto em fundo claro. Use como **fundo** atrás de texto escuro (`textoSobreDestaque`), ou como texto só no modo escuro. Para texto colorido no claro, use `useCategorias().texto`. Água usa `c.agua`.
- **Fonte**: Lexend, cada peso é uma família (`familia.display`, `familia.corpo`...). **Não use `fontWeight`**: no Android a fonte volta para a do sistema. Nada de itálico.
- **Textos**: títulos e botões em minúsculas ("ver dieta", "salvar peso de hoje"), escritos assim na própria copy (sem `textTransform`, para nomes próprios e siglas como IA continuarem certos). **Sem emoji e sem travessão**: use vírgula, ponto ou dois-pontos.
- **Nada do Volt**: sem caixa alta, sem barras inclinadas (`skewX`), sem bordas grossas em cards.
- **Peças prontas** em `src/shared/ui`: `Tela`, `Cartao`, `Secao` (grupo de ajustes), `Botao`, `CampoTexto`, `Opcoes`, `Contador`, `Interruptor`, `BarraProgresso`, `Marcado` (palavra em destaque dentro de um título).
- **Cards da tela inicial**: `CartaoToque` (card inteiro é o botão) e `SetaCartao` (seta redonda do canto; com `onPress` vira um botão separado de 44 px, como no card de água e nos cards de grupo, onde cada exercício é uma caixa de marcar).
- **Movimento e vibração**: animações com `react-native-reanimated` (ex: `usePop`, `BarraProgresso animado`) sempre pulam com "reduzir movimento" ligado (`useReducedMotion`). Vibração só pelo `useVibrar()` (`shared/lib`), que respeita Ajustes e não roda na web.
- **Tema**: `useCores()` já respeita a escolha em Ajustes (automático, claro ou escuro).

### Dados de saúde

Peso, gordura corporal e restrições são **dados sensíveis pela LGPD**. Por isso:

- ficam no aparelho; só vão para o servidor (e para a IA escolhida: Anthropic ou OpenAI) quando a pessoa pede a dieta, os treinos ou fala com o coach, e a aba Ajustes explica isso;
- a aba Ajustes tem **"Apagar meus dados"** (`ajustes/apagarDados.ts`); toda store nova com dado do usuário precisa entrar lá;
- antes de publicar nas lojas, precisa de termo de consentimento para o envio à IA.

### IMC para menores de 18

A classificação de IMC (abaixo do peso, normal, etc.) da OMS vale **só para adultos**. Para menores, o app mostra o número mas não classifica, porque o certo é usar curvas de percentil por idade e sexo.
