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
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { useNotificationsSocket } from '@/hooks/useSocket'
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
} from '@/features/notifications/notificationQueries'

const ACTION_STYLES: Record<string, { bg: string; label: string }> = {
  add: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', label: 'Created' },
  update: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'Updated' },
  delete: { bg: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Deleted' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationDropdown() {
  useNotificationsSocket()
  const { data: unreadData } = useGetUnreadCountQuery()
  const { data: notifData } = useGetNotificationsQuery({ page: 1, limit: 10 })
  const markAllRead = useMarkAllReadMutation()

  const unreadCount = unreadData?.data?.count ?? 0
  const notifications = notifData?.data ?? []

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
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <Link to='/notifications'>
              <Button variant='ghost' size='sm' className='h-auto p-0 text-xs'>
                View all
              </Button>
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className='max-h-96 overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => {
              const style = ACTION_STYLES[n.action_type] || ACTION_STYLES.update
              return (
                <DropdownMenuItem
                  key={n.id}
                  asChild
                  className={cn('flex flex-col items-start gap-1 py-3 cursor-pointer', !n.is_read && 'bg-muted/50')}
                >
                  <Link to='/notifications/$id' params={{ id: String(n.id) }}>
                    <div className='flex items-center gap-2 w-full'>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', style.bg)}>
                        {style.label}
                      </span>
                      {n.module && (
                        <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                          {n.module}
                        </span>
                      )}
                      <span className='ml-auto text-[10px] text-muted-foreground'>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className='text-sm font-medium leading-snug'>{n.notification_title}</p>
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuGroup>
        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='cursor-pointer justify-center gap-2'
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className='h-3 w-3' />
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
