import { Question } from "@shared/schema";
import { useState } from "react";

interface QuestionCardProps {
  question: Question;
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

  const handleAnswerSelect = (index: number) => {
    setLocalSelectedAnswer(index);
    onAnswer(index);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {question.text}
        </h3>
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
