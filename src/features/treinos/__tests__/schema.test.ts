import {
  EXERCICIO_VAZIO,
  exercicioParaFormulario,
  exercicioSchema,
  treinoParaFormulario,
  treinoSchema,
  type FormularioExercicioValores,
} from '../schema';

const VALIDO: FormularioExercicioValores = {
  nome: '  Supino reto ',
  series: '3',
  repeticoes: '10',
  cargaKg: '40',
  observacao: '',
};

function erroDe(campo: keyof FormularioExercicioValores, valor: string) {
  const resultado = exercicioSchema.safeParse({ ...VALIDO, [campo]: valor });

  if (resultado.success) {
    return undefined;
  }

  return resultado.error.issues.find((issue) => issue.path[0] === campo)?.message;
}

function repeticoes(valor: string) {
  return exercicioSchema.parse({ ...VALIDO, repeticoes: valor }).repeticoes;
}

describe('exercicioSchema', () => {
  it('converte o formulário em exercício com números', () => {
    expect(exercicioSchema.parse(VALIDO)).toEqual({
      nome: 'Supino reto',
      series: 3,
      repeticoes: '10',
      cargaKg: 40,
      observacao: undefined,
    });
  });

  it('o formulário vazio padrão só reclama do nome', () => {
    const resultado = exercicioSchema.safeParse(EXERCICIO_VAZIO);

    expect(resultado.error?.issues.map((issue) => issue.path[0])).toEqual(['nome']);
  });

  it('nome obrigatório', () => {
    expect(erroDe('nome', ' ')).toBe('Informe o nome do exercício');
  });

  describe('séries', () => {
    it('obrigatório e inteiro', () => {
      expect(erroDe('series', '')).toBe('Informe as séries');
      expect(erroDe('series', '3,5')).toBe('Digite um número inteiro, ex: 3');
    });

    it('dentro da faixa', () => {
      expect(erroDe('series', '0')).toBe('Deve estar entre 1 e 20 séries');
      expect(erroDe('series', '21')).toBe('Deve estar entre 1 e 20 séries');
      expect(erroDe('series', '20')).toBeUndefined();
    });
  });

  describe('repetições', () => {
    it('aceita número único', () => {
      expect(repeticoes(' 12 ')).toBe('12');
    });

    it('padroniza a faixa como "8 a 12"', () => {
      expect(repeticoes('8 a 12')).toBe('8 a 12');
      expect(repeticoes('8-12')).toBe('8 a 12');
      expect(repeticoes('8 - 12')).toBe('8 a 12');
      expect(repeticoes('8 até 12')).toBe('8 a 12');
      expect(repeticoes('8 \u2013 12')).toBe('8 a 12');
      expect(repeticoes('8 A 12')).toBe('8 a 12');
    });

    it('recusa texto solto', () => {
      expect(erroDe('repeticoes', 'muitas')).toBe('Use um número ou uma faixa, ex: 10 ou 8 a 12');
      expect(erroDe('repeticoes', '')).toBe('Informe as repetições');
    });

    it('recusa faixa invertida ou fora do limite', () => {
      expect(erroDe('repeticoes', '12 a 8')).toBe(
        'Na faixa, o segundo número é o maior, ex: 8 a 12',
      );
      expect(erroDe('repeticoes', '10 a 10')).toBe(
        'Na faixa, o segundo número é o maior, ex: 8 a 12',
      );
      expect(erroDe('repeticoes', '0')).toBe('Deve estar entre 1 e 100 repetições');
      expect(erroDe('repeticoes', '10 a 150')).toBe('Deve estar entre 1 e 100 repetições');
    });
  });

  describe('carga (opcional)', () => {
    it('vazio vira undefined', () => {
      expect(exercicioSchema.parse({ ...VALIDO, cargaKg: '  ' }).cargaKg).toBeUndefined();
    });

    it('aceita vírgula decimal', () => {
      expect(exercicioSchema.parse({ ...VALIDO, cargaKg: '22,5' }).cargaKg).toBe(22.5);
    });

    it('recusa texto e fora da faixa', () => {
      expect(erroDe('cargaKg', 'pesado')).toBe('Digite um número, ex: 22,5');
      expect(erroDe('cargaKg', '501')).toBe('Deve estar entre 0 e 500 kg');
    });
  });

  it('observação: corta espaços e limita o tamanho', () => {
    expect(exercicioSchema.parse({ ...VALIDO, observacao: ' devagar ' }).observacao).toBe(
      'devagar',
    );
    expect(erroDe('observacao', 'x'.repeat(141))).toBe('Use no máximo 140 caracteres');
  });
});

describe('exercicioParaFormulario', () => {
  it('faz o caminho inverso e volta a validar igual', () => {
    const exercicio = exercicioSchema.parse({ ...VALIDO, cargaKg: '22,5', repeticoes: '8-12' });

    const formulario = exercicioParaFormulario({ ...exercicio, id: 'x' });

    expect(formulario.cargaKg).toBe('22,5');
    expect(formulario.repeticoes).toBe('8 a 12');
    expect(exercicioSchema.parse(formulario)).toEqual(exercicio);
  });

  it('carga ausente vira campo vazio', () => {
    const formulario = exercicioParaFormulario({
      id: 'x',
      nome: 'Flexão',
      series: 3,
      repeticoes: '15',
    });

    expect(formulario).toEqual({
      nome: 'Flexão',
      series: '3',
      repeticoes: '15',
      cargaKg: '',
      observacao: '',
    });
  });
});

describe('treinoSchema', () => {
  it('valida nome e deixa o foco opcional', () => {
    expect(treinoSchema.parse({ nome: ' Treino A ', foco: '' })).toEqual({
      nome: 'Treino A',
      foco: undefined,
    });
    expect(treinoSchema.parse({ nome: 'Treino A', foco: ' Pernas ' }).foco).toBe('Pernas');
  });

  it('nome obrigatório e curto', () => {
    const vazio = treinoSchema.safeParse({ nome: '  ', foco: '' });
    const longo = treinoSchema.safeParse({ nome: 'x'.repeat(31), foco: '' });

    expect(vazio.error?.issues[0].message).toBe('Dê um nome ao treino, ex: Treino A');
    expect(longo.error?.issues[0].message).toBe('Use no máximo 30 caracteres');
  });

  it('treinoParaFormulario', () => {
    expect(treinoParaFormulario({ id: 'a', nome: 'Treino A', exercicios: [] })).toEqual({
      nome: 'Treino A',
      foco: '',
    });
  });
});
