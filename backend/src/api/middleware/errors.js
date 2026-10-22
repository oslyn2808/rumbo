// API: traduce errores a respuestas JSON { message, code, fields? }.
import multer from 'multer';
import { HttpError } from '../../services/errors.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Ruta no encontrada.', code: 'not_found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code, fields: err.fields });
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooBig ? 413 : 400).json({
      message: tooBig ? 'La imagen supera el máximo de 5 MB.' : 'No se pudo leer la imagen enviada.',
      code: tooBig ? 'image_too_large' : 'bad_upload',
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La solicitud es demasiado grande.', code: 'too_large' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la solicitud no es JSON válido.', code: 'bad_json' });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ message: 'Ocurrió un error en el servidor. Intenta de nuevo.', code: 'internal' });
}
