// API: valida body / params / query con zod. El resultado queda en req.valid (req.query es de solo lectura en Express 5).
import { HttpError } from '../../services/errors.js';

export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid ?? {};
    const fields = {};
    for (const source of ['params', 'query', 'body']) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(req[source] ?? {});
      if (result.success) {
        req.valid[source] = result.data;
      } else {
        for (const issue of result.error.issues) {
          const key = issue.path.length ? issue.path.join('.') : source;
          fields[key] ??= issue.message;
        }
      }
    }
    if (Object.keys(fields).length) {
      throw new HttpError(400, Object.values(fields)[0], { code: 'validation', fields });
    }
    next();
  };
}
