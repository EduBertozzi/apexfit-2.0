import { deveVibrar } from '../vibracao';

describe('deveVibrar', () => {
  it('vibra no celular com a opção ligada', () => {
    expect(deveVibrar(true, 'ios')).toBe(true);
    expect(deveVibrar(true, 'android')).toBe(true);
  });

  it('não vibra com a opção desligada', () => {
    expect(deveVibrar(false, 'ios')).toBe(false);
  });

  it('não vibra no navegador', () => {
    expect(deveVibrar(true, 'web')).toBe(false);
  });
});
