// LOGICA DE NEGOCIO: formas validas de los datos (zod). Las usan la API y los servicios.
import { z } from 'zod';

const text = (max) => z.string().trim().max(max);

export const activitySchema = z.object({
  time: text(20).default(''),
  title: text(200),
  details: text(600).default(''),
  costUsd: z.number().min(0).max(100000).default(0),
});

export const daySchema = z.object({
  day: z.number().int().min(1).max(30),
  place: text(100),
  theme: text(160).default(''),
  activities: z.array(activitySchema).max(8),
  foodTip: text(400).default(''),
  rainPlan: text(400).default(''),
});

export const planSchema = z.object({
  title: text(160),
  overview: text(800).default(''),
  bestTimeNote: text(400).default(''),
  days: z.array(daySchema).min(1).max(30),
  packingTips: z.array(text(200)).max(12).default([]),
  extraIdeas: z.array(text(300)).max(12).default([]),
  demo: z.boolean().default(false),
  route: z
    .object({
      places: z.array(text(100)).max(30),
      approxKm: z.number().min(0).max(100000).nullable(),
    })
    .optional(),
});

export const tripRequestSchema = z.object({
  destination: text(100).min(2, 'Escribe un destino.'),
  days: z.number().int().min(1, 'Mínimo 1 día.').max(14, 'Máximo 14 días.'),
  interests: z.array(text(50)).max(15).default([]),
  budget: text(30).default('medio'),
  travelers: text(30).default('solo'),
  pace: text(30).default('relajado'),
});

export const monumentInfoSchema = z.object({
  identified: z.boolean(),
  name: text(200),
  confidence: z.enum(['alta', 'media', 'baja']).default('baja'),
  location: text(200).nullable().default(null),
  yearBuilt: text(100).nullable().default(null),
  style: text(200).nullable().default(null),
  summary: text(1200).default(''),
  history: text(2500).default(''),
  funFacts: z.array(text(500)).max(8).default([]),
  visitTips: text(800).nullable().default(null),
  demo: z.boolean().default(false),
});
