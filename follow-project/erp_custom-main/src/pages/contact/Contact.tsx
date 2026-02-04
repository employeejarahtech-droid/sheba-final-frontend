import { Mail, Phone, MapPin, Globe } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

      <p className="text-gray-700 mb-8">
        If you need assistance with the <strong>InleadsIT ERP System</strong>,
        please use the contact information below. Our team is available to
        support system administrators and authorized users.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Company Information</h2>

          <div className="flex items-start gap-3 mb-3 text-gray-700">
            <MapPin className="w-5 h-5 mt-1" />
            <span>
              InleadsIT<br />
              Dhaka, Bangladesh
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3 text-gray-700">
            <Phone className="w-5 h-5" />
            <span>+880 XXX-XXXXXXX</span>
          </div>

          <div className="flex items-center gap-3 mb-3 text-gray-700">
            <Mail className="w-5 h-5" />
            <span>support@inleadsit.com</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Globe className="w-5 h-5" />
            <span>www.inleadsit.com</span>
          </div>
        </div>

        {/* Support Info */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Support & Assistance</h2>

          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>ERP system access & login issues</li>
            <li>Role & permission management support</li>
            <li>Technical issues and bug reports</li>
            <li>System configuration assistance</li>
          </ul>

          <p className="text-gray-600 mt-4 text-sm">
            Support hours: Sunday – Friday, 09:00 AM – 6:00 PM (BST)
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-8 text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} InleadsIT ERP System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
