"use client"

import { useState, useEffect } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Paperclip,
  Phone,
  ImagePlus,
  Plus,
  Search as SearchIcon,
  Send,
  Video,
  MessagesSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NewChat } from './components/new-chat'
import { fetchChatUsers, fetchMessages, sendMessage, type ChatUser as ServiceChatUser, type Message } from '@/services/chat.service'
// Fake Data (fallback)
import { conversations as dummyConversations } from './data/convo.json'

export function Chats() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<ServiceChatUser | null>(null)
  const [mobileSelectedUser, setMobileSelectedUser] = useState<ServiceChatUser | null>(null)
  const [createConversationDialogOpened, setCreateConversationDialog] = useState(false)
  const [users, setUsers] = useState<ServiceChatUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [messages, setMessages] = useState<Record<number, Message[]>>({})
  const [currentMessage, setCurrentMessage] = useState('')

  // Fetch users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchChatUsers()
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Failed to load users:', error)
        // Use dummy data as fallback
        const dummyUsers = dummyConversations.map((conv) => ({
          id: parseInt(conv.id.replace('conv', '')) || 1,
          name: conv.fullName,
          email: `${conv.username}@hospital.com`,
          avatar: conv.profile,
          role: { id: 1, display_name: conv.title },
        }))
        setUsers(dummyUsers)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      const loadMessages = async () => {
        try {
          const fetchedMessages = await fetchMessages(selectedUser.id)
          setMessages((prev) => ({ ...prev, [selectedUser.id]: fetchedMessages }))
        } catch (error) {
          console.error('Failed to load messages:', error)
          // Initialize with empty array if no messages
          setMessages((prev) => ({ ...prev, [selectedUser.id]: [] }))
        }
      }
      loadMessages()
    }
  }, [selectedUser])

  // Filtered data based on the search query
  const filteredUserList = users.filter(
    ({ name, email }) =>
      name.toLowerCase().includes(search.trim().toLowerCase()) ||
      email.toLowerCase().includes(search.trim().toLowerCase())
  )

  // Group messages by date
  const currentUserMessages = selectedUser
    ? (messages[selectedUser.id] || []).reduce(
        (acc: Record<string, Message[]>, msg) => {
          const key = format(new Date(msg.timestamp), 'd MMM, yyyy')
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(msg)
          return acc
        },
        {}
      )
    : {}

  const handleSendMessage = async () => {
    if (!selectedUser || !currentMessage.trim()) return

    try {
      const newMessage = await sendMessage(selectedUser.id, currentMessage)
      setMessages((prev) => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
      }))
      setCurrentMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
      // Optimistically add message anyway
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        sender_id: 0, // Current user
        receiver_id: selectedUser.id,
        message: currentMessage,
        timestamp: new Date().toISOString(),
        status: 'sent',
      }
      setMessages((prev) => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), optimisticMessage],
      }))
      setCurrentMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left Side */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='bg-background sticky top-0 z-10 -mx-4 px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>Inbox</h1>
                  <MessagesSquare size={20} />
                </div>

                <Button
                  size='icon'
                  variant='ghost'
                  onClick={() => setCreateConversationDialog(true)}
                  className='rounded-lg'
                >
                  <Edit size={24} className='stroke-muted-foreground' />
                </Button>
              </div>

              <label
                className={cn(
                  'focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden',
                  'border-border flex h-10 w-full items-center space-x-0 rounded-md border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search chat...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {isLoadingUsers ? (
                <div className='flex items-center justify-center py-8'>
                  <p className='text-sm text-muted-foreground'>Loading users...</p>
                </div>
              ) : (
                filteredUserList.map((user) => {
                  const userMessages = messages[user.id] || []
                  const lastMsg = userMessages[userMessages.length - 1]
                  const lastMsgText = lastMsg
                    ? lastMsg.sender_id === user.id
                      ? lastMsg.message
                      : `You: ${lastMsg.message}`
                    : 'Start a conversation'

                  return (
                    <Fragment key={user.id}>
                      <button
                        type='button'
                        className={cn(
                          'group hover:bg-accent hover:text-accent-foreground',
                          `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                          selectedUser?.id === user.id && 'sm:bg-muted'
                        )}
                        onClick={() => {
                          setSelectedUser(user)
                          setMobileSelectedUser(user)
                        }}
                      >
                        <div className='flex gap-2'>
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className='col-start-2 row-span-2 font-medium'>
                              {user.name}
                            </span>
                            <span className='text-muted-foreground group-hover:text-accent-foreground/90 col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis'>
                              {lastMsgText}
                            </span>
                          </div>
                        </div>
                      </button>
                      <Separator className='my-1' />
                    </Fragment>
                  )
                })
              )}
              {filteredUserList.length === 0 && !isLoadingUsers && (
                <div className='flex flex-col items-center justify-center py-8'>
                  <MessagesSquare className='mb-2 size-8 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>No users found</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Side */}
          {selectedUser ? (
            <div
              className={cn(
                'bg-background absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                mobileSelectedUser && 'start-0 flex'
              )}
            >
              {/* Top Part */}
              <div className='bg-card mb-1 flex flex-none justify-between p-4 shadow-lg sm:rounded-t-md'>
                {/* Left */}
                <div className='flex gap-3'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='-ms-2 h-full sm:hidden'
                    onClick={() => setMobileSelectedUser(null)}
                  >
                    <ArrowLeft className='rtl:rotate-180' />
                  </Button>
                  <div className='flex items-center gap-2 lg:gap-4'>
                    <Avatar className='size-9 lg:size-11'>
                      <AvatarImage
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                      />
                      <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                        {selectedUser.name}
                      </span>
                      <span className='text-muted-foreground col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-xs text-nowrap text-ellipsis lg:max-w-none lg:text-sm'>
                        {selectedUser.role?.display_name || selectedUser.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className='-me-1 flex items-center gap-1 lg:gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Video size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Phone size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6'
                  >
                    <MoreVertical className='stroke-muted-foreground sm:size-5' />
                  </Button>
                </div>
              </div>

              {/* Conversation */}
              <div className='flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4'>
                <div className='flex size-full flex-1'>
                  <div className='chat-text-container relative -me-4 flex flex-1 flex-col overflow-y-hidden'>
                    <div className='chat-flex flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pe-4 pb-4'>
                      {Object.keys(currentUserMessages).length > 0 ? (
                        Object.keys(currentUserMessages).map((key) => (
                          <Fragment key={key}>
                            {currentUserMessages[key].map((msg, index) => (
                              <div
                                key={`${msg.id}-${index}`}
                                className={cn(
                                  'chat-box max-w-72 px-3 py-2 break-words shadow-lg',
                                  msg.sender_id === selectedUser.id
                                    ? 'bg-muted self-start rounded-[16px_16px_16px_0]'
                                    : 'bg-primary/90 text-primary-foreground/75 self-end rounded-[16px_16px_0_16px]'
                                )}
                              >
                                {msg.message}{' '}
                                <span
                                  className={cn(
                                    'text-foreground/75 mt-1 block text-xs font-light italic',
                                    msg.sender_id !== selectedUser.id &&
                                      'text-primary-foreground/85 text-end'
                                  )}
                                >
                                  {format(new Date(msg.timestamp), 'h:mm a')}
                                </span>
                              </div>
                            ))}
                            <div className='text-center text-xs'>{key}</div>
                          </Fragment>
                        ))
                      ) : (
                        <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <form
                  className='flex w-full flex-none gap-2'
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                >
                  <div className='border-input bg-card focus-within:ring-ring flex flex-1 items-center gap-2 rounded-md border px-2 py-1 focus-within:ring-1 focus-within:outline-hidden lg:gap-4'>
                    <div className='space-x-1'>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='h-8 rounded-md'
                      >
                        <Plus size={20} className='stroke-muted-foreground' />
                      </Button>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='hidden h-8 rounded-md lg:inline-flex'
                      >
                        <ImagePlus
                          size={20}
                          className='stroke-muted-foreground'
                        />
                      </Button>
                      <Button
                        size='icon'
                        type='button'
                        variant='ghost'
                        className='hidden h-8 rounded-md lg:inline-flex'
                      >
                        <Paperclip
                          size={20}
                          className='stroke-muted-foreground'
                        />
                      </Button>
                    </div>
                    <label className='flex-1'>
                      <span className='sr-only'>Chat Text Box</span>
                      <input
                        type='text'
                        placeholder='Type your messages...'
                        className='h-8 w-full bg-inherit focus-visible:outline-hidden'
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </label>
                    <Button
                      variant='ghost'
                      size='icon'
                      type='submit'
                      className='hidden sm:inline-flex'
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                  <Button type='submit' className='h-full sm:hidden'>
                    <Send size={18} /> Send
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'bg-card absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border shadow-xs sm:static sm:z-auto sm:flex'
              )}
            >
              <div className='flex flex-col items-center space-y-6'>
                <div className='border-border flex size-16 items-center justify-center rounded-full border-2'>
                  <MessagesSquare className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>Your messages</h1>
                  <p className='text-muted-foreground text-sm'>
                    Send a message to start a chat.
                  </p>
                </div>
                <Button onClick={() => setCreateConversationDialog(true)}>
                  Send message
                </Button>
              </div>
            </div>
          )}
        </section>
        <NewChat
          users={users}
          onOpenChange={setCreateConversationDialog}
          open={createConversationDialogOpened}
          onSelectUser={(user) => {
            setSelectedUser(user)
            setMobileSelectedUser(user)
          }}
        />
      </Main>
    </>
  )
}
