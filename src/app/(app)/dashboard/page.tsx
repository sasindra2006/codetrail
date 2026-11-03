import { DashboardOverview } from "@/components/dashboard-overview";
import { requireSession } from "@/lib/auth-server";

export default async function DashboardPage() {
  await requireSession();
  return <DashboardOverview />;
}
