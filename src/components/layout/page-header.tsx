import { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PageHeaderProps {
    title: string
    description?: string
    backTo?: string
    backLabel?: string
    actions?: ReactNode
    showBackButton?: boolean
}

export function PageHeader({
    title,
    description,
    backTo,
    backLabel = 'Back',
    actions,
    showBackButton = true,
}: PageHeaderProps) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (backTo) {
            navigate({ to: backTo })
        } else {
            window.history.back()
        }
    }

    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {actions}
                {showBackButton && (
                    <Button onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {backLabel}
                    </Button>
                )}
            </div>
        </div>
    )
}
