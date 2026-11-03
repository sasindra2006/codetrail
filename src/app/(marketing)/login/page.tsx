import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
  return <AuthForm mode="login" googleEnabled={googleEnabled} />;
}
