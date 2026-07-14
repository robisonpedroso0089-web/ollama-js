import { Ollama } from '../browser.js'
import type { ChatResponse } from '../interfaces.js'
import { AbortableAsyncIterator } from '../utils.js'
import { ErrorHandler, ChatError } from './ErrorHandler.js'

/**
 * Configurações para streaming de chat
 */
export interface StreamConfig {
  onChunk?: (chunk: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: ChatError) => void
  onStart?: () => void
}

/**
 * Chat com streaming em tempo real
 */
export class StreamingChat {
  private ollama: Ollama
  private abortController?: AbortController

  constructor(ollama?: Ollama) {
    this.ollama = ollama || new Ollama()
  }

  /**
   * Envia uma pergunta e recebe resposta em streaming
   */
  async ask(
    prompt: string,
    model: string,
    config?: StreamConfig,
  ): Promise<string> {
    try {
      config?.onStart?.()

      const response = await this.ollama.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      })

      let fullResponse = ''

      for await (const chunk of response as AbortableAsyncIterator<ChatResponse>) {
        const chunkText = chunk.message?.content || ''
        fullResponse += chunkText
        config?.onChunk?.(chunkText)
      }

      config?.onComplete?.(fullResponse)
      return fullResponse
    } catch (error) {
      const chatError = ErrorHandler.handle(error)
      config?.onError?.(chatError)
      throw chatError
    }
  }

  /**
   * Exemplo: Stream para console em tempo real
   */
  async streamToConsole(
    prompt: string,
    model: string,
  ): Promise<string> {
    return this.ask(prompt, model, {
      onStart: () => console.log('\n🤖 Pensando...\n'),
      onChunk: (chunk) => process.stdout.write(chunk),
      onComplete: () => console.log('\n\n✅ Completo!\n'),
      onError: (error) => console.error(`\n❌ Erro: ${error.message}`),
    })
  }

  /**
   * Abort a requisição em andamento
   */
  abort(): void {
    this.abortController?.abort()
  }
}
