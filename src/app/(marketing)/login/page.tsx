import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const candidate = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = candidate?.startsWith("/") && !candidate.startsWith("//") && !candidate.startsWith("/\\") ? candidate : undefined;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
  return <AuthForm mode="login" googleEnabled={googleEnabled} returnTo={returnTo} />;
}
