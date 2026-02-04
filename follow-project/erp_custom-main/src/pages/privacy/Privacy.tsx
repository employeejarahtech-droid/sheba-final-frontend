export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-gray-700 mb-6">
        This Privacy Policy explains how <strong>InleadsIT ERP System</strong> (“we”, “our”, “us”)
        collects, uses, stores, and protects information when you use our ERP platform.
        By accessing or using this system, you agree to the terms outlined in this policy.
      </p>

      {/* Section 1 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
        <p className="text-gray-700 mb-2">
          We may collect the following types of information:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>User account details (name, email, role, permissions)</li>
          <li>Company and organizational data</li>
          <li>Operational and transactional ERP data</li>
          <li>System logs, activity history, and usage data</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>To operate and manage ERP features and modules</li>
          <li>To control access based on roles and permissions</li>
          <li>To improve system performance and user experience</li>
          <li>To maintain security, auditing, and compliance</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Data Security</h2>
        <p className="text-gray-700">
          We implement industry-standard security measures to protect your data,
          including access control, authentication, encryption, and monitoring.
          Only authorized users can access sensitive ERP data based on assigned roles.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Data Sharing</h2>
        <p className="text-gray-700">
          We do not sell or share your data with third parties except when required
          by law or necessary for system operation (such as hosting, security, or
          compliance services).
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. User Responsibilities</h2>
        <p className="text-gray-700">
          Users are responsible for maintaining the confidentiality of their login
          credentials and ensuring that ERP data is used only for authorized business purposes.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Changes to This Policy</h2>
        <p className="text-gray-700">
          InleadsIT reserves the right to update this Privacy Policy at any time.
          Any changes will be reflected within the ERP system.
        </p>
      </section>

      {/* Footer */}
      <div className="border-t pt-4 mt-8 text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} InleadsIT ERP System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
