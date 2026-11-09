import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

export default function Configuracoes({ user, onSalvo }) {
  const [form, setForm] = useState({
    medico: "", crm: "", especialidade: "",
    unidade: "", endereco_unidade: "", cnes: "", telefone_unidade: "", cidade: "",
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("configuracoes").select("*").eq("user_id", user.id).maybeSingle();
    if (data) setForm({
      medico: data.medico || "",
      crm: data.crm || "",
      especialidade: data.especialidade || "",
      unidade: data.unidade || "",
      endereco_unidade: data.endereco_unidade || "",
      cnes: data.cnes || "",
      telefone_unidade: data.telefone_unidade || "",
      cidade: data.cidade || "",
    });
    setLoading(false);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setMsg("");
    const payload = { ...form, user_id: user.id };
    const { error } = await supabase.from("configuracoes").upsert(payload, { onConflict: "user_id" });
    setSalvando(false);
    if (error) { setMsg("Erro: " + error.message); return; }
    setMsg("ok");
    if (onSalvo) onSalvo(form);
    setTimeout(() => setMsg(""), 3000);
  }

  const inp = { padding: "8px 11px", border: "1px solid #e8e8ec", borderRadius: 7, fontSize: 14, width: "100%", background: "#fff", boxSizing: "border-box" };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Carregando…</div>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>⚙️ Configurações do Prescritor</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Preencha uma vez. Todas as receitas serão criadas já com esses dados.
      </p>

      <form onSubmit={salvar} style={{ background: "#fff", border: "1px solid #e8e8ec", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#6366f1", marginBottom: 2 }}>👨‍⚕️ Dados do Médico</div>
        <input style={inp} placeholder="Nome completo do médico *" value={form.medico} onChange={e => f("medico", e.target.value)} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={inp} placeholder="CRM (ex: 12345/MG)" value={form.crm} onChange={e => f("crm", e.target.value)} />
          <input style={inp} placeholder="Especialidade" value={form.especialidade} onChange={e => f("especialidade", e.target.value)} />
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, color: "#6366f1", marginTop: 6, marginBottom: 2 }}>🏥 Unidade de Saúde</div>
        <input style={inp} placeholder="Nome da Unidade de Saúde" value={form.unidade} onChange={e => f("unidade", e.target.value)} />
        <input style={inp} placeholder="Endereço completo" value={form.endereco_unidade} onChange={e => f("endereco_unidade", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <input style={inp} placeholder="CNES" value={form.cnes} onChange={e => f("cnes", e.target.value)} />
          <input style={inp} placeholder="Telefone" value={form.telefone_unidade} onChange={e => f("telefone_unidade", e.target.value)} />
          <input style={inp} placeholder="Cidade/UF" value={form.cidade} onChange={e => f("cidade", e.target.value)} />
        </div>

        <button type="submit" disabled={salvando} style={{ padding: "10px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
          {salvando ? "Salvando…" : "💾 Salvar configurações"}
        </button>

        {msg === "ok" && (
          <div style={{ background: "#dcfce7", color: "#166534", padding: "9px 14px", borderRadius: 7, fontSize: 13, textAlign: "center" }}>
            ✓ Configurações salvas! As receitas já vão usar esses dados.
          </div>
        )}
        {msg && msg !== "ok" && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "9px 14px", borderRadius: 7, fontSize: 13 }}>{msg}</div>
        )}
      </form>
    </div>
  );
}
