// LOGICA DE NEGOCIO: cliente de IA (Claude). Sin clave, "demo" es true y los servicios usan datos de ejemplo.
import Anthropic from '@anthropic-ai/sdk';
import { HttpError } from './errors.js';
import { parseJsonLoose } from './text.js';

// Traduce los errores de la API de Anthropic a mensajes que la persona pueda entender y resolver.
function explain(err, model) {
  const detail = String(err?.error?.error?.message ?? err?.message ?? '');
  if (err instanceof Anthropic.APIConnectionError) {
    return ['No se pudo conectar con la IA. Revisa la conexión a internet de la computadora.', 'ai_unreachable'];
  }
  if (err?.status === 401) return ['La clave de la IA no es válida. Revisa ANTHROPIC_API_KEY en backend/.env.', 'ai_auth'];
  if (err?.status === 403) return ['La clave de la IA no tiene permiso para usar este modelo.', 'ai_forbidden'];
  if (/credit balance/i.test(detail)) return ['Tu cuenta de Anthropic no tiene créditos. Recarga saldo en console.anthropic.com.', 'ai_no_credit'];
  if (err?.status === 404 || (err?.status === 400 && /model/i.test(detail))) {
    return [`El modelo de IA "${model}" no está disponible. Revisa CLAUDE_MODEL en backend/.env.`, 'ai_model'];
  }
  if (err?.status === 429) return ['La IA está recibiendo demasiadas solicitudes. Espera un momento e inténtalo de nuevo.', 'ai_rate_limited'];
  if (err?.status >= 500) return ['La IA está saturada en este momento. Inténtalo de nuevo en unos segundos.', 'ai_overloaded'];
  return ['La IA no pudo responder. Inténtalo de nuevo.', 'ai_error'];
}

export function createAiClient(config) {
  if (config.demoMode) return { demo: true };

  const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 170 * 1000, maxRetries: 1 });

  async function send({ system, content, maxTokens }) {
    let res;
    try {
      res = await client.messages.create({
        model: config.claudeModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content }],
      });
    } catch (err) {
      console.error('[ia] Error al llamar a la API:', err?.status ?? '', err?.message ?? err);
      const [message, code] = explain(err, config.claudeModel);
      throw new HttpError(502, message, { code });
    }

    const text = res.content.find((b) => b.type === 'text')?.text ?? '';
    if (res.stop_reason === 'max_tokens') {
      console.error('[ia] La respuesta se cortó por max_tokens:', maxTokens);
    }
    try {
      return parseJsonLoose(text);
    } catch {
      console.error('[ia] La respuesta no es JSON válido. Inicio:', text.slice(0, 300));
      throw new HttpError(
        502,
        res.stop_reason === 'max_tokens'
          ? 'La respuesta de la IA quedó incompleta. Prueba con menos días e inténtalo de nuevo.'
          : 'La IA devolvió una respuesta con formato inesperado. Intenta de nuevo.',
        { code: 'ai_bad_format' }
      );
    }
  }

  return {
    demo: false,
    askJson({ system, prompt, maxTokens = 4000 }) {
      return send({ system, content: prompt, maxTokens });
    },
    askJsonWithImage({ system, prompt, image, mediaType, maxTokens = 1500 }) {
      return send({
        system,
        maxTokens,
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image.toString('base64') } },
          { type: 'text', text: prompt },
        ],
      });
    },
  };
}
