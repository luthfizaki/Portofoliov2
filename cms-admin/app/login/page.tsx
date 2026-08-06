"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiUrl } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Unable to sign in. Check your credentials and try again.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("CMS API is unavailable. Start the backend service and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="cms-login"><section className="cms-login__intro"><a className="cms-login__brand" href="/" aria-label="Portfolio V2 CMS home"><span>LA</span><strong>PORTFOLIO V2<small>Content management system</small></strong></a><div className="cms-login__statement"><p>CONTENT STUDIO / ACCESS</p><h1>The control room behind every project.</h1><div className="cms-login__signals"><span><CheckCircle2 size={15} />Project archive</span><span><CheckCircle2 size={15} />Page content</span><span><CheckCircle2 size={15} />Publishing flow</span></div></div><div className="cms-login__secure"><ShieldCheck size={18} /><span><strong>Private workspace</strong><small>Authorized access only</small></span></div></section><section className="cms-login__panel" aria-label="CMS sign in"><div className="cms-login__panel-inner"><div className="cms-login__panel-heading"><span className="cms-login__key"><KeyRound size={20} strokeWidth={1.8} /></span><div><p>SECURE SESSION</p><h2>Welcome back</h2><span>Sign in to manage your portfolio content.</span></div></div><form onSubmit={submit}><label htmlFor="email">Email address<input id="email" type="email" autoComplete="email" placeholder="admin@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label htmlFor="password">Password<div className="cms-password-field"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p className="cms-login__error" role="alert">{error}</p>}<button className="cms-login__submit" type="submit" disabled={isSubmitting}><span>{isSubmitting ? "Signing in" : "Continue to dashboard"}</span><ArrowRight size={17} /></button></form><p className="cms-login__support"><ShieldCheck size={14} />Protected by a secure, cookie-based session.</p></div></section></main>;
}
