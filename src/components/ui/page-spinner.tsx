export function PageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-muted border-t-foreground" />
      </div>
    </div>
  );
}
