import {
  alternarItemAquecimento,
  exercicioDeAquecimento,
  itemPadrao,
  medidaDoTexto,
  mudarMedidaAquecimento,
  OPCOES_AQUECIMENTO,
  passoAquecimento,
  soPorTempo,
  textoDaMedida,
  textoValorAquecimento,
} from '../aquecimento';
import { LIMITES_MONTADOR, type ItemAquecimento } from '../contratoIa';
import { exercicioSchema } from '../schema';

describe('medida do aquecimento', () => {
  it.each([
    ['15', { medida: 'repeticoes', valor: 15 }],
    ['8 a 12', { medida: 'repeticoes', valor: 8 }],
    ['5 min', { medida: 'tempo', valor: 5 }],
    ['10min', { medida: 'tempo', valor: 10 }],
    ['3 minutos', { medida: 'tempo', valor: 3 }],
    ['', { medida: 'repeticoes', valor: 15 }],
  ])('"%s" vira %j', (texto, esperado) => {
    expect(medidaDoTexto(texto)).toEqual(esperado);
  });

  it('volta para o texto salvo no exercício', () => {
    expect(textoDaMedida('repeticoes', 15)).toBe('15');
    expect(textoDaMedida('tempo', 5)).toBe('5 min');
  });

  it('bike e esteira são só por tempo; corrida no lugar e polichinelo não', () => {
    expect(soPorTempo('bike leve')).toBe(true);
    expect(soPorTempo('Esteira leve')).toBe(true);
    expect(soPorTempo('bicicleta ergométrica')).toBe(true);
    expect(soPorTempo('corrida no lugar')).toBe(false);
    expect(soPorTempo('polichinelo')).toBe(false);
  });

  it('o catálogo tem várias opções de aquecimento', () => {
    expect(OPCOES_AQUECIMENTO).toEqual(
      expect.arrayContaining(['polichinelo', 'agachamento sem peso', 'bike leve']),
    );
  });
});

describe('itens do aquecimento', () => {
  it('item novo vem com a medida do catálogo', () => {
    expect(itemPadrao('polichinelo')).toEqual({
      nome: 'polichinelo',
      medida: 'repeticoes',
      valor: 20,
    });
    expect(itemPadrao('bike leve')).toEqual({ nome: 'bike leve', medida: 'tempo', valor: 5 });
    expect(itemPadrao('Pular no lugar')).toMatchObject({ medida: 'repeticoes' });
  });

  it('marca vários e desmarca, até o limite', () => {
    let itens: ItemAquecimento[] = [];
    itens = alternarItemAquecimento(itens, 'polichinelo');
    itens = alternarItemAquecimento(itens, 'bike leve');
    expect(itens.map((item) => item.nome)).toEqual(['polichinelo', 'bike leve']);

    expect(alternarItemAquecimento(itens, 'polichinelo').map((item) => item.nome)).toEqual([
      'bike leve',
    ]);

    const cheio = OPCOES_AQUECIMENTO.slice(0, LIMITES_MONTADOR.itensAquecimento).reduce(
      alternarItemAquecimento,
      [] as ItemAquecimento[],
    );
    expect(
      alternarItemAquecimento(cheio, OPCOES_AQUECIMENTO[LIMITES_MONTADOR.itensAquecimento]),
    ).toHaveLength(LIMITES_MONTADOR.itensAquecimento);
  });

  it('troca repetições por tempo, mas bike continua por tempo', () => {
    const itens = [itemPadrao('polichinelo'), itemPadrao('bike leve')];
    const trocados = mudarMedidaAquecimento(itens, 'polichinelo', 'tempo');

    expect(trocados[0]).toEqual({ nome: 'polichinelo', medida: 'tempo', valor: 3 });
    expect(mudarMedidaAquecimento(itens, 'bike leve', 'repeticoes')[1]).toBe(itens[1]);
    expect(mudarMedidaAquecimento(trocados, 'polichinelo', 'repeticoes')[0].valor).toBe(20);
  });

  it('o passo é de 5 repetições ou 1 minuto, dentro dos limites', () => {
    const reps: ItemAquecimento[] = [{ nome: 'polichinelo', medida: 'repeticoes', valor: 12 }];
    expect(passoAquecimento(reps, 'polichinelo', 1)[0].valor).toBe(15);
    expect(passoAquecimento(reps, 'polichinelo', -1)[0].valor).toBe(10);

    const tempo: ItemAquecimento[] = [{ nome: 'bike leve', medida: 'tempo', valor: 1 }];
    expect(passoAquecimento(tempo, 'bike leve', -1)[0].valor).toBe(1);
    expect(passoAquecimento(tempo, 'bike leve', 1)[0].valor).toBe(2);

    const maximo: ItemAquecimento[] = [
      { nome: 'bike leve', medida: 'tempo', valor: LIMITES_MONTADOR.minutosAquecimento.max },
    ];
    expect(passoAquecimento(maximo, 'bike leve', 1)[0].valor).toBe(
      LIMITES_MONTADOR.minutosAquecimento.max,
    );
  });

  it('vira exercício válido: "15" ou "5 min", uma série', () => {
    const porReps = exercicioDeAquecimento({
      nome: 'polichinelo',
      medida: 'repeticoes',
      valor: 15,
    });
    const porTempo = exercicioDeAquecimento({ nome: 'polichinelo', medida: 'tempo', valor: 2 });
    // Bike salva por repetições (dado antigo) sai por tempo
    const bike = exercicioDeAquecimento({ nome: 'bike leve', medida: 'repeticoes', valor: 5 });

    expect(porReps).toEqual({
      nome: 'polichinelo',
      grupo: 'aquecimento',
      series: 1,
      repeticoes: '15',
    });
    expect(porTempo.repeticoes).toBe('2 min');
    expect(bike.repeticoes).toBe('5 min');

    for (const exercicio of [porReps, porTempo, bike]) {
      expect(
        exercicioSchema.safeParse({
          ...exercicio,
          series: String(exercicio.series),
          grupo: exercicio.grupo ?? '',
          cargaKg: '',
          observacao: '',
        }).success,
      ).toBe(true);
    }
  });

  it('texto do valor no singular e no plural', () => {
    expect(textoValorAquecimento({ nome: 'x', medida: 'tempo', valor: 1 })).toBe('1 minuto');
    expect(textoValorAquecimento({ nome: 'x', medida: 'tempo', valor: 5 })).toBe('5 minutos');
    expect(textoValorAquecimento({ nome: 'x', medida: 'repeticoes', valor: 15 })).toBe(
      '15 repetições',
    );
  });
});
