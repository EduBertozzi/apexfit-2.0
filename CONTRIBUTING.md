# Como contribuir com o ApexFit

Este é o "combinado" da equipe. Seguir ele evita código quebrado na `main` e deixa o histórico fácil de entender.

## 1. Nunca commite direto na `main`

A `main` é a versão que **sempre funciona**. Todo trabalho novo acontece numa branch:

```bash
# atualiza a main antes de começar
git checkout main
git pull

# cria uma branch para a tarefa
git checkout -b feat/historico-de-agua
```

| Prefixo     | Quando usar                         | Exemplo                           |
| ----------- | ----------------------------------- | --------------------------------- |
| `feat/`     | funcionalidade nova                 | `feat/historico-de-agua`          |
| `fix/`      | correção de bug                     | `fix/meta-de-agua-arredondamento` |
| `refactor/` | reorganizar sem mudar comportamento | `refactor/separar-cartao-imc`     |
| `test/`     | só testes                           | `test/validacao-peso`             |
| `docs/`     | só documentação                     | `docs/como-rodar-no-windows`      |
| `chore/`    | configuração, dependências          | `chore/atualiza-expo`             |

## 2. Mensagens de commit (Conventional Commits)

Formato: `tipo: o que mudou`, em português, no imperativo.

```
feat: adiciona histórico de água dos últimos 7 dias
fix: corrige meta de água para pesos com vírgula
test: cobre idade fora da faixa no cadastro
```

Regras de ouro:

- **Um commit = uma ideia.** Não misture "arrumei o layout" com "mudei a validação".
- Se precisa de "e" na mensagem, provavelmente são dois commits.
- Commits pequenos e frequentes são melhores que um commitzão no fim do dia.

## 3. Pull Request (PR)

```bash
git push -u origin feat/historico-de-agua
```

Depois abra o PR no GitHub. O template já traz o checklist. Antes de pedir revisão:

```bash
npm run check
```

- O **GitHub Actions** roda o mesmo `check` em todo PR. Se ficar vermelho, não dá merge.
- **Outra pessoa revisa e aprova** antes do merge. Revisão não é crítica pessoal: é como todo mundo aprende.

## 4. Testes

Toda regra (validação, cálculo, conversão) fica nos arquivos puros de `src/features/<feature>/` e **precisa de teste** na pasta `__tests__/` ao lado.

Corrigindo um bug? Primeiro escreva um teste que **reproduz** o bug e veja ele falhar. Depois corrija e veja passar.

## 5. Onde cada coisa fica

| Pasta                                              | O que vai nela                               | Pode usar React?                  |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| `features/*/schema.ts`, `calculos.ts`, `logica.ts` | regras do app                                | **Não** (por isso é fácil testar) |
| `features/*/store.ts`                              | estado e o que é salvo no aparelho           | Zustand                           |
| `features/*/components/`                           | pedaços de tela daquela feature              | Sim                               |
| `shared/ui/`                                       | componentes genéricos (Botão, Campo, Cartão) | Sim                               |
| `app/`                                             | telas: juntam componentes e chamam a store   | Sim                               |

Se uma tela está fazendo conta ou validando campo, essa lógica está no lugar errado.

## 6. Estilo

- Cores e espaçamentos **só** de `src/shared/theme/tokens.ts`. Nada de `'#2E7D32'` solto.
- Nomes em português, como o resto do código.
- `npm run format` antes de commitar.
