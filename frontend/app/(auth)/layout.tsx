export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
