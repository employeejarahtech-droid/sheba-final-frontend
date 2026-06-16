import {
  Users,
  DollarSign,
  ClipboardList,
  Shield,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Users,
    title: 'Patient Management',
    description:
      'Comprehensive patient records, appointments, medical history, and treatment tracking all in one place.',
  },
  {
    icon: DollarSign,
    title: 'Billing & Invoicing',
    description:
      'Automated billing, invoice generation, payment tracking, and insurance claim management.',
  },
  {
    icon: ClipboardList,
    title: 'Pathology Lab',
    description:
      'Lab test ordering, sample tracking, result management, and automated report generation.',
  },
  {
    icon: Shield,
    title: 'Payroll',
    description:
      'Employee salary management, tax calculations, attendance tracking, and automated payroll processing.',
  },
  {
    icon: Activity,
    title: 'Inventory',
    description:
      'Medicine stock management, supplier tracking, purchase orders, and expiry date alerts.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Interactive dashboards, revenue analytics, patient statistics, and customizable report generation.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        {/* Section Title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete suite of tools to run every aspect of your hospital
            efficiently and effectively.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
            >
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-purple-100 p-3 group-hover:bg-purple-600 transition-colors duration-300">
                  <feature.icon className="size-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
