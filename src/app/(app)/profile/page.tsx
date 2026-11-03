import { ProfilePage } from "@/components/account-preferences";
import { requireSession } from "@/lib/auth-server";

export default async function ProfileRoute() {
  await requireSession();
  return <ProfilePage />;
}
