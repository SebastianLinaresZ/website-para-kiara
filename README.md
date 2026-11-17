# Kiara &lt;3

Web de dedicatoria. Empieza con un corazón que hay que tocar, sigue con una
pregunta que no se puede saltar (el «No» acaba escapándose por la pantalla) y,
al decir que sí, crece un árbol de corazones con un contador que arranca en
ese mismo instante. Dentro está la carta y las que vengan después.

## Verla en local

Doble clic en `index.html` o sírvela con cualquier servidor estático. No hay
build ni dependencias: el JS, el CSS y las tipografías están en `assets/`.

## Estructura

```
index.html
assets/
  css/           styles.css y fonts.css (@font-face)
  fonts/         Quicksand, Nunito y Pacifico
  js/            config, cartas, árbol, efectos, reproductor y flujo
  photo.jpg      foto de la carta
  og-image.png   tarjeta que sale al compartir el enlace
  icon-180.png   icono para «añadir a inicio» en el móvil
  icon-192.png
  Corazón.mp3    canciones de la playlist
  Volare.mp3
```

## Cambiar textos y colores

Casi todo está en `assets/js/config.js`:

- `intro.label` y `intro.hint` — el texto grande de la portada y el subtítulo.
  El subtítulo se muestra en mayúsculas por CSS; si lo quieres tal cual lo
  escribes, quita `text-transform: uppercase` de `.intro__hint` en
  `assets/css/styles.css`.
- `gate.*` — textos de la pregunta, mensajes del «No», en qué clic empieza a
  escapar, a cuántos desaparece y el enlace del vídeo (`gate.noVanishUrl`).
- `palette` — colores de los corazones, pétalos, flores, tronco y suelo.
- `clickPhrases` — frases que salen al tocar la pantalla.
- `music` — la canción y el volumen.
- `tree` — medidas del árbol.

El texto que trae el HTML es solo un valor por defecto: al cargar manda lo que
pongas en `config.js`.

Las cartas están en `assets/js/letters-data.js`. Cada una es
`{ id, title, text, photos, createdAt }`, con los párrafos separados por `\n`.
El editor de cartas desde la web está desactivado (`letters.editable: false`).

## El estado

La respuesta, la hora del «sí» y los clics al «No» se guardan en el
`localStorage` del navegador, así que cada dispositivo empieza de cero. Para
repetir la experiencia desde el principio, abre la página con `?reset` al final
de la URL.

## Música

El reproductor es la isla flotante de abajo: anterior, play/pausa, siguiente,
barra de progreso (se puede tocar o arrastrar) y control de volumen. Solo
aparece si hay canciones.

Deja los MP3 en `assets/music/` y añádelos a la lista en `assets/js/config.js`:

```js
music: {
  volume: 0.5,
  tracks: [
    { title: 'Corazón', src: 'assets/Corazón.mp3' },
    { title: 'Volare', src: 'assets/Volare.mp3' },
  ],
},
```

Se reproducen en ese orden y al acabar una pasa a la siguiente, volviendo a la
primera al final. Con la lista vacía no se muestra nada.

## En GitHub Pages

Sube la carpeta tal cual (el `.gitignore` deja fuera lo que no hace falta) y en
el repo: **Settings → Pages → Deploy from a branch → main / (root)**. El
`.nojekyll` ya está puesto.

La página queda pública para quien tenga el enlace, aunque lleva `noindex` para
que no la indexe Google.

**Un ajuste al publicar:** `og:image` y `twitter:image` apuntan a
`assets/og-image.png` con ruta relativa. WhatsApp y Twitter piden URL absoluta,
así que cuando tengas la dirección final cámbialas por la completa:

```html
<meta property="og:image" content="https://TU-USUARIO.github.io/TU-REPO/assets/og-image.png">
<meta name="twitter:image" content="https://TU-USUARIO.github.io/TU-REPO/assets/og-image.png">
```

La tarjeta se genera desde `tools/og-card.html` y el icono desde
`tools/app-icon.html` (se abren en el navegador y se capturan a 1200×630 y
180×180).
