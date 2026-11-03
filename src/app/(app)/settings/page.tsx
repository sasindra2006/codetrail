import { SettingsPage } from "@/components/account-preferences";
import { requireSession } from "@/lib/auth-server";

export default async function SettingsRoute() {
  await requireSession();
  return <SettingsPage />;
}
