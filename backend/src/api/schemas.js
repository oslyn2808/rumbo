// API: validacion de lo que llega por HTTP (zod, mensajes en espanol).
import { z } from 'zod';
import { monumentInfoSchema, planSchema, tripRequestSchema } from '../services/schemas.js';

z.config(z.locales.es());

// bcrypt solo usa los primeros 72 bytes de la contrasena.
const password = z
  .string()
  .min(8, 'Usa al menos 8 caracteres.')
  .refine((v) => Buffer.byteLength(v) <= 72, 'La contraseña es demasiado larga.');

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Escribe un correo válido.'));

export const registerBody = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(60, 'El nombre es demasiado largo.'),
  email,
  password,
  remember: z.boolean().default(false),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña.').max(200),
  remember: z.boolean().default(false),
});

export const idParam = z.object({ id: z.coerce.number().int().positive() });
export const destinationIdParam = z.object({ id: z.string().trim().min(1).max(60) });

export const destinationsQuery = z.object({
  category: z.enum(['todo', 'playas', 'volcanes', 'aventura', 'naturaleza']).optional(),
  q: z.string().trim().max(60).optional(),
});

export const generateBody = tripRequestSchema;

export const regenerateBody = z.object({
  request: tripRequestSchema,
  plan: planSchema,
  day: z.number().int().min(1).max(30),
  instruction: z.string().trim().min(2).max(300),
});

export const saveTripBody = z.object({ request: tripRequestSchema, plan: planSchema });

export const saveMonumentBody = z.object({
  name: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).nullable().optional(),
  info: monumentInfoSchema,
});

const emptyToUndefined = (v) => (v === '' || v == null ? undefined : v);
export const identifyBody = z.object({
  lat: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  lon: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  language: z.enum(['es', 'en', 'fr', 'pt']).default('es'),
});
