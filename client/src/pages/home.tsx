import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Subject } from "@shared/schema";
import SubjectCard from "@/components/subject-card";
import Header from "@/components/header";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const handleSelectSubject = (subjectId: number) => {
    setLocation(`/subject/${subjectId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading subjects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Certification Path</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select from our comprehensive collection of practice exams designed to help you succeed in your certification journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {subjects?.map((subject) => (
            <SubjectCard 
              key={subject.id} 
              subject={subject} 
              onClick={() => handleSelectSubject(subject.id)}
            />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Popular Certifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['CISSP', 'CISA', 'Azure', 'Google Cloud'].map((cert) => (
              <div 
                key={cert}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <i className="fas fa-certificate text-primary mr-3"></i>
                <span className="text-sm font-medium text-gray-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
