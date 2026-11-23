"use client";

import { FormEvent, useEffect, useState } from "react";
import { Flower2 } from "lucide-react";
import { requestJson } from "./request-json";

type Props = { setupAvailable: boolean; onLogin: () => Promise<void> };
export default function LoginPanel({ setupAvailable: initialSetup, onLogin }: Props) {
  const [setupAvailable, setSetupAvailable] = useState(initialSetup);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  useEffect(() => {
    requestJson("/api/auth?status=1", {}, 10_000).then(({ response, body: result }) => {
        if (!response.ok) {
          setServiceNote(typeof result.error === "string" ? result.error : "Login setup could not be checked. Retry shortly.");
          return;
        }
        setSetupAvailable(Boolean(result.setupAvailable));
        if (result.missingLoginConfiguration?.length) {
          setServiceNote(`Set these server environment variables to enable sign-in: ${result.missingLoginConfiguration.join(", ")}.`);
        } else if (!result.setupCompleted && result.missingSetupConfiguration?.length) {
          setServiceNote(`First-admin setup still needs: ${result.missingSetupConfiguration.join(", ")}.`);
        } else if (result.message) setServiceNote(result.message);
      })
      .catch((error) => setServiceNote(error instanceof Error ? error.message : "Login setup could not be checked. Retry shortly."));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const { response, body: result } = await requestJson("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, action: mode }),
      }, 20_000);
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      if (mode === "setup") {
        setSetupAvailable(false);
        setMode("login");
        setMessage(result.message || "Admin created. Sign in to continue.");
      } else {
        await onLogin();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand"><span><Flower2 size={27} /></span><div><strong>BrahmaGPT</strong><small>by Singularity</small></div></div>
        <h1>{mode === "setup" ? "Set up your administrator" : "Welcome back"}</h1>
        <p className="muted">{mode === "setup" ? "Create the first account for the isolated demo workspace." : "Sign in to open your Singularity workspace."}</p>
        {serviceNote && <p className="login-error" role="status">{serviceNote}</p>}
        <form onSubmit={submit}>
          {mode === "setup" && <>
            <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
            <label>One-time setup code<input name="setupToken" type="password" autoComplete="off" required /></label>
          </>}
          <label>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
          <label>Password<input name="password" type="password" autoComplete={mode === "setup" ? "new-password" : "current-password"} required minLength={mode === "setup" ? 12 : 1} maxLength={256} /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="login-success" role="status">{message}</p>}
          <button className="primary login-submit" disabled={busy}>{busy ? "Please wait…" : mode === "setup" ? "Create administrator" : "Sign in"}</button>
        </form>
        {setupAvailable && <button className="login-mode-toggle" onClick={() => { setMode(mode === "setup" ? "login" : "setup"); setError(""); }}>{mode === "setup" ? "Return to sign in" : "Set up the first administrator"}</button>}
        <small className="login-security-note">Your session is protected by Supabase Auth and a secure, HttpOnly cookie.</small>
      </section>
    </main>
  );
}
