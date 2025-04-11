export default function AiEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {children}
    </div>
  )
} 