import { getCookie } from '@/lib/cookies'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export type Message = {
  id: string
  sender_id: number
  receiver_id: number
  message: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
  sender?: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

export type Conversation = {
  id: string
  participant: {
    id: number
    name: string
    email: string
    avatar?: string
    role?: {
      id: number
      display_name: string
    }
  }
  lastMessage?: Message
  unreadCount: number
  messages: Message[]
}

export type ChatUser = {
  id: number
  name: string
  email: string
  avatar?: string
  role?: {
    id: number
    display_name: string
  }
}

// Get auth token
const getAuthHeaders = () => {
  const token = getCookie('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Fetch all users for chat
export const fetchChatUsers = async (): Promise<ChatUser[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/list`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const result = await response.json()

    // Transform user data to chat user format
    return result.data.items.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    }))
  } catch (error) {
    console.error('Error fetching chat users:', error)
    // Return dummy users as fallback
    return getDummyUsers()
  }
}

// Fetch conversations for current user
export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/conversations`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch conversations')
    }

    const result = await response.json()
    return result.data.items
  } catch (error) {
    console.error('Error fetching conversations:', error)
    // Return dummy conversations as fallback
    return getDummyConversations()
  }
}

// Fetch messages for a specific conversation
export const fetchMessages = async (userId: number): Promise<Message[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/messages/${userId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch messages')
    }

    const result = await response.json()
    return result.data.items
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

// Send a message
export const sendMessage = async (receiverId: number, message: string): Promise<Message> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        receiver_id: receiverId,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Dummy data fallbacks
const getDummyUsers = (): ChatUser[] => [
  {
    id: 1,
    name: 'Dr. Ahmed Rahman',
    email: 'ahmed@hospital.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    role: { id: 1, display_name: 'Doctor' },
  },
  {
    id: 2,
    name: 'Dr. Sarah Khan',
    email: 'sarah@hospital.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: { id: 1, display_name: 'Doctor' },
  },
  {
    id: 3,
    name: 'Nurse Fatima',
    email: 'fatima@hospital.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    role: { id: 2, display_name: 'Nurse' },
  },
  {
    id: 4,
    name: 'Admin John',
    email: 'john@hospital.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: { id: 3, display_name: 'Admin' },
  },
]

const getDummyConversations = (): Conversation[] => [
  {
    id: 'conv1',
    participant: {
      id: 1,
      name: 'Dr. Ahmed Rahman',
      email: 'ahmed@hospital.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      role: { id: 1, display_name: 'Doctor' },
    },
    lastMessage: {
      id: '1',
      sender_id: 1,
      receiver_id: 2,
      message: 'See you later!',
      timestamp: new Date().toISOString(),
      status: 'read',
    },
    unreadCount: 0,
    messages: [],
  },
]
