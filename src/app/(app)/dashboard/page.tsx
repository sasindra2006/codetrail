import { DashboardOverview } from "@/components/dashboard-overview";
import { requireSession } from "@/lib/auth-server";
import { getProgressSnapshot } from "@/lib/progress";

export default async function DashboardPage() {
  const session = await requireSession();
  const progress = await getProgressSnapshot(session.user.id);
  return <DashboardOverview progress={progress} />;
}
