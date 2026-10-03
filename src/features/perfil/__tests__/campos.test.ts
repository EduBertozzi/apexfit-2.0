import { ETAPAS_ONBOARDING, SECOES_EDICAO, type Etapa } from '../campos';
import { FORMULARIO_VAZIO } from '../schema';

const TODOS_OS_CAMPOS = Object.keys(FORMULARIO_VAZIO).sort();

function camposDe(etapas: Etapa[]) {
  return etapas.flatMap((etapa) => etapa.campos);
}

describe.each([
  ['onboarding', ETAPAS_ONBOARDING],
  ['edição', SECOES_EDICAO],
])('etapas de %s', (_, etapas) => {
  it('pedem todos os campos do perfil', () => {
    expect([...camposDe(etapas)].sort()).toEqual(TODOS_OS_CAMPOS);
  });

  it('não repetem campo', () => {
    const campos = camposDe(etapas);

    expect(new Set(campos).size).toBe(campos.length);
  });
});

describe('ETAPAS_ONBOARDING', () => {
  it('não usa emoji nem travessão nos textos', () => {
    const textos = ETAPAS_ONBOARDING.flatMap((etapa) => [etapa.titulo, etapa.descricao]).join(' ');

    expect(textos).not.toMatch(/[—–]/);
    expect(textos).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
