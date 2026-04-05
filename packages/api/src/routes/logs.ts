/**
 * UI Log Endpoint
 *
 * Accepts structured log entries from the browser UI and forwards them
 * to the Winston logger so they appear in Loki alongside API logs.
 *
 * - No authentication required (errors must be capturable before auth)
 * - Rate limited to 20 requests per minute per IP
 */

import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { createAppLogger } from '../logger'

export const logsRouter = Router()

// Separate logger so UI-forwarded logs land in Loki under {app="diagram-builder-ui"}
// rather than the API's {app="diagram-builder-api"} stream.
const log = createAppLogger('diagram-builder-ui')

const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error'] as const

const LogBodySchema = z.object({
  level: z.enum(ALLOWED_LEVELS).default('error'),
  message: z.string().min(1).max(2000),
  context: z.record(z.string(), z.unknown()).optional(),
})

const uiLogRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many log requests, please try again later' },
})

logsRouter.post('/', uiLogRateLimit, (req: Request, res: Response) => {
  const parsed = LogBodySchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      type: 'https://diagram-builder.io/errors/validation-error',
      title: 'Invalid log body',
      status: 400,
      detail: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    })
    return
  }

  const { level, message, context } = parsed.data
  log[level](message, context ?? {})

  res.status(204).send()
})
