import { LoginForm } from "@/components/login-form";
import { getUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getUserFromCookies();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[520px] bg-[radial-gradient(820px_420px_at_10%_-10%,rgba(59,130,246,0.18),transparent),radial-gradient(900px_420px_at_90%_-20%,rgba(14,165,233,0.14),transparent)]" />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl text-center">
          <span className="chip">HA Agency Rental</span>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">
            Suivi des locations et rentabilite
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Un espace clair pour piloter vos locations, charges et performance.
          </p>
        </div>
        <div className="mt-10 w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
