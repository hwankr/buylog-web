import { enterDemoMode, login } from "@/app/login/actions";
import { BrandMark } from "@/components/ui/brand-mark";
import { buttonClassName } from "@/components/ui/button";
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
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-canvas p-2 text-ink">
            <BrandMark />
          </div>
          <div>
            <h1 className="font-display text-3xl leading-tight text-ink">
              buylog web
            </h1>
            <p className="text-sm text-muted">소비재 관리 대시보드</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-error/30 bg-canvas px-3 py-2 text-sm text-error">
            {errorMessage}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-body">
            이메일
            <input
              className="mt-1 h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-body">
            비밀번호
            <input
              className="mt-1 h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className={buttonClassName("primary", "w-full")}
            type="submit"
          >
            로그인
          </button>
        </form>

        {demoEnabled ? (
          <form action={enterDemoMode} className="mt-3">
            <button
              className={buttonClassName("secondary", "w-full")}
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
