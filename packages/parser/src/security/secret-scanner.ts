/**
 * Secret Scanner
 *
 * Scans file contents for common secret patterns (API keys, tokens, passwords)
 * Supports warn, redact, or fail actions based on configuration
 */

import { getParserConfig } from '../config.js';
import { logger } from '../logger.js';

export interface SecretMatch {
  pattern: string;
  match: string;
  line: number;
  column: number;
}

export interface SecretScanResult {
  filePath: string;
  secrets: SecretMatch[];
  action: 'warn' | 'redact' | 'fail';
}

/**
 * Secret patterns to detect
 */
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // AWS
  { name: 'AWS Access Key ID', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Access Key', pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },

  // GitHub
  { name: 'GitHub Personal Access Token', pattern: /ghp_[a-zA-Z0-9]{36}/g },
  { name: 'GitHub Fine-grained PAT', pattern: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g },
  { name: 'GitHub OAuth Token', pattern: /gho_[a-zA-Z0-9]{36}/g },

  // GitLab
  { name: 'GitLab Personal Access Token', pattern: /glpat-[a-zA-Z0-9_\-]{20}/g },

  // Private Keys
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },

  // Generic patterns
  { name: 'Password in Config', pattern: /(password|passwd|pwd)[\s]*[:=][\s]*['"][^'"]{8,}['"]/gi },
  { name: 'API Key', pattern: /(api[_-]?key|apikey|access[_-]?token)[\s]*[:=][\s]*['"][^'"]{16,}['"]/gi },

  // Slack
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}/g },

  // Stripe
  { name: 'Stripe API Key', pattern: /sk_live_[a-zA-Z0-9]{24,}/g },

  // Generic high-entropy strings that might be secrets
  { name: 'High-Entropy String', pattern: /['"][a-zA-Z0-9/+]{32,}={0,2}['"]/g },
];

/**
 * Scan file content for secrets
 */
export function scanFileContent(filePath: string, content: string): SecretScanResult | null {
  const config = getParserConfig();

  if (!config.ENABLE_SECRET_SCANNING) {
    return null;
  }

  const secrets: SecretMatch[] = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    if (typeof line !== 'string') {
      continue;
    }

    for (const { name, pattern } of SECRET_PATTERNS) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(line)) !== null) {
        secrets.push({
          pattern: name,
          match: match[0],
          line: lineIndex + 1,
          column: match.index + 1,
        });
      }
    }
  }

  if (secrets.length === 0) {
    return null;
  }

  return {
    filePath,
    secrets,
    action: config.SECRET_ACTION,
  };
}

/**
 * Process secret scan result based on action
 * Returns: modified content (if redacting) or original content
 * Throws: if action is 'fail'
 */
export function processSecretScanResult(content: string, result: SecretScanResult): string {
  const { filePath, secrets, action } = result;

  if (action === 'warn') {
    // Log warning but continue
    logger.warn(`⚠️  Secrets detected in ${filePath}:`);
    for (const secret of secrets) {
      logger.warn(`  - ${secret.pattern} at line ${secret.line}:${secret.column} (value redacted)`);
    }
    return content;
  }

  if (action === 'redact') {
    // Replace secrets with [REDACTED]
    let redactedContent = content;
    for (const secret of secrets) {
      redactedContent = redactedContent.replace(secret.match, '[REDACTED]');
    }

    logger.warn(`🔒 Redacted ${secrets.length} secrets in ${filePath}`);
    return redactedContent;
  }

  if (action === 'fail') {
    // Throw error to abort parsing
    const secretList = secrets.map(s => `${s.pattern} at line ${s.line}`).join(', ');
    throw new Error(`Security violation: Secrets detected in ${filePath} (${secretList})`);
  }

  return content;
}

/**
 * Scan and process file content in one step
 * Returns: potentially modified content (if redacting)
 * Throws: if action is 'fail' and secrets found
 */
export function scanAndProcessFile(filePath: string, content: string): string {
  const result = scanFileContent(filePath, content);

  if (!result) {
    return content;
  }

  return processSecretScanResult(content, result);
}
