import Header from "../../shared/components/header";
import Footer from "../../shared/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Users, Target, Lightbulb, Award, Globe, BookOpen } from "lucide-react";

export default function OurStory() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Our Story
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transforming professional certification preparation through innovative technology 
              and personalized learning experiences.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  We believe that quality education and professional development should be accessible 
                  to everyone, regardless of their background or location. Our mission is to democratize 
                  exam preparation by providing intelligent, adaptive learning tools that help individuals 
                  achieve their certification goals.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Founded in 2025, Brainliest emerged from the recognition that traditional 
                  study methods weren't keeping pace with the evolving demands of professional 
                  certifications and the diverse learning styles of modern professionals.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">50K+</h3>
                    <p className="text-sm text-muted-foreground">Active Learners</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-4 text-green-600" />
                    <h3 className="font-semibold mb-2">25+</h3>
                    <p className="text-sm text-muted-foreground">Certification Programs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Globe className="h-8 w-8 mx-auto mb-4 text-purple-600" />
                    <h3 className="font-semibold mb-2">100+</h3>
                    <p className="text-sm text-muted-foreground">Countries Served</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 mx-auto mb-4 text-orange-600" />
                    <h3 className="font-semibold mb-2">92%</h3>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 mb-4 text-blue-600" />
                  <CardTitle>Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We strive for excellence in every aspect of our platform, from content quality 
                    to user experience, ensuring our learners receive the best preparation possible.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Lightbulb className="h-8 w-8 mb-4 text-yellow-600" />
                  <CardTitle>Innovation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We continuously innovate with AI-powered insights, adaptive learning algorithms, 
                    and personalized study recommendations to enhance the learning experience.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 mb-4 text-green-600" />
                  <CardTitle>Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We foster a supportive learning community where professionals can share knowledge, 
                    experiences, and encourage each other on their certification journeys.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    JS
                  </div>
                  <h3 className="font-bold text-lg mb-2">John Smith</h3>
                  <p className="text-muted-foreground text-sm mb-3">CEO & Co-Founder</p>
                  <div className="flex justify-center space-x-2 mb-3">
                    <Badge variant="secondary">PMP</Badge>
                    <Badge variant="secondary">MBA</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Former McKinsey consultant with 15+ years in education technology 
                    and professional development.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    MJ
                  </div>
                  <h3 className="font-bold text-lg mb-2">Maria Johnson</h3>
                  <p className="text-muted-foreground text-sm mb-3">CTO & Co-Founder</p>
                  <div className="flex justify-center space-x-2 mb-3">
                    <Badge variant="secondary">PhD CS</Badge>
                    <Badge variant="secondary">AI/ML</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Former Google AI researcher specializing in adaptive learning systems 
                    and educational technology.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    DL
                  </div>
                  <h3 className="font-bold text-lg mb-2">David Lee</h3>
                  <p className="text-muted-foreground text-sm mb-3">Head of Content</p>
                  <div className="flex justify-center space-x-2 mb-3">
                    <Badge variant="secondary">AWS</Badge>
                    <Badge variant="secondary">CISSP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Certification expert with multiple industry credentials and 12+ years 
                    developing training content.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Journey Section */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2025</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Foundation & Launch</h3>
                  <p className="text-muted-foreground">
                    Founded ExamPrep Pro with a vision to revolutionize professional certification 
                    preparation. Launched our first platform with PMP and AWS certification tracks.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">Q2</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">AI Integration</h3>
                  <p className="text-muted-foreground">
                    Integrated advanced AI capabilities for personalized learning recommendations 
                    and adaptive question difficulty based on user performance patterns.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">Q3</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Platform Expansion</h3>
                  <p className="text-muted-foreground">
                    Expanded to cover 25+ certification programs including CompTIA, Google Cloud, 
                    Azure, and various university-level subjects across multiple disciplines.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">Now</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Global Impact</h3>
                  <p className="text-muted-foreground">
                    Serving 50,000+ active learners across 100+ countries with comprehensive 
                    analytics, community features, and continuous platform improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-8">Looking Forward</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              As we continue to grow, our commitment remains the same: empowering professionals 
              worldwide to achieve their career goals through innovative, accessible, and effective 
              certification preparation.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're constantly evolving, adding new features, expanding our content library, 
              and refining our AI algorithms to provide the most personalized and effective 
              learning experience possible. Join us on this journey toward professional excellence.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}