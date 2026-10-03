# Arquitetura do ApexFit 2.0

## Stack

| Peça         | Escolha                                          | Por quê                                                            |
| ------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| Framework    | **Expo (SDK 57) + React Native**                 | Um código só para Android e iPhone; testa no celular com o Expo Go |
| Linguagem    | **TypeScript (strict)**                          | O editor avisa o erro antes do app quebrar                         |
| Navegação    | **Expo Router**                                  | Cada arquivo em `src/app/` vira uma tela                           |
| Estado       | **Zustand**                                      | Simples: uma "store" é só um objeto com dados e funções            |
| Persistência | **AsyncStorage** (via `persist` do Zustand)      | Guarda os dados no aparelho, sem servidor                          |
| Formulários  | **React Hook Form + Zod**                        | Zod define as regras uma vez; o formulário só exibe os erros       |
| Testes       | **Jest + React Native Testing Library**          | Regras de negócio e componentes testados sem precisar de celular   |
| Qualidade    | **ESLint, Prettier, `tsc`** e **GitHub Actions** | Todo PR é checado automaticamente                                  |

## Organização por feature

O código é separado **por assunto do app**, não por tipo de arquivo. Quem vai mexer em hidratação abre uma pasta só.

```
src/
├── app/                      ← SÓ telas e navegação (Expo Router)
│   ├── _layout.tsx           ← decide: tem perfil? vai pro app. Não tem? onboarding
│   ├── onboarding.tsx        ← criação do perfil
│   ├── editar-perfil.tsx     ← modal de edição
│   └── (tabs)/
│       ├── _layout.tsx       ← barra de abas
│       ├── index.tsx         ← aba "Hoje"
│       └── perfil.tsx        ← aba "Perfil"
│
├── features/
│   ├── perfil/
│   │   ├── schema.ts         ← regras de validação do cadastro (Zod)
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
│   └── dieta/
│       ├── prompt.ts         ← texto que será enviado para a IA (futuro)
│       └── __tests__/
│
├── shared/                   ← o que qualquer feature pode usar
│   ├── ui/                   ← Botão, Campo de texto, Card, Tela...
│   ├── theme/                ← cores, espaçamentos, modo escuro
│   └── lib/                  ← utilidades (converter número, data do dia, armazenamento)
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

Qualquer chave colocada no código do app pode ser extraída do APK em minutos. A IA vai ser chamada **por um backend** (ex: função serverless), e o app só fala com esse backend.

### Dados de saúde

Peso, gordura corporal e restrições são **dados sensíveis pela LGPD**. Por isso:

- ficam só no aparelho (por enquanto);
- a aba Perfil tem **"Apagar meus dados"**;
- quando houver backend, precisa de termo de consentimento.

### IMC para menores de 18

A classificação de IMC (abaixo do peso, normal, etc.) da OMS vale **só para adultos**. Para menores, o app mostra o número mas não classifica, porque o certo é usar curvas de percentil por idade e sexo.
