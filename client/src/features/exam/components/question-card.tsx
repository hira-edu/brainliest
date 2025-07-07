import { Question } from "@shared/schema";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/features/shared/hooks/use-toast";

interface QuestionCardProps {
  question: Question | undefined;
  onAnswer: (answerIndex: number) => void;
  onPrevious?: () => void;
  onSubmit: () => void;
  selectedAnswer?: number;
  canGoPrevious?: boolean;
}

export default function QuestionCard({ 
  question, 
  onAnswer, 
  onPrevious, 
  onSubmit, 
  selectedAnswer,
  canGoPrevious = false 
}: QuestionCardProps) {
  const [localSelectedAnswer, setLocalSelectedAnswer] = useState<number | undefined>(selectedAnswer);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiHelp, setAiHelp] = useState<string>("");
  const { toast } = useToast();

  // Reset local state when question changes or selectedAnswer prop changes
  useEffect(() => {
    setLocalSelectedAnswer(selectedAnswer);
    setShowAiHelp(false);
    setAiHelp("");
  }, [question?.id, selectedAnswer]);

  const getAiHelpMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest("/api/ai/question-help", "POST", { questionId });
      return response.json();
    },
    onSuccess: (data) => {
      setAiHelp(data.help);
      setShowAiHelp(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to get AI help right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswerSelect = (index: number) => {
    setLocalSelectedAnswer(index);
    onAnswer(index);
  };

  const handleGetAiHelp = () => {
    if (question?.id) {
      getAiHelpMutation.mutate(question.id);
    }
  };

  // If no question is provided, show loading state
  if (!question) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
        <div className="text-center text-gray-500">
          Loading question...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
            {question.text}
          </h3>
          <button
            onClick={handleGetAiHelp}
            disabled={getAiHelpMutation.isPending}
            className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-robot mr-2"></i>
            {getAiHelpMutation.isPending ? "Loading..." : "AI Help"}
          </button>
        </div>

        {showAiHelp && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center mb-2">
              <i className="fas fa-robot text-purple-600 mr-2"></i>
              <span className="font-medium text-purple-800">AI Study Helper</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{aiHelp}</p>
            <button
              onClick={() => setShowAiHelp(false)}
              className="mt-2 text-purple-600 text-sm hover:text-purple-800"
            >
              Hide
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label 
            key={index}
            className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
          >
            <input 
              type="radio" 
              name="answer" 
              value={index}
              checked={localSelectedAnswer === index}
              onChange={() => handleAnswerSelect(index)}
              className="mt-1 mr-3 text-primary focus:ring-primary" 
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-700">{option}</span>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        {canGoPrevious ? (
          <button 
            onClick={onPrevious}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <i className="fas fa-arrow-left mr-2"></i>Previous
          </button>
        ) : (
          <div></div>
        )}
        <button 
          onClick={onSubmit}
          disabled={localSelectedAnswer === undefined}
          className="px-8 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
