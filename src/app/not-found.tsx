import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full">
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.464-.881-6.08-2.33"
            />
          </svg>
        </div>
        <div className="mt-4">
          <h1 className="text-xl font-medium text-gray-900">
            Pagina niet gevonden
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            De pagina die je zoekt bestaat niet of is verplaatst.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Terug naar Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
