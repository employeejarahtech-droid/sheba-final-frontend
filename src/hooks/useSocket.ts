import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

let socket: Socket | null = null

function getSocket(): Socket {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL || '', { transports: ['websocket'] })
    }
    return socket
}

export function useNotificationsSocket() {
    const queryClient = useQueryClient()

    useEffect(() => {
        const s = getSocket()

        const onNotification = () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }

        s.on('notification', onNotification)

        return () => {
            s.off('notification', onNotification)
        }
    }, [queryClient])
}
