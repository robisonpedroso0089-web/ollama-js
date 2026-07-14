/**
 * Tipos de erro de chat
 */
export enum ChatErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classe customizada para erros de chat
 */
export class ChatError extends Error {
  constructor(
    public type: ChatErrorType,
    message: string,
    public statusCode?: number,
    public originalError?: Error,
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

/**
 * Manipulador de erros para operações de chat
 */
export class ErrorHandler {
  /**
   * Analisa um erro e retorna um ChatError formatado
   */
  static handle(error: any): ChatError {
    if (error instanceof ChatError) {
      return error
    }

    if (error.message?.includes('Failed to fetch')) {
      return new ChatError(
        ChatErrorType.CONNECTION_ERROR,
        'Falha ao conectar com o servidor Ollama. Verifique se está rodando em http://localhost:11434',
        undefined,
        error,
      )
    }

    if (error.message?.includes('model not found')) {
      return new ChatError(
        ChatErrorType.MODEL_NOT_FOUND,
        'Modelo não encontrado. Verifique o nome do modelo ou execute: ollama pull <modelo>',
        404,
        error,
      )
    }

    if (error.message?.includes('timeout')) {
      return new ChatError(
        ChatErrorType.TIMEOUT,
        'Timeout na requisição. O servidor pode estar sobrecarregado.',
        408,
        error,
      )
    }

    if (error.message?.includes('429') || error.statusCode === 429) {
      return new ChatError(
        ChatErrorType.RATE_LIMIT,
        'Limite de requisições excedido. Aguarde um momento e tente novamente.',
        429,
        error,
      )
    }

    if (error.statusCode === 400 || error.message?.includes('invalid')) {
      return new ChatError(
        ChatErrorType.INVALID_REQUEST,
        `Requisição inválida: ${error.message}`,
        400,
        error,
      )
    }

    return new ChatError(
      ChatErrorType.UNKNOWN,
      `Erro desconhecido: ${error.message || error}`,
      undefined,
      error,
    )
  }

  /**
   * Retorna uma mensagem amigável para o usuário
   */
  static getUserMessage(error: ChatError): string {
    const messages: Record<ChatErrorType, string> = {
      [ChatErrorType.CONNECTION_ERROR]: '❌ Não consegui conectar. Ollama está rodando?',
      [ChatErrorType.MODEL_NOT_FOUND]: '❌ Modelo não encontrado. Tente outro modelo.',
      [ChatErrorType.INVALID_REQUEST]: '❌ Requisição inválida. Verifique os parâmetros.',
      [ChatErrorType.TIMEOUT]: '❌ Demorou muito. Tente novamente.',
      [ChatErrorType.RATE_LIMIT]: '❌ Muitas requisições. Aguarde um pouco.',
      [ChatErrorType.UNKNOWN]: '❌ Algo deu errado. Tente novamente.',
    }
    return messages[error.type]
  }

  /**
   * Log detalhado para debug
   */
  static log(error: ChatError, verbose = false): void {
    console.error(`[${error.type}] ${error.message}`)
    if (verbose && error.originalError) {
      console.error('Original error:', error.originalError)
    }
    if (error.statusCode) {
      console.error(`Status: ${error.statusCode}`)
    }
  }
}
