import { Question } from "@shared/schema";

interface FeedbackCardProps {
  question: Question;
  userAnswer: number;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export default function FeedbackCard({ question, userAnswer, onNext, isLastQuestion = false }: FeedbackCardProps) {
  const isCorrect = userAnswer === question.correctAnswer;

  return (
    <div className={`bg-white rounded-xl shadow-sm p-8 border-l-4 ${
      isCorrect ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isCorrect ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <i className={`fas ${isCorrect ? 'fa-check text-green-600' : 'fa-times text-red-600'}`}></i>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h4 className={`text-lg font-semibold mb-2 ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h4>
          <p className="text-gray-700 mb-4">
            {question.explanation}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Correct Answer: {String.fromCharCode(65 + question.correctAnswer)}
            </span>
            <button 
              onClick={onNext}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isLastQuestion ? 'Finish Exam' : 'Next Question'} 
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
