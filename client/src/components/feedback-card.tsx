import { Question, Comment } from "@shared/schema";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeedbackCardProps {
  question: Question;
  userAnswer: number;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export default function FeedbackCard({ question, userAnswer, onNext, isLastQuestion = false }: FeedbackCardProps) {
  const isCorrect = userAnswer === question.correctAnswer;
  const [showComments, setShowComments] = useState(false);
  const [showAiExplanation, setShowAiExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["/api/comments", question.id],
    queryFn: async () => {
      const response = await fetch(`/api/comments?questionId=${question.id}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const getAiExplanationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/explain-answer", { 
        questionId: question.id, 
        userAnswer 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiExplanation(data.explanation);
      setShowAiExplanation(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to get AI explanation right now.",
        variant: "destructive",
      });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Simple mock authentication - in real app would call actual auth service
      if (credentials.email && credentials.password) {
        return { user: { name: credentials.email.split('@')[0], email: credentials.email } };
      }
      throw new Error("Invalid credentials");
    },
    onSuccess: (data) => {
      setIsSignedIn(true);
      setAuthorName(data.user.name);
      setShowSignIn(false);
      setEmail("");
      setPassword("");
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { questionId: number; authorName: string; content: string }) => {
      if (!isSignedIn) {
        throw new Error("Please sign in to comment");
      }
      const response = await apiRequest("POST", "/api/comments", commentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", question.id] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate({
      questionId: question.id,
      authorName: authorName.trim(),
      content: newComment.trim(),
    });
  };

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    signInMutation.mutate({
      email: email.trim(),
      password: password.trim(),
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden transition-all duration-300 ${
      isCorrect ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="p-8">
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

            {/* AI Explanation Section */}
            <div className="mb-4">
              <button
                onClick={() => getAiExplanationMutation.mutate()}
                disabled={getAiExplanationMutation.isPending || showAiExplanation}
                className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-brain mr-2"></i>
                {getAiExplanationMutation.isPending ? "Getting AI explanation..." : 
                 showAiExplanation ? "AI explanation shown below" : "Get AI explanation"}
              </button>
              
              {showAiExplanation && (
                <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-brain text-purple-600 mr-2"></i>
                    <span className="font-medium text-purple-800">AI Detailed Explanation</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{aiExplanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Correct Answer: {String.fromCharCode(65 + question.correctAnswer)}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Comments ({comments?.length || 0})
                </button>
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
      </div>

      {/* Comments Section with Slide Animation */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        showComments ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h5 className="font-semibold text-gray-900 mb-4">Discussion</h5>
          
          {/* Sign In / Add Comment Form */}
          <div className="mb-4 p-4 bg-white rounded-lg border">
            {!isSignedIn ? (
              <>
                {!showSignIn ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">Please sign in to join the discussion</p>
                    <button
                      onClick={() => setShowSignIn(true)}
                      className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Sign In to Comment
                    </button>
                  </div>
                ) : (
                  <div>
                    <h6 className="font-medium text-gray-900 mb-3">Sign In to Comment</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSignIn}
                        disabled={signInMutation.isPending}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {signInMutation.isPending ? "Signing In..." : "Sign In"}
                      </button>
                      <button
                        onClick={() => setShowSignIn(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Signed in as: <strong>{authorName}</strong></span>
                  <button
                    onClick={() => {
                      setIsSignedIn(false);
                      setAuthorName("");
                      setNewComment("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
                <textarea
                  placeholder="Share your thoughts about this question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary mb-3"
                />
                <button
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                </button>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {comments?.map((comment) => (
              <div key={comment.id} className="bg-white p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 text-sm">{comment.content}</p>
              </div>
            ))}
            {(!comments || comments.length === 0) && (
              <p className="text-gray-500 text-sm italic">No comments yet. Be the first to discuss this question!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
