/**
 * Base error class for parser errors
 */
export class ParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParserError'
    Object.setPrototypeOf(this, ParserError.prototype)
  }
}

/**
 * Error thrown when parser initialization fails
 */
export class ParserInitError extends ParserError {
  constructor(language: string, cause?: unknown) {
    const message = `Failed to initialize parser for language: ${language}${
      cause instanceof Error ? `. ${cause.message}` : ''
    }`
    super(message)
    this.name = 'ParserInitError'
    Object.setPrototypeOf(this, ParserInitError.prototype)
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends ParserError {
  public readonly filePath: string | undefined
  public readonly lineNumber: number | undefined
  public readonly column: number | undefined

  constructor(
    message: string,
    options?: {
      filePath?: string
      lineNumber?: number
      column?: number
      cause?: unknown
    }
  ) {
    const locationInfo =
      options?.filePath && options?.lineNumber
        ? ` at ${options.filePath}:${options.lineNumber}${options.column ? `:${options.column}` : ''}`
        : ''
    const causeInfo = options?.cause instanceof Error ? `. ${options.cause.message}` : ''
    super(`${message}${locationInfo}${causeInfo}`)

    this.name = 'ParseError'
    this.filePath = options?.filePath
    this.lineNumber = options?.lineNumber
    this.column = options?.column

    Object.setPrototypeOf(this, ParseError.prototype)
  }
}

/**
 * Error thrown when an unsupported language is requested
 */
export class UnsupportedLanguageError extends ParserError {
  public readonly language: string
  public readonly supportedLanguages: string[]

  constructor(language: string, supportedLanguages: string[] = ['javascript', 'typescript', 'tsx']) {
    super(
      `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`
    )
    this.name = 'UnsupportedLanguageError'
    this.language = language
    this.supportedLanguages = supportedLanguages

    Object.setPrototypeOf(this, UnsupportedLanguageError.prototype)
  }
}

/**
 * Error thrown when a file extension is not supported
 */
export class UnsupportedFileExtensionError extends ParserError {
  public readonly extension: string
  public readonly filePath: string

  constructor(filePath: string, extension: string) {
    super(
      `Unsupported file extension: ${extension} for file: ${filePath}. ` +
        `Supported extensions: .js, .jsx, .mjs, .cjs, .ts, .tsx, .mts, .cts`
    )
    this.name = 'UnsupportedFileExtensionError'
    this.extension = extension
    this.filePath = filePath

    Object.setPrototypeOf(this, UnsupportedFileExtensionError.prototype)
  }
}
