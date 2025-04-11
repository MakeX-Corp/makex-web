export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-zinc">
        <p>This Privacy Policy ("Policy") describes in detail how MakeX ("we," "our," "us," or "the Company") collects, uses, maintains, protects, and discloses your personal information when you use our services, websites, and applications (collectively referred to as the "Services"). We are committed to protecting your privacy and handling your data in an open and transparent manner. By accessing or using our Services, you expressly acknowledge that you have read, understood, and agree to be bound by all terms outlined in this comprehensive policy.</p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account and Identity Information: This includes, but is not limited to, your email address, full name, profile pictures, authentication credentials, account preferences, and any other personal identifiers you voluntarily provide during account creation, profile updates, or through your interactions with our customer support team</li>
          <li>Service Usage and AI Interaction Data: We collect detailed information about your interactions with our AI system, including but not limited to: your queries and prompts, response preferences, interaction patterns, feature usage statistics, session duration, frequency of use, AI model preferences, and any feedback or ratings you provide regarding generated content</li>
          <li>Generated Content and Configuration Data: This encompasses all content, applications, and configurations created through our platform, including application source code, design preferences, customization parameters, deployment configurations, version history, and any associated metadata that helps us maintain and improve your experience</li>
          <li>Technical and Device Information: We automatically collect comprehensive technical data including, but not limited to, your Internet Protocol (IP) address, browser type and version, operating system and platform, device identifiers, mobile network information, access timestamps, time zone settings, browser plug-in types and versions, and other technology identifiers on the devices you use to access our Services</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Service Provision and Enhancement: We utilize your information to provide, maintain, and continuously enhance our AI app generation service. This includes: personalizing your user experience, optimizing AI model responses, improving code generation accuracy, customizing interface layouts, managing your account preferences, processing your requests, and delivering customer support. We also use this data to develop new features and services that better meet our users' evolving needs</li>
          <li>Communications and Engagement: We may use your contact information to send you important communications regarding your account, including but not limited to: service updates, technical notices, security alerts, support messages, maintenance notifications, feature announcements, newsletter subscriptions (where opted-in), billing information, and administrative messages. We may also send you educational content about maximizing the value of our Services</li>
          <li>Performance Analysis and Service Optimization: Your information helps us conduct detailed analysis of our service performance, including: monitoring system stability, analyzing usage patterns, tracking feature adoption, measuring service reliability, optimizing resource allocation, identifying potential improvements, conducting A/B testing, and maintaining quality standards. This analysis is crucial for ensuring optimal service delivery and user satisfaction</li>
          <li>Legal Compliance and Rights Protection: We process your information to comply with applicable legal obligations, respond to legal requests, enforce our terms of service, detect and prevent fraud, maintain security, and protect our rights and the rights of our users. This includes maintaining appropriate records for internal administrative purposes and defending our legal interests</li>
        </ul>

        <h2>3. Data Security</h2>
        <p>We implement comprehensive, industry-standard security measures and follow stringent best practices to protect your personal information throughout its lifecycle. Our multi-layered security approach includes: end-to-end encryption for data transmission, secure socket layer (SSL) technology, advanced firewalls, intrusion detection systems, regular security audits, vulnerability assessments, penetration testing, secure data storage with encryption at rest, access control mechanisms, authentication protocols, and regular security training for our personnel. We maintain documented security policies and procedures that are regularly reviewed and updated to address emerging threats and technological advances. Despite these extensive measures, no method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.</p>

        <h2>4. Contact Us</h2>
        <p>For any privacy-related inquiries, concerns, requests for information access, or data-related rights exercise, please don't hesitate to contact our dedicated Privacy Team through any of the following channels:<br /><br />
        Email: contact@makex.app<br /><br />
        Official Mailing Address:<br />
        Privacy Department<br />
        Bit Wise LLC<br />
        131 Continental Dr, Suite 305<br />
        Newark, Delaware 19713<br />
        United States<br /><br />
        We strive to respond to all privacy-related inquiries within 5 business days of receipt.</p>

        <p className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
} 