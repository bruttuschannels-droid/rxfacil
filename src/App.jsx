import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import Login from "./Login.jsx";
import Receitas from "./Receitas.jsx";
import Assinatura from "./Assinatura.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assinatura, setAssinatura] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAssinatura(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAssinatura(session.user.id);
      else { setAssinatura(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadAssinatura(userId) {
    setLoading(true);
    const { data } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("user_id", userId)
      .eq("ativa", true)
      .maybeSingle();
    setAssinatura(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f8fb" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💊</div>
        <div style={{ fontSize: 15, color: "#6b7280" }}>Carregando RxFácil...</div>
      </div>
    </div>
  );

  if (!session) return <Login />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fb" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e8e8ec", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>💊</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#18181b", letterSpacing: "-0.5px" }}>RxFácil</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{session.user.email}</span>
          {assinatura && (
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>
              ✓ ATIVO até {new Date(assinatura.validade).toLocaleDateString("pt-BR")}
            </span>
          )}
          <button onClick={handleLogout} style={{ background: "none", border: "1px solid #e8e8ec", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", color: "#6b7280" }}>
            Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        {!assinatura ? (
          <Assinatura user={session.user} onAssinado={() => loadAssinatura(session.user.id)} />
        ) : (
          <Receitas user={session.user} />
        )}
      </div>
    </div>
  );
}
