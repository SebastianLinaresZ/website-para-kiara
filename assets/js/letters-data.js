(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  const letters = [
    // { id, title, text, photos, createdAt }  ·  los párrafos van con \n
    {
      id: 'carta-1',
      title: 'Y ahora con que voy a soñar si fui tan feliz despierto?',
      gate: true,
      createdAt: '2026-11-16T21:45:32',
      text: [
        'Kiara, creo que ya sabes por dónde va esto, pero aun así me gustaría que lo leas hasta el final. Ha pasado mucho tiempo desde la primera vez que pensé que me gustabas, y ese sentimiento volvió con fuerza cuando nos reencontramos aquel mes de junio. Te soy sincero: fui muy feliz viéndote ese mes, aunque haya sido pocas veces.',
        'Aún me parece un poco irreal pensar que he llegado a este punto contigo. No sé con certeza si tú sientes lo mismo (quiero suponer que sí, jaja, o al menos eso espero). Sin dar tantos rodeos, después de estos 5 meses en los que hemos hablado muchísimo, siento que por fin empiezo a saber quién es Kiara de verdad. Sé que aún me falta mucho por descubrir de ti, pero quiero seguir conociéndote estando a tu lado y siendo alguien cercano. Sé que tenemos cosas en contra, especialmente algo tan inmenso como la distancia. Esperarte no será fácil, pero sabiendo a quién espero, la verdad es que tampoco será difícil.',
        'Kiara, con el corazón en la mano y unas ganas inmensas de estar contigo: ¿Me darías la oportunidad de vivir, compartir y crear recuerdos juntos, abriendo la puerta a un futuro donde podamos crecer tanto individualmente como en pareja?'
      ].join('\n'),
      photos: ['assets/photo.jpg'],
    },
  ];

  LOVE.lettersData = {
    defaults: letters,

    gate() {
      return letters.find((letter) => letter.gate) || letters[0];
    },

    previewOf(letter) {
      if (letter.preview) return letter.preview;

      const lines = String(letter.text || '')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      const title = String(letter.title || '').trim().toLowerCase();
      if (lines.length > 1 && title && lines[0].toLowerCase() === title) lines.shift();

      const preview = lines.join(' ').replace(/\s+/g, ' ').trim();
      return preview.slice(0, 90) || 'Una carta para ti';
    },
  };
})(window);
