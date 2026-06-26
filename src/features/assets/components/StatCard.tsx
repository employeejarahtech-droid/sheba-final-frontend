import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StatCardData {
  label: string
  value: string | number
  icon: React.ElementType
  headerBg: string
  iconColor: string
}

export function StatCards({ cards }: { cards: StatCardData[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="overflow-hidden transition-all duration-300 gap-0 shadow-none p-0 border">
            <CardHeader className="border-b py-2 px-4 gap-0" style={{ backgroundColor: card.headerBg }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-lg shadow-lg">
                  <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90">{card.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="text-2xl font-bold">{card.value ?? 0}</h3>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
