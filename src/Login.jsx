import { useState } from "react";

const SUPABASE_URL = "https://vwuekpxqswohphcnqyzl.supabase.co/rest/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dWVrcHhxc3dvaHBoY25xeXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTAzODcsImV4cCI6MjA4ODY2NjM4N30.VhS3kaGBlj58CRs_te30vVcNz5gXiPf0qduUhOAdNx8";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/users?email=eq.${email}&mot_de_passe=eq.${password}`,
        { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setError("Email ou mot de passe incorrect");
      } else {
        if (remember) {
          localStorage.setItem("reviewhub_user", JSON.stringify(data[0]));
        }
        onLogin(data[0]);
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", background: "#0A0A0F", minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #444; }
      `}</style>

      <div style={{ background: "#111118", border: "1px solid #1E1E2E", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>★</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#E8E8F0", letterSpacing: "-0.02em" }}>ReviewHub</div>
            <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Connexion</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" style={{ width: "100%", padding: "12px 14px", background: "#0A0A0F", border: "1px solid #1E1E2E", borderRadius: 10, color: "#E8E8F0", fontSize: 14, outline: "none", fontFamily: "DM Sans" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", background: "#0A0A0F", border: "1px solid #1E1E2E", borderRadius: 10, color: "#E8E8F0", fontSize: 14, outline: "none", fontFamily: "DM Sans" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, cursor: "pointer" }} onClick={() => setRemember(!remember)}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${remember ? "#6366F1" : "#333"}`, background: remember ? "#6366F1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
            {remember ? "✓" : ""}
          </div>
          <span style={{ fontSize: 13, color: "#888" }}>Rester connecté</span>
        </div>

        {error && (
          <div style={{ background: "#1A0A0A", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Syne" }}>
          {loading ? "Connexion..." : "Se connecter →"}
        </button>
      </div>
    </div>
  );
}