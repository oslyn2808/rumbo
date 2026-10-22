// LOGICA DE NEGOCIO: error con codigo HTTP que la capa API traduce a una respuesta.
export class HttpError extends Error {
  constructor(status, message, { code = 'error', fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
