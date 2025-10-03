export default function AdminHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Brainliest Admin Portal</h1>
        <p className="text-lg text-gray-600">Manage exams, questions, and content</p>
        <a
          href="/explanations"
          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          View AI explanation activity
        </a>
      </div>
    </main>
  );
}
