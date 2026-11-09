import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = { navy: "#1E3A5F", teal: "#0F9B8E", bg: "#EEF2F7", border: "#E2E8F0", text: "#1E293B", muted: "#64748B", red: "#EF4444", green: "#22C55E" };

const PLANOS = [
  { id: "mensal", label: "Mensal", dias: 30 },
  { id: "trimestral", label: "Trimestral", dias: 90 },
  { id: "anual", label: "Anual", dias: 365 },
  { id: "gratuito", label: "Gratuito (cortesia)", dias: 36500 }, // 100 anos
];

export default function Admin({ user }) {
  const [profiles, setProfiles] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { profile }
  const [plano, setPlano] = useState("gratuito");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("*").order("criado_em", { ascending: false }),
      supabase.from("assinaturas").select("*"),
    ]);
    setProfiles(p || []);
    setAssinaturas(a || []);
    setLoading(false);
  }

  function assinaturaDoUser(userId) {
    return assinaturas.filter(a => a.user_id === userId).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }

  function statusUser(userId) {
    const ass = assinaturaDoUser(userId).find(a => a.ativa && new Date(a.validade) > new Date());
    return ass || null;
  }

  async function liberarAcesso() {
    if (!modal) return;
    setSalvando(true);
    const dias = PLANOS.find(p => p.id === plano)?.dias || 365;
    const validade = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    // Desativar assinatura ativa anterior se houver
    const ativas = assinaturaDoUser(modal.user_id).filter(a => a.ativa);
    for (const a of ativas) {
      await supabase.from("assinaturas").update({ ativa: false }).eq("id", a.id);
    }

    const { error } = await supabase.from("assinaturas").insert({
      user_id: modal.user_id,
      plano,
      ativa: true,
      validade,
      mp_payment_id: "admin_manual",
    });

    setSalvando(false);
    if (error) { alert("Erro: " + error.message); return; }
    setModal(null);
    load();
  }

  async function revogarAcesso(userId) {
    if (!window.confirm("Revogar o acesso deste usuário?")) return;
    const ativas = assinaturaDoUser(userId).filter(a => a.ativa);
    for (const a of ativas) {
      await supabase.from("assinaturas").update({ ativa: false }).eq("id", a.id);
    }
    load();
  }

  const filtered = profiles.filter(p => {
    const s = search.toLowerCase();
    return !s || (p.email || "").toLowerCase().includes(s) || (p.nome || "").toLowerCase().includes(s);
  });

  const inp = { padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 14, width: "100%", background: "#fff", color: C.text, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
  const lbl = { fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 };

  const ativosCount = profiles.filter(p => statusUser(p.user_id)).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>Painel Admin</h1>
          <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>🔑 ADMIN</span>
        </div>
        <p style={{ color: C.muted, fontSize: 14 }}>Gerencie o acesso dos usuários ao RxFácil</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Usuários cadastrados", value: profiles.length, icon: "👥", color: C.navy },
          { label: "Com acesso ativo", value: ativosCount, icon: "✅", color: C.teal },
          { label: "Sem acesso", value: profiles.length - ativosCount, icon: "🔒", color: "#64748B" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${C.border}`, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de usuários */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
          <input style={{ ...inp, maxWidth: 300 }} placeholder="Buscar por nome ou e-mail…" value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={load} style={{ padding: "8px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, cursor: "pointer", color: C.muted, fontWeight: 500 }}>🔄 Atualizar</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando…</div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 140px 120px", gap: 12, padding: "10px 20px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div>Usuário</div>
              <div>E-mail</div>
              <div>Plano</div>
              <div>Válido até</div>
              <div>Ações</div>
            </div>

            {filtered.map(p => {
              const ass = statusUser(p.user_id);
              return (
                <div key={p.user_id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 140px 120px", gap: 12, padding: "12px 20px", borderTop: `1px solid ${C.border}`, alignItems: "center", fontSize: 14 }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{p.nome || "—"}</div>
                  <div style={{ color: C.muted, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>
                  <div>
                    {ass ? (
                      <span style={{ background: ass.plano === "gratuito" ? "#F0FDF4" : "#EFF6FF", color: ass.plano === "gratuito" ? "#166534" : "#1D4ED8", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: ass.plano === "gratuito" ? "1px solid #BBF7D0" : "1px solid #BFDBFE" }}>
                        {ass.plano === "gratuito" ? "🎁 Cortesia" : `✓ ${ass.plano}`}
                      </span>
                    ) : (
                      <span style={{ background: "#FEF2F2", color: "#991B1B", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 20, border: "1px solid #FECACA" }}>🔒 Sem acesso</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: ass ? C.text : C.muted }}>
                    {ass ? new Date(ass.validade).toLocaleDateString("pt-BR") : "—"}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setModal(p); setPlano("gratuito"); }} title="Liberar acesso" style={{ padding: "5px 10px", background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}40`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      + Liberar
                    </button>
                    {ass && (
                      <button onClick={() => revogarAcesso(p.user_id)} title="Revogar acesso" style={{ padding: "5px 8px", background: "#FEF2F2", color: C.red, border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 14 }}>
                {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado ainda"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL — Liberar Acesso */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 4 }}>Liberar acesso</h3>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
              <span style={{ fontWeight: 600, color: C.text }}>{modal.nome || modal.email}</span><br />
              {modal.email}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Plano / período de acesso</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLANOS.map(pl => (
                  <button key={pl.id} onClick={() => setPlano(pl.id)} style={{
                    padding: "10px 14px", border: `2px solid ${plano === pl.id ? C.teal : C.border}`,
                    borderRadius: 8, background: plano === pl.id ? `${C.teal}10` : "#fff",
                    cursor: "pointer", textAlign: "left", fontSize: 13,
                    color: plano === pl.id ? C.teal : C.text, fontWeight: plano === pl.id ? 700 : 400,
                    transition: "all 0.1s",
                  }}>
                    <div style={{ fontWeight: 700 }}>{pl.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{pl.dias >= 36000 ? "Acesso permanente" : `${pl.dias} dias`}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={liberarAcesso} disabled={salvando} style={{ flex: 1, padding: "11px", background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {salvando ? "Salvando…" : "✓ Liberar acesso"}
              </button>
              <button onClick={() => setModal(null)} style={{ padding: "11px 18px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, cursor: "pointer", color: C.muted, fontWeight: 500 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
