import {
  FORMULARIO_VAZIO,
  perfilParaFormulario,
  perfilSchema,
  type FormularioPerfilValores,
} from '../schema';

const VALIDO: FormularioPerfilValores = {
  nome: '  Luiz Henrique ',
  idade: '17',
  alturaCm: '175',
  pesoKg: '70,5',
  percentualGordura: '',
  restricoes: '',
  sexo: 'masculino',
  nivelAtividade: 'moderado',
  objetivo: 'ganhar',
};

// Atalho: valida e devolve a mensagem de erro de um campo (ou undefined)
function erroDe(campo: keyof FormularioPerfilValores, valor: string) {
  const resultado = perfilSchema.safeParse({ ...VALIDO, [campo]: valor });

  if (resultado.success) {
    return undefined;
  }

  return resultado.error.issues.find((issue) => issue.path[0] === campo)?.message;
}

describe('perfilSchema', () => {
  it('converte um formulário válido em Perfil com números', () => {
    const resultado = perfilSchema.parse(VALIDO);

    expect(resultado).toEqual({
      nome: 'Luiz Henrique',
      idade: 17,
      alturaCm: 175,
      pesoKg: 70.5,
      percentualGordura: undefined,
      restricoes: undefined,
      sexo: 'masculino',
      nivelAtividade: 'moderado',
      objetivo: 'ganhar',
    });
  });

  it('formulário vazio gera erro em todos os campos obrigatórios', () => {
    const resultado = perfilSchema.safeParse(FORMULARIO_VAZIO);

    expect(resultado.success).toBe(false);

    const camposComErro = resultado.error?.issues.map((issue) => issue.path[0]);

    expect(camposComErro).toEqual([
      'nome',
      'idade',
      'sexo',
      'alturaCm',
      'pesoKg',
      'nivelAtividade',
      'objetivo',
    ]);
  });

  describe('nome', () => {
    it('recusa só espaços', () => {
      expect(erroDe('nome', '   ')).toBe('Informe seu nome');
    });
  });

  describe('idade', () => {
    it('recusa decimal', () => {
      expect(erroDe('idade', '17,5')).toBe('Digite um número inteiro, ex: 17');
    });

    it('recusa fora da faixa', () => {
      expect(erroDe('idade', '8')).toBe('Deve estar entre 13 e 100 anos');
    });
  });

  describe('altura', () => {
    it('avisa quando a pessoa digita em metros', () => {
      expect(erroDe('alturaCm', '1,75')).toBe('Deve estar entre 100 e 250 cm');
    });

    it('recusa texto', () => {
      expect(erroDe('alturaCm', 'alto')).toBe('Digite um número, ex: 175');
    });

    it('aceita os limites exatos', () => {
      expect(erroDe('alturaCm', '100')).toBeUndefined();
      expect(erroDe('alturaCm', '250')).toBeUndefined();
    });
  });

  describe('peso', () => {
    it('recusa ponto sozinho (fechava o app na v1)', () => {
      expect(erroDe('pesoKg', '.')).toBe('Digite um número, ex: 70,5');
    });
  });

  describe('percentual de gordura (opcional)', () => {
    it('aceita vazio', () => {
      expect(erroDe('percentualGordura', '')).toBeUndefined();
    });

    it('valida quando preenchido', () => {
      expect(erroDe('percentualGordura', '90')).toBe('Deve estar entre 3 e 60 %');
    });

    it('converte quando válido', () => {
      const resultado = perfilSchema.parse({ ...VALIDO, percentualGordura: '18,5' });

      expect(resultado.percentualGordura).toBe(18.5);
    });
  });

  describe('restrições (opcional)', () => {
    it('guarda o texto sem espaços nas pontas', () => {
      const resultado = perfilSchema.parse({ ...VALIDO, restricoes: ' intolerância à lactose ' });

      expect(resultado.restricoes).toBe('intolerância à lactose');
    });
  });
});

describe('perfilParaFormulario', () => {
  it('faz o caminho inverso e volta a validar igual', () => {
    const perfil = perfilSchema.parse({ ...VALIDO, percentualGordura: '18,5' });

    const formulario = perfilParaFormulario(perfil);

    expect(formulario.pesoKg).toBe('70,5');
    expect(perfilSchema.parse(formulario)).toEqual(perfil);
  });
});
