# Kiara &lt;3

Quiza leas este repistorio o no, quiza te da curiosidad JAJAJA pero es unicamente para ti. 

Si alguien mas lee esto es un mas o menos como funciona el codigo que he usado para que se vea la pagina
tanto como la web hasta el como personalizar cada cosa.

## Verla en local

Doble clic en `index.html` o sírvela con cualquier servidor estático. No hay
build ni dependencias: el JS, el CSS y las tipografías están en `assets/`

## Estructura

```
index.html
assets/
  css/           styles.css y fonts.css (@font-face)
  js/            config, cartas, árbol, efectos, reproductor y flujo
  og-image.png   tarjeta que sale al compartir el enlace
  icon-180.png   icono para «añadir a inicio» en el móvil
  icon-192.png   mismo icono pero con el diferente tipo de ecosistema 
```

## Cambiar textos y colores

Casi todo esta en `assets/js/config.js`:

- `intro.label` y `intro.hint` — el texto grande de la portada y el subtítulo
- `palette` — colores de los corazones, petalos, flores, tronco y suelo
- `clickPhrases` — frases que salen al tocar la pantalla.
- `music` — la canción y el volumen.
- `tree` — medidas del árbol.

Las cartas estan en `assets/js/letters-data.js` cada una es del formato
`{ id, title, text, photos, createdAt }`.

## Música

El reproductor lo hice con un diseño de ventana flotante bastante simple y dinamico
aunque me hubiera gustado que tuviera una zona especifica para la misma

Deja los MP3 en `assets/` y añádelos a la lista en `assets/js/config.js`

Se reproducen en ese orden y al acabar una pasa a la siguiente, volviendo a la
primera al final

## En Netlify

La pagina no tiene build, asi que solo hay que conectar el repositorio:

1. Entra en netlify.com → **Add new site** → **Import an existing project**
2. Elige GitHub y el repositorio `website-para-kiara`
3. Build command: vacio. Publish directory: `.` (ya viene en `netlify.toml`)
4. **Deploy**. En un minuto la pagina esta en `https://algo.netlify.app`
5. Si quieres un nombre mas bonito: **Site settings → Change site name**

Cada `git push` a `main` vuelve a desplegar solo.

Si en caso deseas que la pagina sea indexada (Con derechos de autor) puedes eliminar el "noindex"
asi google lo reconocera

Para que las imagenes de previsualización funcionen al compartir hay que poner la URL completa del sitio
(ahora mismo apuntan a GitHub Pages):

```html
<meta property="og:image" content="https://TU-SITIO.netlify.app/assets/og-image.png">
<meta name="twitter:image" content="https://TU-SITIO.netlify.app/assets/og-image.png">
```

Un detalle del plan gratis de Netlify: cada deploy a produccion gasta creditos
(unos 20 al mes), asi que mejor agrupar los cambios en un push.