export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>

      <div className="prose prose-zinc">
        <p>
          These Terms and Conditions ("Terms") constitute a legally binding agreement between you
          ("User," "you," or "your") and MakeX ("we," "our," "us," or "the Company") governing your
          access to and use of our AI-powered application development platform, including all
          associated websites, services, tools, and applications (collectively referred to as the
          "Services"). By accessing, browsing, or otherwise using our Services, you expressly
          acknowledge that you have read, understood, and agree to be bound by all terms and
          conditions set forth in this comprehensive agreement.
        </p>

        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing and using MakeX's Services, you represent and warrant that you have the legal
          capacity to enter into this agreement and that you will comply with all applicable laws
          and regulations. If you are using the Services on behalf of an organization, you represent
          and warrant that you have the authority to bind that organization to these Terms. Your
          continued use of the Services constitutes your ongoing acceptance of these Terms,
          including any modifications or updates we may make from time to time. We reserve the right
          to modify these Terms at any time, and such modifications will be effective immediately
          upon posting. It is your responsibility to review these Terms periodically for any
          changes.
        </p>

        <h2>2. Service Description</h2>
        <p>
          MakeX provides an innovative, AI-powered platform that enables users to create, develop,
          and deploy iOS applications through intuitive text-based interactions. Our Services
          include, but are not limited to:
        </p>
        <ul>
          <li>AI-powered code generation and application development tools</li>
          <li>Automated app configuration and deployment services</li>
          <li>User interface design assistance and optimization</li>
          <li>Code review and quality assurance features</li>
          <li>Development environment setup and management</li>
          <li>Technical support and documentation resources</li>
        </ul>
        <p>
          While we strive to provide accurate and reliable services, we do not guarantee that the
          generated applications will be suitable for all purposes or meet specific requirements.
          Users are responsible for reviewing, testing, and modifying generated code as necessary
          for their intended use.
        </p>

        <h2>3. User Obligations</h2>
        <p>As a user of our Services, you agree to:</p>
        <ul>
          <li>
            Provide accurate, current, and complete information during registration and account
            maintenance
          </li>
          <li>
            Maintain the confidentiality and security of your account credentials and authentication
            information
          </li>
          <li>Promptly notify us of any unauthorized access to or use of your account</li>
          <li>
            Comply with all applicable local, state, national, and international laws and
            regulations
          </li>
          <li>Not use the Services for any illegal, unauthorized, or prohibited purposes</li>
          <li>
            Not interfere with or disrupt the Services or servers and networks connected to the
            Services
          </li>
          <li>
            Not attempt to gain unauthorized access to any portion of the Services or any other
            systems or networks
          </li>
          <li>
            Not use the Services to create or distribute malicious software or engage in any form of
            cyberattack
          </li>
        </ul>

        <h2>4. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the Services, including but not limited to
          text, graphics, logos, icons, images, audio clips, digital downloads, data compilations,
          software, and the design, selection, and arrangement thereof, are the exclusive property
          of MakeX or its licensors and are protected by international copyright, trademark, patent,
          trade secret, and other intellectual property laws.
        </p>
        <p>
          Users retain all rights to their original content and applications created using our
          Services. The AI-generated code and applications are provided under a limited,
          non-exclusive, non-transferable, revocable license for personal or commercial use, subject
          to these Terms. You may not:
        </p>
        <ul>
          <li>
            Modify, adapt, translate, reverse engineer, decompile, or disassemble any portion of the
            Services
          </li>
          <li>
            Remove any copyright, trademark, or other proprietary notices from any portion of the
            Services
          </li>
          <li>
            Reproduce, duplicate, copy, sell, resell, or otherwise exploit any portion of the
            Services without express written permission
          </li>
          <li>
            Use any automated means to access the Services or collect any information from the
            Services
          </li>
        </ul>

        <h2>5. Contact Information</h2>
        <p>
          For any questions, concerns, or legal notices regarding these Terms, please contact us
          through any of the following channels:
          <br />
          <br />
          Email: contact@makex.app
          <br />
          <br />
          Official Mailing Address:
          <br />
          Legal Department
          <br />
          Bit Wise LLC
          <br />
          131 Continental Dr, Suite 305
          <br />
          Newark, Delaware 19713
          <br />
          United States
          <br />
          <br />
          We strive to respond to all legal inquiries within 5 business days of receipt.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
