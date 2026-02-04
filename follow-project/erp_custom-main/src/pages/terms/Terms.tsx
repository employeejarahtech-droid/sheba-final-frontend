export default function Terms() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

      <p className="text-gray-700 mb-6">
        These Terms & Conditions govern the use of the <strong>InleadsIT ERP System</strong>.
        By accessing or using this system, you agree to comply with these terms.
        If you do not agree, you must not use the ERP system.
      </p>

      {/* Section 1 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. System Access & Usage</h2>
        <p className="text-gray-700">
          Access to the ERP system is provided only to authorized users assigned
          by the company owner or system administrator. Users must use the system
          strictly for legitimate business purposes.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. User Accounts & Security</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Users are responsible for safeguarding their login credentials</li>
          <li>Account sharing is strictly prohibited</li>
          <li>Any unauthorized access must be reported immediately</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Data Ownership</h2>
        <p className="text-gray-700">
          All business data entered into the ERP system remains the property of
          the respective organization. InleadsIT does not claim ownership over
          customer or company data.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Prohibited Activities</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Attempting to bypass security or access restricted modules</li>
          <li>Uploading malicious code or harmful data</li>
          <li>Misusing ERP data for non-business or illegal purposes</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. System Availability</h2>
        <p className="text-gray-700">
          While we strive for high availability, InleadsIT does not guarantee
          uninterrupted access. Scheduled maintenance or unforeseen issues
          may result in temporary downtime.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
        <p className="text-gray-700">
          InleadsIT shall not be held liable for any direct, indirect, or incidental
          damages resulting from the use or inability to use the ERP system.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Termination</h2>
        <p className="text-gray-700">
          We reserve the right to suspend or terminate access to the ERP system
          if these terms are violated or if misuse is detected.
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
        <p className="text-gray-700">
          InleadsIT may update these Terms & Conditions at any time. Continued use
          of the ERP system after changes constitutes acceptance of the updated terms.
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
