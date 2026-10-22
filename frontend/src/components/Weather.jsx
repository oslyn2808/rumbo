import { CloudLightning, CloudRain, CloudSun, Cloud, Sun } from 'lucide-react';

export const CONDITION_ICON = { sunny: Sun, partly: CloudSun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning };

export const CONDITION_LABEL = {
  sunny: 'Soleado',
  partly: 'Parcialmente nublado',
  cloudy: 'Nublado',
  rain: 'Lluvia',
  storm: 'Tormenta',
};

export const CONDITION_NOTE = {
  sunny: 'Cielo despejado en la zona.',
  partly: 'Mezcla de sol y nubes.',
  cloudy: 'Cielo cubierto, sin lluvia fuerte.',
  rain: 'Se esperan lluvias; lleva impermeable.',
  storm: 'Tormentas posibles; evita zonas expuestas.',
};
