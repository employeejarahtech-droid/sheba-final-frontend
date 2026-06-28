const stats = [
  { value: '50+', label: 'Hospitals Powered', suffix: '' },
  { value: '100%', label: 'Data Isolation', suffix: '' },
  { value: '0', label: 'Cross-Tenant Leaks', suffix: '' },
  { value: '24/7', label: 'Uptime for Critical Care', suffix: '' },
]

export function StatsSection() {
  return (
    <section className="py-16 px-4 bg-blue-950">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-blue-200 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
