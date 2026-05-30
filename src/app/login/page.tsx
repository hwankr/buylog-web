import { BarChart3 } from "lucide-react";

import { enterDemoMode, login } from "@/app/login/actions";
import { isDevFallbackEnabled } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

const ERROR_MESSAGES: Record<string, string> = {
  "missing-config": "Supabase 환경 변수가 설정되지 않았습니다.",
  "invalid-credentials": "이메일 또는 비밀번호를 확인해 주세요.",
  "demo-disabled": "시연 모드가 비활성화되어 있습니다.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;
  const demoEnabled = isDevFallbackEnabled();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-slate-950 p-2 text-white">
            <BarChart3 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">buylog web</h1>
            <p className="text-sm text-slate-500">소비재 관리 대시보드</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            이메일
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            비밀번호
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="h-10 w-full rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            로그인
          </button>
        </form>

        {demoEnabled ? (
          <form action={enterDemoMode} className="mt-3">
            <button
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              type="submit"
            >
              시연 모드로 보기
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
