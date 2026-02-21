import { type conversations } from './convo.json'
import type { ChatUser as ServiceChatUser, Conversation, Message } from '@/services/chat.service'

// Legacy type for compatibility with existing code
export type ChatUser = (typeof conversations)[number]

// New types for real user integration
export type Convo = ChatUser['messages'][number]

// Re-export service types
export type { ServiceChatUser, Conversation, Message }
