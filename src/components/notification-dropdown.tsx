import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
//import { Link } from '@tanstack/react-router'

export function NotificationDropdown() {
  const unreadCount = 3 // You can make this dynamic based on your state

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full relative'>
          <Bell className='size-[1.2rem]' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className={cn(
                'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs',
                unreadCount > 9 && 'h-6 w-6'
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className='sr-only'>Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex items-center justify-between gap-1.5'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>Notifications</p>
              <p className='text-muted-foreground text-xs leading-none'>
                You have {unreadCount} unread messages
              </p>
            </div>
            {/* <Link to='/' className='flex items-center gap-1'> */}
              <Button variant='ghost' size='sm' className='h-auto p-0 text-xs'>
                View all
              </Button>
            {/* </Link> */}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className='max-h-96 overflow-y-auto'>
          <DropdownMenuItem>
            <div className='flex flex-col gap-1 w-full'>
              <p className='text-sm font-medium'>New admission</p>
              <p className='text-muted-foreground text-xs'>
                Patient John Doe has been admitted
              </p>
              <p className='text-muted-foreground text-xs'>2 minutes ago</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <div className='flex flex-col gap-1 w-full'>
              <p className='text-sm font-medium'>Payment received</p>
              <p className='text-muted-foreground text-xs'>
                Payment of $500 received from Patient #1234
              </p>
              <p className='text-muted-foreground text-xs'>1 hour ago</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <div className='flex flex-col gap-1 w-full'>
              <p className='text-sm font-medium'>Lab results ready</p>
              <p className='text-muted-foreground text-xs'>
                Lab results for Patient #5678 are ready for review
              </p>
              <p className='text-muted-foreground text-xs'>3 hours ago</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer justify-center'>
          Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
