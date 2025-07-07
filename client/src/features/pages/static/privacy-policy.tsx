import Header from "@/features/shared/components/header";
import Footer from "@/features/shared/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: July 6, 2025</p>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-slate max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    At Brainliest, we collect information that you provide directly to us, 
                    information we obtain automatically when you use our services, and information 
                    from third-party sources.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-3">Information You Provide</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Account registration information (name, email address, password)</li>
                    <li>Profile information and preferences</li>
                    <li>Payment and billing information</li>
                    <li>Communications with our support team</li>
                    <li>Feedback, reviews, and survey responses</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-3 mt-6">Automatically Collected Information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Learning progress and performance data</li>
                    <li>Usage patterns and time spent on activities</li>
                    <li>Device information and browser details</li>
                    <li>IP address and location data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use the information we collect to provide, maintain, and improve our services, 
                    as well as to personalize your learning experience.
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Provide and deliver our educational services</li>
                    <li>Personalize learning recommendations and content</li>
                    <li>Track progress and generate performance analytics</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send important updates and notifications</li>
                    <li>Provide customer support</li>
                    <li>Improve our platform and develop new features</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">3. Information Sharing and Disclosure</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties 
                    without your consent, except as described in this policy.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-3">We may share information:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>With service providers who assist us in operating our platform</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                    <li>With your explicit consent for specific purposes</li>
                    <li>In aggregated, anonymized form for research and analytics</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We implement appropriate technical and organizational measures to protect your 
                    personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication measures</li>
                    <li>Employee training on data protection</li>
                    <li>Incident response procedures</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">5. Your Rights and Choices</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You have certain rights regarding your personal information, depending on your location.
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Access and review your personal information</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt out of marketing communications</li>
                    <li>Restrict or object to certain processing activities</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze usage, 
                    and provide personalized content.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-3">Types of cookies we use:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Essential cookies:</strong> Required for basic platform functionality</li>
                    <li><strong>Performance cookies:</strong> Help us understand how you use our platform</li>
                    <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                    <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">7. International Data Transfers</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Your information may be transferred to and processed in countries other than your own. 
                    We ensure appropriate safeguards are in place to protect your information in accordance 
                    with applicable data protection laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our services are not intended for children under 13 years of age. We do not knowingly 
                    collect personal information from children under 13. If you believe we have collected 
                    information from a child under 13, please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">9. Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We retain your personal information for as long as necessary to provide our services, 
                    comply with legal obligations, resolve disputes, and enforce our agreements. When we 
                    no longer need your information, we will securely delete or anonymize it.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this privacy policy from time to time. We will notify you of any 
                    material changes by posting the new policy on this page and updating the "Last updated" 
                    date. Your continued use of our services after such changes constitutes acceptance 
                    of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about this privacy policy or our data practices, 
                    please contact us:
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm"><strong>Email:</strong> privacy@brainliest.com</p>
                    <p className="text-sm"><strong>Address:</strong> 123 Education Ave, San Francisco, CA 94105</p>
                    <p className="text-sm"><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}