import { redirect } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { resolveViewer } from "@/lib/auth/viewer";

export default async function ReportsPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return (
    <PlaceholderPage
      viewer={viewer}
      title="Reports"
      rows={["월간/연간 지출", "카테고리 비중", "가격 변동", "CSV 내보내기"]}
    />
  );
}
