"use client"

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchChatUsers, type ChatUser as ServiceChatUser } from '@/services/chat.service'

type NewChatProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUser?: (user: ServiceChatUser) => void
}

export function NewChat({ onOpenChange, open, onSelectUser }: NewChatProps) {
  const [selectedUsers, setSelectedUsers] = useState<ServiceChatUser[]>([])
  const [allUsers, setAllUsers] = useState<ServiceChatUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      const loadUsers = async () => {
        setIsLoading(true)
        try {
          const users = await fetchChatUsers()
          setAllUsers(users)
        } catch (error) {
          console.error('Failed to load users:', error)
          setAllUsers([])
        } finally {
          setIsLoading(false)
        }
      }
      loadUsers()
    }
  }, [open])

  const handleSelectUser = (user: ServiceChatUser) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    } else {
      handleRemoveUser(user.id)
    }
  }

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId))
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    // Reset selected users when dialog closes
    if (!newOpen) {
      setSelectedUsers([])
    }
  }

  const handleStartChat = () => {
    if (selectedUsers.length > 0 && onSelectUser) {
      // Start chat with first selected user
      onSelectUser(selectedUsers[0])
      onOpenChange(false)
    } else {
      showSubmittedData(selectedUsers)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap items-baseline-last gap-2'>
            <span className='text-muted-foreground min-h-6 text-sm'>To:</span>
            {selectedUsers.map((user) => (
              <Badge key={user.id} variant='default'>
                {user.name}
                <button
                  className='ring-offset-background focus:ring-ring ms-1 rounded-full outline-hidden focus:ring-2 focus:ring-offset-2'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRemoveUser(user.id)
                    }
                  }}
                  onClick={() => handleRemoveUser(user.id)}
                  type='button'
                >
                  <X className='text-muted-foreground hover:text-foreground h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
          <Command className='rounded-lg border'>
            <CommandInput
              placeholder='Search people...'
              className='text-foreground'
            />
            <CommandList>
              {isLoading ? (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  Loading users...
                </div>
              ) : (
                <>
                  <CommandEmpty>No people found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectUser(user)}
                        className='hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2'
                      >
                        <div className='flex items-center gap-2'>
                          <img
                            src={user.avatar || '/placeholder.svg'}
                            alt={user.name}
                            className='h-8 w-8 rounded-full'
                          />
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium'>
                              {user.name}
                            </span>
                            <span className='text-accent-foreground/70 text-xs'>
                              {user.role?.display_name || user.email}
                            </span>
                          </div>
                        </div>

                        {selectedUsers.find((u) => u.id === user.id) && (
                          <Check className='h-4 w-4' />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
          <Button
            variant={'default'}
            onClick={handleStartChat}
            disabled={selectedUsers.length === 0}
          >
            {onSelectUser ? 'Start Chat' : 'Chat'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
