import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using Brainliest. 
              By accessing our platform, you agree to these terms and conditions.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 6, 2025
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Acceptance of Terms */}
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  By accessing and using Brainliest ("the Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p>
                  These Terms of Service may be updated from time to time. Continued use of the Service after any such 
                  changes shall constitute your consent to such changes.
                </p>
              </CardContent>
            </Card>

            {/* Use of Service */}
            <Card>
              <CardHeader>
                <CardTitle>2. Use of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Brainliest provides online practice exams and study materials for various certification programs. 
                  The Service is intended for educational purposes only.
                </p>
                <p><strong>You agree to:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Service only for lawful purposes</li>
                  <li>Not share your account credentials with others</li>
                  <li>Not attempt to reverse engineer or copy our content</li>
                  <li>Not use automated tools to access the Service</li>
                  <li>Respect intellectual property rights</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  To access certain features of the Service, you may be required to create an account. You are responsible 
                  for safeguarding your account information and for all activities that occur under your account.
                </p>
                <p>
                  You agree to notify us immediately of any unauthorized use of your account. We reserve the right to 
                  suspend or terminate accounts that violate these terms.
                </p>
              </CardContent>
            </Card>

            {/* Content and Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle>4. Content and Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  All content provided through the Service, including but not limited to text, graphics, logos, 
                  practice questions, and software, is the property of Brainliest or its content suppliers and 
                  is protected by copyright and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative works of any content without 
                  express written permission from Brainliest.
                </p>
              </CardContent>
            </Card>

            {/* Privacy and Data */}
            <Card>
              <CardHeader>
                <CardTitle>5. Privacy and Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by 
                  our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p>
                  We collect and process data to provide and improve our services, including tracking your progress, 
                  generating analytics, and personalizing your learning experience.
                </p>
              </CardContent>
            </Card>

            {/* Subscription and Payments */}
            <Card>
              <CardHeader>
                <CardTitle>6. Subscription and Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Some features of the Service may require a paid subscription. Subscription fees are billed in advance 
                  and are non-refundable except as expressly stated in our refund policy.
                </p>
                <p>
                  We offer a 30-day money-back guarantee for new subscribers. Refund requests must be submitted within 
                  30 days of the initial purchase.
                </p>
                <p>
                  Subscription prices may change with 30 days' notice. Changes will not affect your current billing cycle.
                </p>
              </CardContent>
            </Card>

            {/* Disclaimer of Warranties */}
            <Card>
              <CardHeader>
                <CardTitle>7. Disclaimer of Warranties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Service is provided "as is" without any representations or warranties, express or implied. 
                  ExamPrep Pro makes no representations or warranties in relation to the Service or the information 
                  and materials provided.
                </p>
                <p>
                  We do not guarantee that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Service will meet your specific requirements</li>
                  <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                  <li>Use of the Service will guarantee exam success</li>
                  <li>All information provided is accurate or complete</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card>
              <CardHeader>
                <CardTitle>8. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  In no event shall Brainliest, its directors, employees, or agents be liable for any indirect, 
                  consequential, or incidental damages arising out of your use of the Service.
                </p>
                <p>
                  Our total liability to you for all damages, losses, and causes of action shall not exceed the 
                  amount you paid to us in the 12 months prior to the claim.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle>9. Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                  for any reason, including breach of these Terms.
                </p>
                <p>
                  You may terminate your account at any time by contacting our support team. Upon termination, 
                  your right to use the Service will cease immediately.
                </p>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card>
              <CardHeader>
                <CardTitle>10. Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, 
                  United States, without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts 
                  located in San Francisco County, California.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card>
              <CardHeader>
                <CardTitle>11. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of significant changes 
                  via email or through the Service.
                </p>
                <p>
                  Your continued use of the Service after the effective date of any changes constitutes acceptance 
                  of the revised Terms.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>12. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Email:</strong> legal@examprep.pro</p>
                  <p><strong>Address:</strong> 123 Education Ave, San Francisco, CA 94105</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}