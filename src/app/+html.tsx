import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * HTML da versão web (só roda no navegador e na geração estática; não existe
 * no app do celular). Tira o contorno de foco que o navegador desenha nos
 * campos de texto: cada campo do app já tem a própria pílula com borda.
 */
const CSS_GLOBAL = `
input:focus, textarea:focus { outline: none; }
`;

export default function Raiz({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: CSS_GLOBAL }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
