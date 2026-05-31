import { enterDemoMode, login } from "@/app/login/actions";
import { BrandMark } from "@/components/ui/brand-mark";
import { buttonClassName } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
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
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-canvas p-2 text-ink">
              <BrandMark />
            </div>
            <div>
              <h1 className="font-display text-3xl leading-tight text-ink">
                buylog web
              </h1>
              <p className="text-sm text-muted">
                소비와 재구매를 읽는 관리 대시보드
              </p>
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
            <button className={buttonClassName("primary", "w-full")} type="submit">
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
        </div>
      </section>

      <aside className="hidden bg-surface-dark p-8 text-on-dark lg:flex lg:flex-col lg:justify-between">
        <div>
          <StatusPill tone="dark">Demo workspace</StatusPill>
          <h2 className="mt-5 font-display text-4xl leading-tight">
            구매 기록을 다음 행동으로 바꿉니다.
          </h2>
          <p className="mt-4 text-sm leading-6 text-on-dark-soft">
            리포트, 물품, 재구매 흐름을 하나의 관리 화면에서 확인하도록
            설계했습니다.
          </p>
        </div>
        <div className="rounded-lg bg-surface-dark-elevated p-4">
          <div className="flex items-center justify-between border-b border-surface-dark-soft pb-3 text-sm">
            <span className="text-on-dark-soft">이번 달 구매액</span>
            <span className="font-medium text-on-dark">₩128,900</span>
          </div>
          <div className="flex items-center justify-between pt-3 text-sm">
            <span className="text-on-dark-soft">재구매 예상</span>
            <span className="font-medium text-on-dark">30일 기준</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
