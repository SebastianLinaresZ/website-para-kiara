window.LOVE_CONFIG = {
  intro: {
    label: 'Dale click, Kiara',
    hint: 'cada que veas esta pagina piensa que fue hecha porque te quiero',
  },

  gate: {
    eyebrow: 'Antes de que veas lo que hice para ti',
    yes: 'Sí',
    no: 'No',
    noReplies: [
      'Mmmm? Es el si por si acaso',
      'Eres ciega? El boton esta a lado',
      'Perdiendo aura',
      'Hay que alejarlo de tu alcanze',
      '🤡🫵🤡🫵🤡🫵',
      'El sarcasmo paso de moda hace mucho btw',
      'Tocara bloquearte ni modo',
      'Pulsa el no una vez mas... Y te juro que...',
    ],
    noDodgeFrom: 4,
    noVanishAfter: 8,
    noVanishUrl: 'https://youtu.be/dElRVQFqj-k?t=65',
    noVanishMessage: 'Ya te roge... ahora solo que da el si',
  },

  letters: {
    // ponlo a true para recuperar el botón de escribir cartas
    editable: false,
  },

  palette: {
    hearts: ['#a78bfa', '#c4b5fd', '#8b5cf6', '#38bdf8', '#7dd3fc', '#60a5fa', '#818cf8', '#0ea5e9'],
    petals: ['#c4b5fd', '#bae6fd', '#ddd6fe'],
    blooms: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7dd3fc', '#38bdf8', '#bae6fd', '#ddd6fe', '#818cf8'],
    trunk: 'rgb(96, 72, 158)',
    ground: 'rgb(59, 29, 120)',
  },

  clickBurstCount: 8,
  animation: { clickFallDuration: 7 },
  clickBurst: { distance: { min: 60, max: 95 }, wind: { min: 250, max: 450 } },

  clickPhrases: [
    'Te quiero',
    'Gu nai',
    'Kiauraaaaa',
    'Sera bonito verte de nuevo',
    'Gracias por acompañarme',
    'Contigo no todo es malo',
    'Sebastian hizo esto',
    'Recuerda decirme te quiero',
    'WAZAAAAAAAAAAA'
  ],

  petal: {
    frequency: 1100,
    duration: { min: 9, max: 13 },
  },

  initialDelay: 700,

  fallbackStartDate: '2026-04-20T00:50:00',

  music: {
    volume: 0.15,
    tracks: [
      { title: 'Corazón', src: 'assets/Corazón.mp3' },
      { title: 'Volare', src: 'assets/Volare.mp3' },
    ],
  },

  tree: {
    width: 1100,
    height: 680,

    seed: {
      x: 530,
      y: 340,
      color: 'rgb(124, 58, 237)',
      scaleDesktop: 2,
      scaleMobile: 2.55,
      textScaleDesktop: 1,
      textScaleMobile: 1.55,
      text: 'Dale click, Kiara',
    },

    // [x1, y1, x2, y2, x3, y3, grosor, longitud, [ramas hijas]]
    branch: [
      [535, 680, 570, 250, 500, 200, 30, 100, [
        [540, 500, 455, 417, 340, 400, 13, 100, [
          [450, 435, 434, 430, 394, 395, 2, 40],
        ]],
        [550, 445, 600, 356, 680, 345, 12, 100, [
          [578, 400, 648, 409, 661, 426, 3, 80],
        ]],
        [539, 281, 537, 248, 534, 217, 3, 40],
        [546, 397, 413, 247, 328, 244, 9, 80, [
          [427, 286, 383, 253, 371, 205, 2, 40],
          [498, 345, 435, 315, 395, 330, 4, 60],
        ]],
        [546, 357, 608, 252, 678, 221, 6, 100, [
          [590, 293, 646, 277, 648, 271, 2, 80],
        ]],
      ]],
    ],

    bloom: {
      num: 700,
      width: 1080,
      height: 650,
      radius: 240,
      centerYOffset: 0,
      startScale: 0.1,
      growth: 0.1,
      maxScale: 1,
      margin: 20,
    },

    footer: { width: 1200, height: 5, speed: 10 },

    desktopShift: 260,
  },
};
