/**
 * Environment variable loader
 *
 * MUST be imported as the very first statement in server.ts.
 * Loads .env before any other module (including observability) runs,
 * so that getApiConfig() has access to env vars at load time.
 *
 * When running via npm workspaces, cwd is the package dir, so go up 2 levels to project root.
 */
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '../../.env') })
