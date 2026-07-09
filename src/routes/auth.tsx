import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход · AI Builder" },
      { name: "description", content: "Войдите или зарегистрируйтесь, чтобы создавать проекты в AI Builder." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/builder" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/builder`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Аккаунт создан. Если требуется — подтверди email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/builder" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      toast.error(res.error instanceof Error ? res.error.message : "Ошибка Google");
      setLoading(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/builder" });
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          AI Builder
        </Link>

        <div className="glass rounded-3xl p-8 shadow-glow">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold">
              {mode === "signup" ? "Создать аккаунт" : "С возвращением"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup" ? "Начни строить проекты за минуты" : "Войди, чтобы продолжить работу"}
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/50 py-2.5 text-sm font-medium hover:bg-accent transition disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6C12.3 13.3 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.4 0 20 0 24s.9 7.6 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-3.8-13.6-9.5l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
            Продолжить с Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> или email <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text" placeholder="Имя (необязательно)"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email" required placeholder="email@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password" required minLength={6} placeholder="Пароль (мин. 6 символов)"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Создать аккаунт" : "Войти"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-medium text-foreground hover:underline">
              {mode === "signup" ? "Войти" : "Создать"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
