# ApexFit

App de saúde e treino: perfil físico, meta de água diária, IMC e, em breve, treinos e dieta com IA.

> **Versão 2.0**: reescrita em **Expo + React Native + TypeScript** a partir da [v1 em Java](https://github.com/Luiz0l/apexfit).

## Rodando o app

Você precisa do [Node.js](https://nodejs.org) (versão 20 ou mais nova) e do app **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iPhone](https://apps.apple.com/app/expo-go/id982107779)).

```bash
# 1. instala as dependências (só na primeira vez ou quando o package.json mudar)
npm install

# 2. sobe o servidor de desenvolvimento
npm start
```

Aparece um **QR code** no terminal. Abra a câmera (iPhone) ou o Expo Go (Android) e aponte para ele. O app abre no celular e atualiza sozinho quando você salva um arquivo.

Sem celular por perto? `npm run web` abre no navegador.

## Comandos

| Comando              | O que faz                                              |
| -------------------- | ------------------------------------------------------ |
| `npm start`          | Sobe o app para abrir no Expo Go                       |
| `npm run web`        | Abre no navegador                                      |
| `npm test`           | Roda todos os testes                                   |
| `npm run test:watch` | Roda os testes de novo a cada arquivo salvo            |
| `npm run typecheck`  | Procura erros de tipo do TypeScript                    |
| `npm run lint`       | Procura problemas no código                            |
| `npm run format`     | Formata todo o código com o Prettier                   |
| `npm run check`      | Typecheck + lint + testes (rode **antes de abrir PR**) |

## Documentação

- **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)**: como o código é organizado e por quê. **Leia primeiro.**
- **[docs/ROADMAP.md](docs/ROADMAP.md)**: o que já existe e o que vem depois
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: branches, commits, Pull Requests e testes

## Estrutura resumida

```
src/
├── app/        telas e navegação (cada arquivo = uma tela)
├── features/   perfil, hidratação, dieta (regras + testes de cada assunto)
├── shared/     componentes de UI, tema e utilidades
└── hooks/      hooks usados pelo app inteiro
```

## Aviso

O ApexFit não substitui orientação médica ou de nutricionista.
