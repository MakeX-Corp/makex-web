export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Refund Policy</h1>

      <div className="prose prose-zinc max-w-none">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Refund Eligibility
          </h2>
          <p className="text-gray-600 mb-4">
            We strive to provide the best possible service for our users. Our
            refund policy is as follows:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              Refund requests must be submitted within 14 days of purchase
            </li>
            <li>Service must not have been substantially used</li>
            <li>One-time refund policy per customer</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Refund Process
          </h2>
          <p className="text-gray-600 mb-4">To request a refund:</p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-600">
            <li>Contact our support team</li>
            <li>Provide your purchase information</li>
            <li>Explain the reason for your refund request</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Contact Information
          </h2>
          <div className="text-gray-600">
            <p className="mb-2">For refund requests, please contact us at:</p>
            <p className="mb-1">
              Email:{" "}
              <a
                href="mailto:contact@makex.app"
                className="text-blue-600 hover:text-blue-800"
              >
                contact@makex.app
              </a>
            </p>
            <p className="mt-4">
              131 Continental Dr, Suite 305
              <br />
              Newark, Delaware 19713
              <br />
              United States
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8 text-center">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
