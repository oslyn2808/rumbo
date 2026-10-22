// ACCESO A DATOS: catalogo de destinos de Costa Rica (datos estaticos).
// "scene" decide la ilustracion del frontend: beach | volcano | cloudforest | jungle.
// "typicalTempC" es una temperatura de referencia (se usa solo si no hay datos de clima en vivo).
export const DESTINATIONS = [
  {
    id: 'tamarindo',
    name: 'Tamarindo',
    region: 'Guanacaste',
    categories: ['playas', 'aventura'],
    scene: 'beach',
    lat: 10.2993,
    lon: -85.8371,
    typicalTempC: 31,
    tagline: 'Playa y surf',
    description:
      'Pueblo costero del Pacífico norte con olas constantes para aprender o mejorar en surf, atardeceres abiertos y una oferta de restaurantes frente al mar.',
    highlights: [
      'Clase de surf en Playa Tamarindo',
      'Atardecer desde la playa',
      'Playa Grande y el Parque Nacional Marino Las Baulas',
      'Paseo en velero al caer la tarde',
    ],
    bestTime: 'Diciembre a abril es la temporada seca, con más sol y menos lluvia.',
  },
  {
    id: 'monteverde',
    name: 'Monteverde',
    region: 'Puntarenas',
    categories: ['naturaleza', 'aventura'],
    scene: 'cloudforest',
    lat: 10.3009,
    lon: -84.8255,
    typicalTempC: 20,
    tagline: 'Bosque nuboso',
    description:
      'Zona de montaña envuelta en neblina, con reservas de bosque nuboso, puentes colgantes y una gran variedad de aves y orquídeas.',
    highlights: [
      'Caminata en la Reserva Biológica Bosque Nuboso Monteverde',
      'Puentes colgantes y canopy',
      'Caminata nocturna con guía',
      'Café de la zona en Santa Elena',
    ],
    bestTime: 'Noviembre a abril suele tener menos lluvia; lleva siempre impermeable.',
  },
  {
    id: 'arenal',
    name: 'Arenal',
    region: 'Alajuela',
    categories: ['volcanes', 'aventura'],
    scene: 'volcano',
    lat: 10.4678,
    lon: -84.6427,
    typicalTempC: 27,
    tagline: 'Volcán y termas',
    description:
      'La Fortuna y el volcán Arenal concentran aguas termales, cataratas, el lago Arenal y actividades de aventura como rafting y senderismo.',
    highlights: [
      'Caminata con vista al volcán Arenal',
      'Aguas termales al atardecer',
      'Catarata Río Fortuna',
      'Paseo en bote por el lago Arenal',
    ],
    bestTime: 'Diciembre a abril es la época más seca; el volcán se ve mejor con cielo despejado.',
  },
  {
    id: 'santa-teresa',
    name: 'Santa Teresa',
    region: 'Puntarenas',
    categories: ['playas', 'aventura'],
    scene: 'beach',
    lat: 9.6461,
    lon: -85.1688,
    typicalTempC: 30,
    tagline: 'Surf, yoga y tranquilidad',
    description:
      'Costa de la península de Nicoya conocida por el surf, el yoga y un ambiente relajado, con calles de tierra, cafés y playas largas.',
    highlights: [
      'Surf al amanecer',
      'Clase de yoga frente al mar',
      'Cascada de Montezuma',
      'Atardecer en la playa con cena local',
    ],
    bestTime: 'La temporada seca va de diciembre a abril; el oleaje varía durante el año.',
  },
  {
    id: 'manuel-antonio',
    name: 'Manuel Antonio',
    region: 'Puntarenas',
    categories: ['playas', 'naturaleza'],
    scene: 'jungle',
    lat: 9.3925,
    lon: -84.1365,
    typicalTempC: 29,
    tagline: 'Selva y playa',
    description:
      'Parque nacional pequeño donde la selva llega hasta la arena, con senderos, playas tranquilas y fauna como monos y perezosos.',
    highlights: [
      'Recorrido guiado en el Parque Nacional Manuel Antonio',
      'Playa Espadilla Sur',
      'Observación de fauna con guía',
      'Mirador al atardecer',
    ],
    bestTime: 'El parque suele cerrar un día a la semana; verifica horarios y cupo antes de ir.',
  },
  {
    id: 'tortuguero',
    name: 'Tortuguero',
    region: 'Limón',
    categories: ['naturaleza'],
    scene: 'jungle',
    lat: 10.5407,
    lon: -83.5029,
    typicalTempC: 28,
    tagline: 'Canales y tortugas',
    description:
      'Parque nacional del Caribe norte al que se llega en bote o avioneta, famoso por sus canales, su biodiversidad y la anidación de tortugas.',
    highlights: [
      'Recorrido en bote por los canales',
      'Caminata guiada por el parque nacional',
      'Visita al pueblo de Tortuguero',
      'Tour nocturno de tortugas en temporada, con guía autorizado',
    ],
    bestTime: 'Llueve durante casi todo el año; la anidación depende de la especie y la temporada.',
  },
  {
    id: 'puerto-viejo',
    name: 'Puerto Viejo',
    region: 'Limón',
    categories: ['playas'],
    scene: 'beach',
    lat: 9.6560,
    lon: -82.7544,
    typicalTempC: 28,
    tagline: 'Caribe sur',
    description:
      'Pueblo del Caribe sur con influencia afrocaribeña, playas de arena oscura y blanca, bicicleta como transporte y cocina con coco y especias.',
    highlights: [
      'Bicicleta hasta Playa Cocles',
      'Cocina caribeña local',
      'Visita al Parque Nacional Cahuita',
      'Playa Punta Uva',
    ],
    bestTime: 'Su clima difiere del Pacífico: febrero a abril y setiembre a octubre suelen ser menos lluviosos.',
  },
  {
    id: 'rincon-de-la-vieja',
    name: 'Rincón de la Vieja',
    region: 'Guanacaste',
    categories: ['volcanes', 'aventura'],
    scene: 'volcano',
    lat: 10.8300,
    lon: -85.3240,
    typicalTempC: 26,
    tagline: 'Fumarolas y senderos',
    description:
      'Parque nacional con un volcán activo, fumarolas, pozas de barro, cataratas y senderos entre bosque seco y bosque nuboso.',
    highlights: [
      'Sendero de fumarolas y pozas de barro',
      'Catarata en el parque nacional',
      'Termas y baños de barro',
      'Tirolesa en la zona',
    ],
    bestTime: 'Las mañanas despejan más; el acceso al cráter depende de la actividad volcánica.',
  },
  {
    id: 'poas',
    name: 'Volcán Poás',
    region: 'Alajuela',
    categories: ['volcanes'],
    scene: 'volcano',
    lat: 10.1980,
    lon: -84.2330,
    typicalTempC: 14,
    tagline: 'Cráter activo',
    description:
      'Parque nacional con un cráter activo cercano a San José. El acceso se regula por seguridad: reserva entrada y revisa el estado del parque antes de salir.',
    highlights: [
      'Mirador del cráter, si el parque está abierto',
      'Sendero de la laguna Botos',
      'Fresas y café en la ruta de subida',
      'Visita a las cataratas de La Paz',
    ],
    bestTime: 'Ve temprano: por la tarde la neblina suele tapar el cráter.',
  },
  {
    id: 'irazu',
    name: 'Volcán Irazú',
    region: 'Cartago',
    categories: ['volcanes'],
    scene: 'volcano',
    lat: 9.9795,
    lon: -83.8520,
    typicalTempC: 11,
    tagline: 'El más alto',
    description:
      'Es el volcán activo más alto del país. Su cráter con laguna de color verdoso se visita con carretera hasta cerca de la cima.',
    highlights: [
      'Mirador del cráter principal',
      'Vista del Caribe y del Pacífico en días despejados',
      'Basílica de Los Ángeles en Cartago',
      'Ruinas de Cartago',
    ],
    bestTime: 'Sube temprano y abrígate: hace frío y la niebla llega pronto.',
  },
  {
    id: 'jaco',
    name: 'Jacó',
    region: 'Puntarenas',
    categories: ['playas', 'aventura'],
    scene: 'beach',
    lat: 9.6150,
    lon: -84.6290,
    typicalTempC: 31,
    tagline: 'Surf cerca de la capital',
    description:
      'Ciudad playera del Pacífico central a unas dos horas de San José, con olas para surf, vida nocturna y acceso rápido a otras playas.',
    highlights: [
      'Clase de surf en Playa Jacó',
      'Playa Hermosa y sus olas',
      'Cascada Manantial de Agua Viva',
      'Cena frente al mar',
    ],
    bestTime: 'Diciembre a abril es la temporada seca; los fines de semana hay más gente.',
  },
  {
    id: 'corcovado',
    name: 'Corcovado',
    region: 'Península de Osa',
    categories: ['naturaleza', 'aventura'],
    scene: 'jungle',
    lat: 8.5380,
    lon: -83.5970,
    typicalTempC: 28,
    tagline: 'Selva en estado puro',
    description:
      'Parque nacional de la península de Osa con una de las selvas más biodiversas del país. El ingreso requiere guía autorizado y reserva previa.',
    highlights: [
      'Caminata guiada en el Parque Nacional Corcovado',
      'Bahía Drake y su costa',
      'Observación de aves y fauna',
      'Snorkel en la Isla del Caño, con tour autorizado',
    ],
    bestTime: 'Diciembre a abril es la época más seca; reserva con anticipación.',
  },
];

export function listDestinations() {
  return DESTINATIONS;
}

export function findDestination(id) {
  return DESTINATIONS.find((d) => d.id === id) ?? null;
}

// Ruta sugerida que se muestra en el inicio (sin IA).
export const FEATURED_ROUTE = {
  id: 'guanacaste-monteverde-arenal',
  title: 'Ruta de 3 días',
  label: 'Guanacaste → Monteverde → Arenal',
  stops: ['tamarindo', 'monteverde', 'arenal'],
};
