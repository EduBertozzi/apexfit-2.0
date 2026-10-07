export type Ponto = { x: number; y: number };

/**
 * `quantidade` pontos espalhados por igual num círculo de raio `distancia`,
 * começando no topo e seguindo no sentido horário. Usado nos pontinhos da comemoração.
 */
export function pontosEmCirculo(quantidade: number, distancia: number): Ponto[] {
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return [];
  }

  const total = Math.floor(quantidade);
  const arredondar = (n: number) => Math.round(n * 1000) / 1000 + 0;

  return Array.from({ length: total }, (_, indice) => {
    const angulo = (indice / total) * Math.PI * 2 - Math.PI / 2;

    return {
      x: arredondar(Math.cos(angulo) * distancia),
      y: arredondar(Math.sin(angulo) * distancia),
    };
  });
}
