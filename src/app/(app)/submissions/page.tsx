import { requireSession } from "@/lib/auth-server";
import { MySubmissions } from "./submissions-client";

export default async function SubmissionsPage() {
  await requireSession();
  return <MySubmissions />;
}
