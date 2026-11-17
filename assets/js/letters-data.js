(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  const letters = [
    // { id, title, text, photos, createdAt }  ·  los párrafos van con \n
    {
      id: 'carta-1',
      title: 'D',
      gate: true,
      createdAt: '2026-11-16T21:45:32',
      text: [
        'Kiara, llevo días pensando en cómo preguntarte esto y al final me he liado a escribirte una carta entera.',
        'Así que voy al grano: ¿me das la oportunidad de conocerte, cuidarte y hacerte reír? Prometo que no te vas a arrepentir.',
      ].join('\n'),
      photos: ['assets/photo.jpg'],
    },
    {
      id: 'carta-2',
      title: 'Hola, mi amor...',
      createdAt: '2026-11-16T22:00:00',
      text: [
        'Hola, mi amor...',
        'Solo queria recordarte lo especial que eres para mi y celebrar cada segundo que hemos compartido. Nuestro tiempo juntos ha sido un regalo maravilloso, lleno de risas, suenos y momentos que guardare por siempre en mi corazon.',
        'Cada dia a tu lado es una nueva aventura y una razon para sonreir. Eres la luz que ilumina mis dias. Gracias por tanto amor. Te quiero muchisimo.',
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
