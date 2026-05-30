import { redirect } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { resolveViewer } from "@/lib/auth/viewer";

export default async function ItemsPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return (
    <PlaceholderPage
      viewer={viewer}
      title="Items"
      rows={["품목 목록", "구매 이력", "재고 스냅샷", "사용 이벤트"]}
    />
  );
}
