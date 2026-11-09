import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = { navy: "#1E3A5F", teal: "#0F9B8E", bg: "#EEF2F7", border: "#E2E8F0", text: "#1E293B", muted: "#64748B" };

export default function Configuracoes({ user, onSalvo }) {
  const [form, setForm] = useState({ medico: "", crm: "", especialidade: "", unidade: "", endereco_unidade: "", cnes: "", telefone_unidade: "", cidade: "" });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("configuracoes").select("*").eq("user_id", user.id).maybeSingle();
    if (data) setForm({ medico: data.medico||"", crm: data.crm||"", especialidade: data.especialidade||"", unidade: data.unidade||"", endereco_unidade: data.endereco_unidade||"", cnes: data.cnes||"", telefone_unidade: data.telefone_unidade||"", cidade: data.cidade||"" });
    setLoading(false);
  }

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setMsg("");
    const { error } = await supabase.from("configuracoes").upsert({ ...form, user_id: user.id }, { onConflict: "user_id" });
    setSalvando(false);
    if (error) { setMsg("erro:" + error.message); return; }
    setMsg("ok");
    if (onSalvo) onSalvo(form);
    setTimeout(() => setMsg(""), 3000);
  }

  const inp = { padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, width: "100%", background: "#fff", color: C.text, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Carregando…</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>Configurações</h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 3 }}>Preencha uma vez — todas as receitas usarão esses dados automaticamente</p>
      </div>

      <form onSubmit={salvar} style={{ maxWidth: 640 }}>
        {/* Médico */}
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>👨‍⚕️ Dados do Médico</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>Nome completo do médico</label>
              <input style={inp} placeholder="Dr. Nome Sobrenome" value={form.medico} onChange={e => f("medico", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>CRM</label>
                <input style={inp} placeholder="12345/MG" value={form.crm} onChange={e => f("crm", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Especialidade</label>
                <input style={inp} placeholder="Clínica Geral" value={form.especialidade} onChange={e => f("especialidade", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Unidade */}
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>🏥 Unidade de Saúde</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>Nome da unidade</label>
              <input style={inp} placeholder="ESF Emília / UBS Central…" value={form.unidade} onChange={e => f("unidade", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Endereço completo</label>
              <input style={inp} placeholder="Rua Exemplo, 123 – Bairro – Cidade/UF" value={form.endereco_unidade} onChange={e => f("endereco_unidade", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>CNES</label>
                <input style={inp} placeholder="0000000" value={form.cnes} onChange={e => f("cnes", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Telefone</label>
                <input style={inp} placeholder="(37) 3772-3265" value={form.telefone_unidade} onChange={e => f("telefone_unidade", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Cidade/UF</label>
                <input style={inp} placeholder="Sete Lagoas/MG" value={form.cidade} onChange={e => f("cidade", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={salvando} style={{ padding: "12px 32px", background: `linear-gradient(135deg, ${C.navy}, ${C.teal})`, color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {salvando ? "Salvando…" : "💾 Salvar configurações"}
        </button>

        {msg === "ok" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#DCFCE7", color: "#166534", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginLeft: 12 }}>
            ✓ Salvo com sucesso
          </div>
        )}
        {msg && msg !== "ok" && (
          <div style={{ marginTop: 12, background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{msg}</div>
        )}
      </form>
    </div>
  );
}
