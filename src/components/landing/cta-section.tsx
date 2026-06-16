import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-800">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="relative container px-4 py-20 mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-purple-100 mb-10 max-w-2xl mx-auto">
          Join hospitals already using HMS to streamline their
          operations and deliver better patient care. Start your free trial
          today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-purple-700 hover:bg-white/90 font-semibold text-base px-8 h-12"
          >
            <Link to="/register">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold text-base px-8 h-12"
          >
            <Link to="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
