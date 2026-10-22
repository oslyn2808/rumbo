// Fotos reales de cada destino, tomadas de Wikipedia (imagenes de Wikimedia Commons, licencias libres).
// Se prueban los articulos en orden y se usa la primera foto (JPG) que aparezca.
// Para fijar una foto concreta, pon su URL en `uri` y se usara sin consultar Wikipedia.
export const DESTINATION_PHOTOS = {
  tamarindo: { articles: ['es:Playa Tamarindo', 'en:Tamarindo, Costa Rica', 'es:Tamarindo (Costa Rica)'] },
  monteverde: { articles: ['es:Reserva Biológica Bosque Nuboso Monteverde', 'en:Monteverde Cloud Forest Reserve', 'en:Monteverde'] },
  arenal: { articles: ['es:Volcán Arenal', 'en:Arenal Volcano'] },
  'santa-teresa': { articles: ['en:Santa Teresa, Costa Rica', 'es:Playa Santa Teresa', 'en:Mal País'] },
  'manuel-antonio': { articles: ['es:Parque nacional Manuel Antonio', 'en:Manuel Antonio National Park'] },
  tortuguero: { articles: ['es:Parque nacional Tortuguero', 'en:Tortuguero National Park'] },
  'puerto-viejo': { articles: ['en:Puerto Viejo de Talamanca', 'es:Puerto Viejo de Talamanca'] },
  'rincon-de-la-vieja': { articles: ['es:Parque nacional Rincón de la Vieja', 'en:Rincón de la Vieja Volcano National Park', 'en:Rincón de la Vieja Volcano'] },
  poas: { articles: ['es:Volcán Poás', 'en:Poás Volcano'] },
  irazu: { articles: ['es:Volcán Irazú', 'en:Irazú Volcano'] },
  jaco: { articles: ['en:Jacó', 'es:Jacó'] },
  corcovado: { articles: ['es:Parque nacional Corcovado', 'en:Corcovado National Park'] },
};
