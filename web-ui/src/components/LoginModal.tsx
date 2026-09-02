import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRegister) {
      setError("Registration coming soon! Try logging in with a demo account.");
      return;
    }
    const ok = login(username, password);
    if (ok) {
      onClose();
      navigate(`/users/${username}`);
    } else {
      setError("Invalid username or password. Try: woolenwhimsy / knit123");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(44, 26, 14, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-2xl p-8 relative"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none"
          style={{ color: "var(--muted-foreground)" }}
        >
          ×
        </button>

        <div className="mb-6 text-center">
          <span className="text-3xl">🧶</span>
          <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
            {isRegister ? "Join KnitHub" : "Welcome back"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {isRegister ? "Start your fiber arts journey" : "Sign in to your notebook"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. woolenwhimsy"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{
                background: "var(--muted)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FDE8E0", color: "#B54B22", border: "1px solid #F4C9B8" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-sm underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            {isRegister ? "Already have an account? Sign in" : "New to KnitHub? Join free"}
          </button>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            Demo accounts: <strong>woolenwhimsy</strong> / knit123 · <strong>threadcountess</strong> / fiber456
          </p>
        </div>
      </div>
    </div>
  );
}
