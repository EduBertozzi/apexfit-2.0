/**
 * Modelos de refeição usados pela dieta por regras. Cada item lista opções em
 * ordem de preferência: a primeira que a restrição da pessoa permite entra.
 * `base` é a porção de partida (g, ml ou unidades); depois tudo é escalado.
 */

export type Papel = 'proteina' | 'carbo' | 'gordura' | 'fixo' | 'livre';

export type Opcao = { id: string; base: number };

export type ItemModelo = { papel: Papel; opcoes: Opcao[] };

export type ModeloRefeicao = { itens: ItemModelo[] };

export type Slot = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

export type SlotTrocavel = Exclude<Slot, 'ceia'>;

export const NOME_SLOT: Record<Slot, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche da tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
};

export const HORARIO_SLOT: Record<Slot, string> = {
  cafe: '07:00',
  almoco: '12:00',
  lanche: '16:00',
  jantar: '20:00',
  ceia: '22:00',
};

const o = (id: string, base: number): Opcao => ({ id, base });
const item = (papel: Papel, ...opcoes: Opcao[]): ItemModelo => ({ papel, opcoes });

const SALADA = item('livre', o('salada', 100));
const CAFE = item('livre', o('cafe', 100));
const AZEITE = item('gordura', o('azeite', 1));
const LEGUMES = item('fixo', o('legumes', 100));
const OVO_OU_TOFU = (ovos: number) => item('proteina', o('ovo', ovos), o('tofu', ovos * 50));
const QUEIJO = item('proteina', o('queijo-branco', 30), o('queijo-sem-lactose', 30));
const IOGURTE = item(
  'proteina',
  o('iogurte', 170),
  o('iogurte-sem-lactose', 170),
  o('bebida-soja', 200),
);
const LEITE = item('proteina', o('leite', 200), o('leite-sem-lactose', 200), o('bebida-soja', 200));
const OLEAGINOSA = item(
  'gordura',
  o('castanha-caju', 15),
  o('castanha-para', 2),
  o('semente-girassol', 10),
);
const PAO = (fatias: number) =>
  item('carbo', o('pao-integral', fatias), o('pao-sem-gluten', fatias), o('tapioca', 30));

export const MODELOS: Record<Slot, ModeloRefeicao[]> = {
  cafe: [
    {
      itens: [
        item('carbo', o('pao-frances', 1), o('pao-sem-gluten', 2), o('tapioca', 40)),
        OVO_OU_TOFU(2),
        QUEIJO,
        item('carbo', o('mamao', 150), o('banana', 1)),
        CAFE,
      ],
    },
    {
      itens: [
        IOGURTE,
        item('carbo', o('aveia', 30), o('banana', 1)),
        item('carbo', o('banana', 1), o('mamao', 150)),
        item('gordura', o('pasta-amendoim', 15), o('castanha-para', 2), o('semente-girassol', 10)),
        OVO_OU_TOFU(2),
      ],
    },
    {
      itens: [item('carbo', o('tapioca', 40)), OVO_OU_TOFU(2), QUEIJO, LEITE, CAFE],
    },
    {
      itens: [
        item('carbo', o('cuscuz', 120)),
        OVO_OU_TOFU(2),
        item('carbo', o('banana', 1), o('maca', 1)),
        CAFE,
      ],
    },
  ],
  almoco: [
    {
      itens: [
        item('carbo', o('arroz', 120)),
        item('carbo', o('feijao', 90), o('lentilha', 90)),
        item('proteina', o('frango', 120), o('ovo', 3), o('tofu', 150)),
        LEGUMES,
        SALADA,
        AZEITE,
      ],
    },
    {
      itens: [
        item('carbo', o('arroz-integral', 120)),
        item('carbo', o('feijao', 90), o('lentilha', 90)),
        item('proteina', o('patinho', 100), o('proteina-soja', 100)),
        LEGUMES,
        SALADA,
      ],
    },
    {
      itens: [
        item('carbo', o('macarrao', 150), o('macarrao-arroz', 150)),
        item('proteina', o('patinho', 100), o('proteina-soja', 100)),
        LEGUMES,
        SALADA,
        AZEITE,
      ],
    },
    {
      itens: [
        item('proteina', o('tilapia', 150), o('frango', 120), o('tofu', 150)),
        item('carbo', o('batata-doce', 150), o('mandioca', 120)),
        item('carbo', o('feijao', 90), o('lentilha', 90)),
        SALADA,
        AZEITE,
      ],
    },
  ],
  lanche: [
    {
      itens: [IOGURTE, item('carbo', o('banana', 1), o('maca', 1)), OLEAGINOSA],
    },
    {
      itens: [PAO(2), OVO_OU_TOFU(2), item('carbo', o('maca', 1), o('laranja', 1))],
    },
    {
      itens: [
        PAO(2),
        item('proteina', o('atum', 60), o('frango', 60), o('grao-de-bico', 80)),
        item('carbo', o('laranja', 1), o('maca', 1)),
      ],
    },
    {
      itens: [
        item('carbo', o('banana', 1)),
        item('gordura', o('pasta-amendoim', 15), o('castanha-para', 2), o('semente-girassol', 10)),
        item('carbo', o('aveia', 20), o('maca', 1)),
        LEITE,
      ],
    },
  ],
  jantar: [
    {
      itens: [
        OVO_OU_TOFU(3),
        item('carbo', o('arroz', 100), o('mandioca', 100)),
        LEGUMES,
        SALADA,
        AZEITE,
      ],
    },
    {
      itens: [
        item('proteina', o('frango', 120), o('tofu', 150), o('grao-de-bico', 100)),
        item('carbo', o('batata-doce', 150), o('mandioca', 120)),
        LEGUMES,
        SALADA,
      ],
    },
    {
      itens: [
        item('proteina', o('tilapia', 150), o('frango', 120), o('ovo', 3), o('tofu', 150)),
        item('carbo', o('arroz', 100)),
        item('carbo', o('feijao', 80), o('lentilha', 80)),
        SALADA,
        AZEITE,
      ],
    },
    {
      itens: [
        item('proteina', o('patinho', 100), o('proteina-soja', 100)),
        item('carbo', o('mandioca', 120), o('batata-doce', 150)),
        LEGUMES,
        SALADA,
      ],
    },
  ],
  ceia: [
    { itens: [IOGURTE, item('carbo', o('aveia', 20), o('mamao', 100))] },
    { itens: [LEITE, item('carbo', o('banana', 1)), OLEAGINOSA] },
    {
      itens: [
        PAO(1),
        item(
          'proteina',
          o('queijo-branco', 30),
          o('queijo-sem-lactose', 30),
          o('ovo', 1),
          o('tofu', 60),
        ),
        item('livre', o('cafe', 100)),
      ],
    },
  ],
};
