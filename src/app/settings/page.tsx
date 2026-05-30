import { redirect } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { resolveViewer } from "@/lib/auth/viewer";

export default async function SettingsPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return (
    <PlaceholderPage
      viewer={viewer}
      title="Settings"
      rows={["카테고리", "알림/리포트", "기본 기간", "Supabase 연결"]}
    />
  );
}
