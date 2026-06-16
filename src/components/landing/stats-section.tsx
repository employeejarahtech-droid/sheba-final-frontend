const stats = [
  { value: '50+', label: 'Hospitals', suffix: '' },
  { value: '10K+', label: 'Patients', suffix: '' },
  { value: '100+', label: 'Labs', suffix: '' },
  { value: '$2M+', label: 'Revenue Processed', suffix: '' },
]

export function StatsSection() {
  return (
    <section className="py-16 px-4 bg-slate-900">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-slate-300 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
