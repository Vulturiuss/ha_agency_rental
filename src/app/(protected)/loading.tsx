export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 rounded-full bg-slate-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-5">
            <div className="h-3 w-24 rounded bg-slate-200/80" />
            <div className="mt-4 h-8 w-32 rounded bg-slate-200/80" />
            <div className="mt-3 h-3 w-20 rounded bg-slate-200/60" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card p-5">
            <div className="h-3 w-24 rounded bg-slate-200/80" />
            <div className="mt-4 h-6 w-40 rounded bg-slate-200/80" />
            <div className="mt-4 h-48 w-full rounded-xl bg-slate-200/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
