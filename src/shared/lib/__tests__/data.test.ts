import { chaveDoDia, dataPorExtenso, diasEntre } from '../data';

describe('dataPorExtenso', () => {
  it('só a primeira letra maiúscula', () => {
    expect(dataPorExtenso(new Date(2026, 9, 2))).toBe('Sexta-feira, 2 de outubro');
  });
});

describe('chaveDoDia', () => {
  it('formata com zeros à esquerda', () => {
    expect(chaveDoDia(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('usa o dia local, mesmo tarde da noite', () => {
    expect(chaveDoDia(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
  });
});

describe('diasEntre', () => {
  it('conta dias atravessando o mês', () => {
    expect(diasEntre('2026-09-28', '2026-10-02')).toBe(4);
  });

  it('é zero para o mesmo dia', () => {
    expect(diasEntre('2026-10-02', '2026-10-02')).toBe(0);
  });
});
