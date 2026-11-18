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

Deja los MP3 en `assets/` y añádelos a la lista en `config.js`

Se reproducen en ese orden y al acabar una pasa a la siguiente, volviendo a la
primera al final