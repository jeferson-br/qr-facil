# QR Fácil

Gerador de QR Codes gratuito, feito com HTML5, CSS3 e JavaScript puro.

## Estrutura
```
index.html
css/style.css
js/script.js
README.md
```

## Dependência
- **qrcodejs 1.0.0** (David Shim) — https://github.com/davidshimjs/qrcodejs
  Carregada via CDN: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`
  Métodos usados: `new QRCode(elemento, { text, width, height, colorDark, colorLight, correctLevel })` e `QRCode.CorrectLevel.M`. A biblioteca desenha em `<canvas>`, que é exportado em PNG com `canvas.toDataURL()`.
  Para uso offline, baixe o arquivo, salve em `js/qrcode.min.js` e troque o `src` no `index.html`.

## Executar localmente
Abra `index.html` no navegador (precisa de internet para a biblioteca). Ou rode um servidor simples:
```
python3 -m http.server 8000
```
e acesse http://localhost:8000.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie estes arquivos para a raiz da branch `main`.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Em alguns minutos o site estará em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Privacidade
Nada é enviado a servidores. O `localStorage` guarda apenas preferências de cor/tamanho e os últimos 8 QR Codes.
"# qr-facil" 
