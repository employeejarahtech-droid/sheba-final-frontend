import {
  Users,
  DollarSign,
  ClipboardList,
  Shield,
  Activity,
  BarChart3,
  Database,
  Lock,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Users,
    title: 'Admissions & Indoors',
    description:
      'Comprehensive patient records, bed tracking, medical history, and clinical treatments all in one place.',
  },
  {
    icon: DollarSign,
    title: 'Billing & Finances',
    description:
      'Automated billing, balance distribution, payment tracking, and final bill generation.',
  },
  {
    icon: ClipboardList,
    title: 'Pathology & Hematology',
    description:
      'Lab test ordering, sample tracking, peripheral blood film reports, and automated result management.',
  },
  {
    icon: Shield,
    title: 'Payroll & Staff',
    description:
      'Employee salary management, tax calculations, attendance tracking, and duty rosters.',
  },
  {
    icon: Activity,
    title: 'Asset & Maintenance',
    description:
      'Equipment tracking, maintenance schedules, supplier tracking, and condition alerts.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description:
      'Interactive dashboards, revenue analytics, patient statistics, and customizable report generation.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-12 sm:py-20 md:py-24 px-4 bg-white relative">
      <div className="container mx-auto max-w-6xl">
        
        {/* Isolated Database USP Section */}
        <div className="mb-12 sm:mb-16 md:mb-24 rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-900 leading-tight">
                Multi-Hospital Scalability.<br />
                <span className="text-blue-600">Single-Hospital Security.</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                We take patient data privacy seriously. Unlike traditional SaaS, our platform provisions a completely isolated, dedicated database for every single hospital. Zero cross-contamination, absolute compliance.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="mt-1 bg-blue-100 p-2 rounded-lg text-blue-600 h-fit shrink-0">
                    <Database className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Dedicated Patient Databases</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">Your patients' medical records and pathology results are stored in a perfectly isolated silo.</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <div className="mt-1 bg-teal-100 p-2 rounded-lg text-teal-600 h-fit shrink-0">
                    <Lock className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Enterprise Compliance</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">Exceeds global healthcare data regulations. Auditable, encrypted at rest and in transit.</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <div className="mt-1 bg-purple-100 p-2 rounded-lg text-purple-600 h-fit shrink-0">
                    <Zap className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Uncompromised Performance</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">Heavy pathology reports and massive admission data won't slow down your neighboring tenants.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Architectural Visual */}
            <div className="relative flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 min-h-[200px] sm:min-h-[240px] md:min-h-[300px]">
              <div className="absolute inset-0 bg-blue-50/50 rounded-2xl" />
              <div className="relative flex flex-col items-center gap-3 sm:gap-6 w-full">
                <div className="bg-white px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-slate-200 shadow-sm font-semibold text-slate-700 text-xs sm:text-base flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-full w-full bg-blue-500"></span>
                  </span>
                  Central Cloud Engine
                </div>
                
                <div className="flex gap-2 sm:gap-4 w-full justify-between mt-0 sm:mt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 w-1/3 min-w-0">
                      <div className="h-6 sm:h-12 w-px bg-slate-300 border-l border-dashed" />
                      <div className="bg-white border-2 border-blue-100 rounded-xl p-2 sm:p-4 w-full text-center shadow-sm relative group hover:border-blue-300 transition-colors cursor-default">
                        <Database className="size-4 sm:size-8 mx-auto text-blue-500 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors" />
                        <div className="text-[9px] sm:text-xs font-bold text-slate-700 truncate">Hospital {String.fromCharCode(64 + i)}</div>
                        <div className="absolute -top-2 -right-2 bg-teal-100 text-teal-700 p-0.5 sm:p-1 rounded-full border border-white">
                          <Lock className="size-2.5 sm:size-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section Title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            Everything Your Hospital Needs
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A complete suite of clinical and administrative tools to run every aspect of your healthcare facility efficiently and effectively.
          </p>
        </div>

        {/* Feature Cards Grid (Bento Box style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white"
            >
              <CardContent className="pt-6">
                <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 group-hover:bg-blue-600 transition-colors duration-300 ring-1 ring-blue-100 group-hover:ring-blue-600">
                  <feature.icon className="size-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
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
