import type { ChatSession } from './ChatManager.js'

/**
 * Persistência de conversas em JSON
 * Pode ser estendido para banco de dados
 */
export class ConversationPersistence {
  /**
   * Salva uma sessão em JSON (Node.js)
   */
  static toJSON(session: ChatSession): string {
    return JSON.stringify(session, null, 2)
  }

  /**
   * Carrega uma sessão de JSON
   */
  static fromJSON(json: string): ChatSession {
    const data = JSON.parse(json)
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    }
  }

  /**
   * Exporta múltiplas sessões
   */
  static exportSessions(sessions: ChatSession[]): string {
    return JSON.stringify(
      sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      null,
      2,
    )
  }

  /**
   * Importa múltiplas sessões
   */
  static importSessions(json: string): ChatSession[] {
    const data = JSON.parse(json)
    return data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }))
  }

  /**
   * Formata uma sessão para exibição legível
   */
  static formatForDisplay(session: ChatSession): string {
    let output = `\n📋 Sessão: ${session.id}\n`
    output += `📅 Criada: ${session.createdAt.toLocaleString('pt-BR')}\n`
    output += `⏰ Atualizada: ${session.updatedAt.toLocaleString('pt-BR')}\n`
    output += `🤖 Modelo: ${session.model}\n`
    output += `💬 Mensagens: ${session.messages.length}\n`

    if (session.messages.length > 0) {
      output += `\n--- Histórico ---\n`
      session.messages.forEach((msg, idx) => {
        const icon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '⚙️'
        output += `\n${icon} ${msg.role.toUpperCase()}:\n${msg.content}\n`
      })
    }

    return output
  }
}
