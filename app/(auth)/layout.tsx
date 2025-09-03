export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">NFL Pick'em</h1>
          <p className="mt-2 text-sm text-gray-600">
            Make your picks and compete with friends
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}