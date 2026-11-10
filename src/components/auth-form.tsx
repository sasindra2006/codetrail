"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { BrandMark } from "@/components/brand-mark";
import { GoogleIcon } from "@/components/google-icon";
import { authClient } from "@/lib/auth-client";

const emailSchema = z.email().max(254);
const passwordSchema = z.string().min(8).max(128);
const nameSchema = z.string().trim().min(1).max(60);

function FieldIcon({ kind }: { kind: "email" | "password" | "name" }) {
  if (kind === "email") return <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>;
  if (kind === "password") return <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>;
  return <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>;
}

export function AuthForm({ mode, googleEnabled, returnTo }: { mode: "login" | "register"; googleEnabled: boolean; returnTo?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validEmail = emailSchema.safeParse(email.trim());
    const validPassword = passwordSchema.safeParse(password);
    const validName = registering ? nameSchema.safeParse(name) : null;
    if (!validEmail.success || !validPassword.success || validName?.success === false) {
      setError(registering
        ? "Enter a valid email, a name up to 60 characters, and a password of at least 8 characters."
        : "Enter a valid email and a password of at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const result = registering
        ? await authClient.signUp.email({ name: validName?.data ?? "", email: validEmail.data, password: validPassword.data })
        : await authClient.signIn.email({ email: validEmail.data, password: validPassword.data });
      if (result.error) {
        if (result.error.status === 503) {
          setError("Authentication is not configured yet. Set the server database and session secret, then try again.");
        } else if (registering && result.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          setError("An account with this email already exists. Please log in instead.");
        } else {
          setError(registering ? "Could not create an account with those details." : "Email or password was not accepted.");
        }
        return;
      }
      router.replace(returnTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Authentication could not be reached. Check the server configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: returnTo ?? "/dashboard" });
      if (result.error) setError("Google sign-in could not be started. Please try again or use email and password.");
    } catch {
      setError("Google sign-in could not be reached. Check the server configuration and try again.");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <section aria-labelledby="auth-heading" className="auth-card relative rounded-[1.4rem] border border-indigo-300/[0.14] bg-[#111426]/90 px-5 pb-5 pt-10 shadow-[0_28px_100px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-xl sm:px-8 sm:pb-5 sm:pt-11">
      <div className="auth-card-mark absolute left-1/2 top-0 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.25rem] border border-violet-300/15 bg-[#17172f] shadow-[0_12px_36px_rgba(0,0,0,0.35)] [&>span]:!size-12 [&>span]:!border-violet-400/20 [&>span]:!bg-violet-400/10 [&>span]:!text-violet-300 [&>span>svg]:!size-7">
        <BrandMark />
      </div>

      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.55rem]" id="auth-heading">{registering ? "Create Your Account" : "Welcome Back"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
          {registering ? "Start your CodeTrail learning journey" : "Log in to continue your CodeTrail journey"}
        </p>
      </header>

      {googleEnabled ? (
        <>
          <button className="mt-5 flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111426] disabled:cursor-wait disabled:opacity-60 sm:mt-6 sm:h-12 sm:text-base" disabled={busy || googleBusy} onClick={signInWithGoogle} type="button">
            <GoogleIcon />
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div aria-hidden="true" className="my-4 flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-700/80" />or<span className="h-px flex-1 bg-slate-700/80" />
          </div>
        </>
      ) : (
        <p className="mt-4 text-center text-xs leading-5 text-slate-400" role="status">Google sign-in is not configured yet. You can continue with email and password.</p>
      )}

      <form className={googleEnabled ? "space-y-3" : "mt-4 space-y-3"} onSubmit={submit}>
        {registering && (
          <label className="block text-sm font-medium text-slate-200" htmlFor="auth-name">Name
            <span className="auth-input-wrap mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-600/50 bg-[#171b2d]/75 px-4 transition-colors focus-within:border-violet-400/70 focus-within:ring-2 focus-within:ring-violet-400/20">
              <svg aria-hidden="true" className="size-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><FieldIcon kind="name" /></svg>
              <input autoComplete="name" className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" id="auth-name" maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required value={name} />
            </span>
          </label>
        )}

        <label className="block text-sm font-medium text-slate-200" htmlFor="auth-email">Email
          <span className="auth-input-wrap mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-600/50 bg-[#171b2d]/75 px-4 transition-colors focus-within:border-violet-400/70 focus-within:ring-2 focus-within:ring-violet-400/20">
            <svg aria-hidden="true" className="size-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><FieldIcon kind="email" /></svg>
            <input autoComplete="email" className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" id="auth-email" maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required type="email" value={email} />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-200" htmlFor="auth-password">Password
          <span className="auth-input-wrap mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-600/50 bg-[#171b2d]/75 px-4 transition-colors focus-within:border-violet-400/70 focus-within:ring-2 focus-within:ring-violet-400/20">
            <svg aria-hidden="true" className="size-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><FieldIcon kind="password" /></svg>
            <input autoComplete={registering ? "new-password" : "current-password"} className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" id="auth-password" maxLength={128} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type={showPassword ? "text" : "password"} value={password} />
            <button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400" onClick={() => setShowPassword((visible) => !visible)} type="button">
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                {showPassword ? <><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.3 0 9 5 10 7-.4.8-1.5 2.3-3.4 3.7M6.2 6.2C3.9 7.7 2.5 10 2 12c.8 1.6 4.2 7 10 7 1.3 0 2.5-.3 3.5-.8" /></> : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
            </button>
          </span>
        </label>

        {error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2.5 text-sm leading-5 text-rose-200" role="alert">
          {error}{registering && error === "An account with this email already exists. Please log in instead." && <> <Link className="font-semibold text-violet-200 underline underline-offset-2 hover:text-white" href="/login">Log in</Link>.</>}
        </p>}
        <button className="auth-submit mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_9px_26px_rgba(99,73,230,0.22)] transition-[filter,transform,box-shadow] hover:brightness-110 hover:shadow-[0_12px_32px_rgba(99,73,230,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111426] active:translate-y-px disabled:cursor-wait disabled:opacity-60 sm:text-base" disabled={busy || googleBusy} type="submit">
          {busy ? "Please wait…" : registering ? "Create Account" : "Log In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        {registering ? "Already have an account? " : "Don’t have an account? "}
        <Link className="font-semibold text-violet-300 outline-none transition-colors hover:text-violet-200 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-violet-400" href={registering ? "/login" : "/register"}>{registering ? "Log in" : "Sign up"}</Link>
      </p>
    </section>
  );
}
