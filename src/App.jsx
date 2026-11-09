import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import Login from "./Login.jsx";
import Receitas from "./Receitas.jsx";
import Assinatura from "./Assinatura.jsx";
import Configuracoes from "./Configuracoes.jsx";
import Admin from "./Admin.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assinatura, setAssinatura] = useState(null);
  const [config, setConfig] = useState(null);
  const [aba, setAba] = useState("receitas");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadTudo(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadTudo(session.user.id);
      else { setAssinatura(null); setConfig(null); setIsAdmin(false); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadTudo(userId) {
    setLoading(true);
    const [{ data: ass }, { data: cfg }, { data: adm }] = await Promise.all([
      supabase.from("assinaturas").select("*").eq("user_id", userId).eq("ativa", true).maybeSingle(),
      supabase.from("configuracoes").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);
    setAssinatura(ass);
    setConfig(cfg || {});
    setIsAdmin(!!adm);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#EEF2F7" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #1E3A5F 0%, #0F9B8E 100%)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>💊</div>
        <div style={{ fontSize: 15, color: "#64748B", fontWeight: 500 }}>Carregando RxFácil…</div>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const navItem = (id, icon, label) => (
    <button
      key={id}
      onClick={() => setAba(id)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 16px", border: "none", borderRadius: 8,
        background: aba === id ? "rgba(255,255,255,0.15)" : "transparent",
        color: aba === id ? "#fff" : "rgba(255,255,255,0.65)",
        fontSize: 14, fontWeight: aba === id ? 600 : 400,
        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
        borderLeft: aba === id ? "3px solid #0F9B8E" : "3px solid transparent",
      }}
    >
      <span style={{ fontSize: 17 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#EEF2F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 220, minHeight: "100vh", background: "linear-gradient(180deg, #1E3A5F 0%, #162D4A 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0F9B8E, #0D7A70)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💊</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>RxFácil</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 1 }}>Receitas Médicas</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        {assinatura && (
          <nav style={{ padding: "12px 8px", flex: 1 }}>
            {navItem("receitas", "📋", "Receitas")}
            {navItem("config", "⚙️", "Configurações")}
            {isAdmin && navItem("admin", "🔑", "Admin")}
          </nav>
        )}

        {/* User info */}
        <div style={{ padding: "16px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {assinatura && (
            <div style={{ background: "rgba(15,155,142,0.2)", border: "1px solid rgba(15,155,142,0.4)", borderRadius: 6, padding: "5px 8px", marginBottom: 10, fontSize: 11, color: "#4ADE80", fontWeight: 600 }}>
              ✓ ATIVO até {new Date(assinatura.validade).toLocaleDateString("pt-BR")}
            </div>
          )}
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.user.email}
          </div>
          <button onClick={handleLogout} style={{ width: "100%", padding: "7px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px 36px" }}>
        {!assinatura ? (
          <Assinatura user={session.user} onAssinado={() => loadTudo(session.user.id)} />
        ) : aba === "admin" && isAdmin ? (
          <Admin user={session.user} />
        ) : aba === "config" ? (
          <Configuracoes user={session.user} onSalvo={novoConfig => { setConfig(novoConfig); setAba("receitas"); }} />
        ) : (
          <Receitas user={session.user} config={config} />
        )}
      </main>
    </div>
  );
}
