import { redirect } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { resolveViewer } from "@/lib/auth/viewer";

export default async function GroupsPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return (
    <PlaceholderPage
      viewer={viewer}
      title="Groups"
      rows={["내 그룹", "멤버 역할", "그룹 리포트", "권한 관리"]}
    />
  );
}
