/**
 * Hierarchical Selector Component
 * Displays resource relationships using slugs instead of IDs
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Subject, Exam } from "@shared/schema";

interface HierarchicalSelectorProps {
  selectedSubjectId?: number;
  selectedExamId?: number;
  onSubjectChange?: (subjectId: number, subjectSlug: string) => void;
  onExamChange?: (examId: number, examSlug: string) => void;
  showExams?: boolean;
  showQuestions?: boolean;
  readOnly?: boolean;
}

export function HierarchicalSelector({
  selectedSubjectId,
  selectedExamId,
  onSubjectChange,
  onExamChange,
  showExams = false,
  showQuestions = false,
  readOnly = false
}: HierarchicalSelectorProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Fetch all subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch exams for selected subject
  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams", selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const response = await fetch(`/api/exams?subjectId=${selectedSubjectId}`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      return response.json();
    },
    enabled: !!selectedSubjectId && showExams,
  });

  // Update selected resources when IDs change
  useEffect(() => {
    if (selectedSubjectId && subjects) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      setSelectedSubject(subject || null);
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    if (selectedExamId && exams) {
      const exam = exams.find(e => e.id === selectedExamId);
      setSelectedExam(exam || null);
    }
  }, [selectedExamId, exams]);

  const handleSubjectSelect = (subjectId: string) => {
    const id = parseInt(subjectId);
    const subject = subjects?.find(s => s.id === id);
    if (subject && onSubjectChange) {
      onSubjectChange(id, subject.slug || `subject-${id}`);
      setSelectedSubject(subject);
      // Reset exam selection when subject changes
      setSelectedExam(null);
    }
  };

  const handleExamSelect = (examId: string) => {
    const id = parseInt(examId);
    const exam = exams?.find(e => e.id === id);
    if (exam && onExamChange) {
      onExamChange(id, exam.slug || `exam-${id}`);
      setSelectedExam(exam);
    }
  };

  const getHierarchicalPath = () => {
    const parts = [];
    
    if (selectedSubject) {
      parts.push({
        type: 'subject',
        name: selectedSubject.name,
        slug: selectedSubject.slug || `subject-${selectedSubject.id}`,
        url: `/subject/${selectedSubject.slug || selectedSubject.id}`
      });
    }

    if (selectedExam) {
      parts.push({
        type: 'exam',
        name: selectedExam.title,
        slug: selectedExam.slug || `exam-${selectedExam.id}`,
        url: `/exam/${selectedExam.slug || selectedExam.id}`
      });
    }

    return parts;
  };

  const hierarchicalPath = getHierarchicalPath();

  return (
    <div className="space-y-4">
      {/* Hierarchical Path Display */}
      {hierarchicalPath.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Path:</span>
          <div className="flex items-center gap-1">
            {hierarchicalPath.map((part, index) => (
              <div key={part.slug} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Badge variant="outline" className="text-xs">
                  {part.name}
                </Badge>
                <code className="text-xs text-gray-500">/{part.slug}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(part.url, '_blank')}
                  title={`View ${part.type} in new tab`}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Subject</label>
        {readOnly && selectedSubject ? (
          <div className="flex items-center gap-2">
            <Badge>{selectedSubject.name}</Badge>
            <code className="text-xs text-gray-500">/{selectedSubject.slug}</code>
          </div>
        ) : (
          <Select value={selectedSubjectId?.toString()} onValueChange={handleSubjectSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject..." />
            </SelectTrigger>
            <SelectContent>
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{subject.name}</span>
                    <code className="text-xs text-gray-500">/{subject.slug}</code>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Exam Selector */}
      {showExams && selectedSubjectId && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Exam</label>
          {readOnly && selectedExam ? (
            <div className="flex items-center gap-2">
              <Badge>{selectedExam.title}</Badge>
              <code className="text-xs text-gray-500">/{selectedExam.slug}</code>
            </div>
          ) : (
            <Select value={selectedExamId?.toString()} onValueChange={handleExamSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exam..." />
              </SelectTrigger>
              <SelectContent>
                {exams?.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{exam.title}</span>
                      <code className="text-xs text-gray-500">/{exam.slug}</code>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Hierarchical URLs Preview */}
      {hierarchicalPath.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">SEO-Friendly URLs:</div>
          <div className="space-y-1">
            {selectedSubject && (
              <div className="text-xs font-mono text-blue-600">
                /subject/{selectedSubject.slug || selectedSubject.id}
              </div>
            )}
            {selectedExam && selectedSubject && (
              <div className="text-xs font-mono text-blue-600">
                /subjects/{selectedSubject.slug}/exams/{selectedExam.slug}
              </div>
            )}
            {showQuestions && selectedExam && selectedSubject && (
              <div className="text-xs font-mono text-blue-600">
                /subjects/{selectedSubject.slug}/exams/{selectedExam.slug}/questions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}