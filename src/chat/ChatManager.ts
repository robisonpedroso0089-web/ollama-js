import { Ollama } from '../browser.js'
import type { ChatRequest, ChatResponse, Message } from '../interfaces.js'
import { AbortableAsyncIterator } from '../utils.js'

export interface ChatSession {
  id: string
  messages: Message[]
  model: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface ChatOptions {
  model: string
  temperature?: number
  systemPrompt?: string
  keepAlive?: string | number
  maxHistory?: number
}

/**
 * Gerenciador de conversas com Ollama
 * Mantém histórico, streaming e metadados de conversas
 */
export class ChatManager {
  private ollama: Ollama
  private sessions: Map<string, ChatSession> = new Map()
  private currentSessionId: string = ''

  constructor(ollama?: Ollama) {
    this.ollama = ollama || new Ollama()
  }

  /**
   * Cria uma nova sessão de chat
   */
  createSession(sessionId: string, model: string, metadata?: Record<string, any>): ChatSession {
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    }
    this.sessions.set(sessionId, session)
    this.currentSessionId = sessionId
    return session
  }

  /**
   * Obtém a sessão atual
   */
  getCurrentSession(): ChatSession | undefined {
    return this.sessions.get(this.currentSessionId)
  }

  /**
   * Define a sessão ativa
   */
  setActiveSession(sessionId: string): ChatSession | undefined {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.currentSessionId = sessionId
    }
    return session
  }

  /**
   * Adiciona mensagem ao histórico
   */
  addMessage(role: 'user' | 'assistant' | 'system', content: string, sessionId?: string): Message {
    const id = sessionId || this.currentSessionId
    const session = this.sessions.get(id)

    if (!session) {
      throw new Error(`Session ${id} not found`)
    }

    const message: Message = {
      role,
      content,
    }

    session.messages.push(message)
    session.updatedAt = new Date()

    return message
  }

  /**
   * Obtém o histórico de mensagens
   */
  getHistory(sessionId?: string, limit?: number): Message[] {
    const id = sessionId || this.currentSessionId
    const session = this.sessions.get(id)

    if (!session) {
      return []
    }

    let messages = [...session.messages]
    if (limit && messages.length > limit) {
      messages = messages.slice(-limit)
    }

    return messages
  }

  /**
   * Limpa o histórico de uma sessão
   */
  clearHistory(sessionId?: string): void {
    const id = sessionId || this.currentSessionId
    const session = this.sessions.get(id)

    if (session) {
      session.messages = []
      session.updatedAt = new Date()
    }
  }

  /**
   * Envia mensagem e recebe resposta (sem streaming)
   */
  async chat(
    userMessage: string,
    options: ChatOptions,
    sessionId?: string,
  ): Promise<string> {
    const id = sessionId || this.currentSessionId
    const session = this.sessions.get(id)

    if (!session) {
      throw new Error(`Session ${id} not found`)
    }

    // Adiciona mensagem do usuário
    this.addMessage('user', userMessage, id)

    // Prepara mensagens
    const messages: Message[] = []
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      })
    }
    messages.push(...session.messages)

    try {
      const response = await this.ollama.chat({
        model: options.model,
        messages,
        stream: false,
        temperature: options.temperature,
        keep_alive: options.keepAlive,
      } as ChatRequest)

      const assistantMessage = (response as ChatResponse).message.content
      this.addMessage('assistant', assistantMessage, id)

      return assistantMessage
    } catch (error) {
      throw new Error(`Chat error: ${error}`)
    }
  }

  /**
   * Envia mensagem com streaming
   */
  async chatStream(
    userMessage: string,
    options: ChatOptions,
    sessionId?: string,
  ): Promise<AbortableAsyncIterator<ChatResponse>> {
    const id = sessionId || this.currentSessionId
    const session = this.sessions.get(id)

    if (!session) {
      throw new Error(`Session ${id} not found`)
    }

    // Adiciona mensagem do usuário
    this.addMessage('user', userMessage, id)

    // Prepara mensagens
    const messages: Message[] = []
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      })
    }
    messages.push(...session.messages)

    try {
      const response = await this.ollama.chat({
        model: options.model,
        messages,
        stream: true,
        temperature: options.temperature,
        keep_alive: options.keepAlive,
      } as ChatRequest)

      return response as AbortableAsyncIterator<ChatResponse>
    } catch (error) {
      throw new Error(`Chat stream error: ${error}`)
    }
  }

  /**
   * Lista todas as sessões
   */
  listSessions(): ChatSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Remove uma sessão
   */
  deleteSession(sessionId: string): boolean {
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = ''
    }
    return this.sessions.delete(sessionId)
  }
}
