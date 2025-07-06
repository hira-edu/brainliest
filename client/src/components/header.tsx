import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [location] = useLocation();
  const { isSignedIn, userName, signIn, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">ExamPractice Pro</h1>
              </Link>
            </div>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/">
                <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}>
                  Subjects
                </a>
              </Link>
              <Link href="/admin">
                <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === '/admin' ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}>
                  Admin
                </a>
              </Link>
            </div>
          </nav>
          <div className="flex items-center space-x-4">
            {!isSignedIn ? (
              <button 
                onClick={() => {
                  const name = prompt("Enter your name to sign in:");
                  if (name?.trim()) {
                    signIn(name.trim());
                  }
                }}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">Welcome, {userName}!</span>
                <button 
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
