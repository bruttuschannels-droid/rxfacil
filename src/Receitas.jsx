import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = {
  navy: "#1E3A5F", teal: "#0F9B8E", tealDark: "#0D7A70",
  bg: "#EEF2F7", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", faint: "#94A3B8",
  red: "#EF4444", green: "#22C55E", indigo: "#4F46E5",
};

const emptyForm = {
  nome_paciente: "", data_nascimento: "", cpf_cns: "", endereco_paciente: "",
  tipo: "controle_especial",
  medicamentos: [{ nome: "", quantidade: "", instrucao: "" }],
  medico: "", crm: "", especialidade: "", unidade: "",
  incluir_data: true, data_receita: new Date().toISOString().split("T")[0],
  observacoes: "",
};

export default function Receitas({ user, config = {} }) {
  const [receitas, setReceitas] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const makeForm = (cfg = {}) => ({
    ...emptyForm,
    medico: cfg.medico || "",
    crm: cfg.crm || "",
    especialidade: cfg.especialidade || "",
    unidade: cfg.unidade || "",
  });
  const [form, setForm] = useState(() => makeForm(config));

  useEffect(() => { loadReceitas(); }, []);

  async function loadReceitas() {
    const { data, error } = await supabase.from("receitas").select("*").eq("user_id", user.id).order("criado_em", { ascending: false }).limit(500);
    if (error) { alert("Erro: " + error.message); return; }
    setReceitas(data || []);
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setMed(i, k, v) { setForm(f => { const m = [...f.medicamentos]; m[i] = { ...m[i], [k]: v }; return { ...f, medicamentos: m }; }); }
  function addMed() { setForm(f => ({ ...f, medicamentos: [...f.medicamentos, { nome: "", quantidade: "", instrucao: "" }] })); }
  function removeMed(i) { setForm(f => ({ ...f, medicamentos: f.medicamentos.filter((_, j) => j !== i) })); }

  async function saveReceita() {
    if (!form.nome_paciente?.trim()) { alert("Informe o nome do paciente."); return; }
    const payload = {
      nome_paciente: form.nome_paciente.trim(), data_nascimento: form.data_nascimento || null,
      cpf_cns: form.cpf_cns || null, endereco_paciente: form.endereco_paciente || null,
      tipo_receita: form.tipo, medicamentos: JSON.stringify(form.medicamentos),
      medico: form.medico || null, crm: form.crm || null,
      especialidade: form.especialidade || null, unidade: form.unidade || null,
      incluir_data: !!form.incluir_data, data_receita: form.data_receita || null,
      observacoes: form.observacoes || null, user_id: user.id,
    };
    const result = editing
      ? await supabase.from("receitas").update(payload).eq("id", editing)
      : await supabase.from("receitas").insert(payload);
    if (result.error) { alert("Erro: " + result.error.message); return; }
    setForm(makeForm(config)); setEditing(null); loadReceitas();
  }

  async function deleteReceita(id) {
    if (!window.confirm("Excluir esta receita?")) return;
    await supabase.from("receitas").delete().eq("id", id);
    loadReceitas();
  }

  function editReceita(r) {
    setEditing(r.id);
    setForm({ ...r, tipo: r.tipo_receita || r.tipo || "controle_especial", endereco_paciente: r.endereco_paciente || "", medicamentos: typeof r.medicamentos === "string" ? JSON.parse(r.medicamentos) : r.medicamentos, incluir_data: r.incluir_data !== false });
  }

  function printReceita(r) {
    const f2 = r || form;
    const meds = typeof f2.medicamentos === "string" ? JSON.parse(f2.medicamentos) : f2.medicamentos;
    const tipoReceita = f2.tipo_receita || f2.tipo || "controle_especial";
    const dataStr = f2.incluir_data !== false ? new Date().toLocaleDateString("pt-BR") : "";
    const unidade = f2.unidade || config.unidade || "";
    const enderecoUnidade = config.endereco_unidade || "";
    const cnes = config.cnes || "";
    const telefoneUnidade = config.telefone_unidade || "";
    const cidade = config.cidade || "";

    const medsHtml = meds.map(m => `
      <div style="margin-bottom:8px;line-height:1.5;">
        <div style="font-size:10pt;font-weight:700;font-family:Arial,sans-serif;">- ${(m.nome||"").toUpperCase()} ${m.quantidade ? "----- " + m.quantidade : ""}</div>
        ${m.instrucao ? `<div style="font-size:9pt;font-family:Arial,sans-serif;padding-left:14px;">${m.instrucao}</div>` : ""}
      </div>`).join("");

    function blocoEmitente() {
      return `<div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
        <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO EMITENTE</div>
        <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Unidade de Saúde:</b> ${unidade}</div>
        ${enderecoUnidade ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Endereço:</b> ${enderecoUnidade}</div>` : ""}
        <div style="display:flex;gap:12px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;">
          ${cnes ? `<span><b>CNES:</b> ${cnes}</span>` : ""}
          ${telefoneUnidade ? `<span><b>Telefone:</b> ${telefoneUnidade}</span>` : ""}
        </div>
      </div>`;
    }

    function blocoPrescritor() {
      return `<div style="border-top:1px solid #000;margin-top:5px;padding-top:4px;">
        <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO E ASSINATURA DO PRESCRITOR</div>
        <div style="display:flex;gap:10px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.8;">
          <span style="flex:1;"><b>Nome:</b> ${f2.medico||""}</span>
          <span><b>CRM/MG:</b> ${f2.crm||""}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:8pt;font-family:Arial,sans-serif;line-height:1.8;">
          <span>Assinatura: _______________________________</span>
          <span>Data: ${dataStr||"____/____/________"}</span>
        </div>
      </div>`;
    }

    function viaControle(titulo) {
      return `<div style="padding:7mm 10mm;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
        <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:6px;">
          <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;">SECRETARIA MUNICIPAL DE SAÚDE</div>
          <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;">RECEITA DE CONTROLE ESPECIAL</div>
          <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;">${titulo}</div>
        </div>
        ${blocoEmitente()}
        <div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO PACIENTE</div>
          <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Nome:</b> ${f2.nome_paciente||""}</div>
          ${f2.endereco_paciente ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Endereço:</b> ${f2.endereco_paciente}</div>` : ""}
          <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>CPF:</b> ${f2.cpf_cns||""}</div>
        </div>
        <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:4px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:3px;text-decoration:underline;">PRESCRIÇÃO</div>
          ${medsHtml}
        </div>
        <div style="margin-top:auto;">${blocoPrescritor()}</div>
      </div>`;
    }

    function viaSaudeMental(titulo) {
      return `<div style="padding:8mm 10mm;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
        <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:7px;">
          <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;">SECRETARIA MUNICIPAL DE SAÚDE</div>
          <div style="font-size:10pt;font-weight:700;font-family:Arial,sans-serif;">${unidade}</div>
          <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;">RECEITUÁRIO MÉDICO</div>
          <div style="font-size:7.5pt;font-family:Arial,sans-serif;">${cidade}</div>
        </div>
        <div style="font-size:8.5pt;font-family:Arial,sans-serif;font-weight:700;margin-bottom:3px;">${titulo}</div>
        <div style="border-bottom:1px solid #000;margin-bottom:7px;"></div>
        <div style="font-size:8.5pt;font-family:Arial,sans-serif;margin-bottom:5px;"><b>NOME:</b> ${f2.nome_paciente||""}</div>
        <div style="display:flex;gap:8px;font-size:8.5pt;font-family:Arial,sans-serif;margin-bottom:7px;">
          <span><b>NASC:</b> ${f2.data_nascimento ? new Date(f2.data_nascimento+"T12:00:00").toLocaleDateString("pt-BR") : ""}</span>
          <span><b>CPF/CNS:</b> ${f2.cpf_cns||""}</span>
        </div>
        <div style="border-top:1px solid #000;margin:4px 0 7px;"></div>
        <div style="font-size:8.5pt;font-weight:700;font-family:Arial,sans-serif;text-decoration:underline;margin-bottom:7px;">PRESCRIÇÃO:</div>
        <div style="flex:1;">${medsHtml}</div>
        <div style="border-top:1px solid #000;margin-top:8px;padding-top:5px;">
          <div style="display:flex;justify-content:space-between;font-size:8pt;font-family:Arial,sans-serif;">
            <span>Local e Data: ${dataStr ? (cidade||"Local") + ", " + dataStr : ""}</span>
            <span>Assinatura e Carimbo: ___________________</span>
          </div>
        </div>
      </div>`;
    }

    function viaUsoContinuo() {
      return `<div style="padding:8mm 12mm;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
        <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:6px;">
          <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;">SECRETARIA MUNICIPAL DE SAÚDE</div>
          <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;">RECEITUÁRIO MÉDICO</div>
          <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;">USO ORAL CONTÍNUO</div>
        </div>
        ${blocoEmitente()}
        <div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO PACIENTE</div>
          <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Nome:</b> ${f2.nome_paciente||""}</div>
          ${f2.endereco_paciente ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><b>Endereço:</b> ${f2.endereco_paciente}</div>` : ""}
          <div style="display:flex;gap:10px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;">
            <span><b>Nasc:</b> ${f2.data_nascimento ? new Date(f2.data_nascimento+"T12:00:00").toLocaleDateString("pt-BR") : ""}</span>
            <span><b>CPF/CNS:</b> ${f2.cpf_cns||""}</span>
          </div>
        </div>
        <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:4px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:4px;text-decoration:underline;">PRESCRIÇÃO</div>
          ${medsHtml}
        </div>
        <div style="margin-top:auto;">${blocoPrescritor()}</div>
      </div>`;
    }

    let html;
    if (tipoReceita === "controle_especial") {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:297mm;height:210mm;display:flex;}.via{width:50%;height:210mm;overflow:hidden;}.via:first-child{border-right:1.5px dashed #aaa;}</style></head><body><div class="via">${viaControle("1ª VIA  ·  RETENÇÃO PELA FARMÁCIA")}</div><div class="via">${viaControle("2ª VIA  ·  PACIENTE")}</div></body></html>`;
    } else if (tipoReceita === "saude_mental" || tipoReceita === "saude mental") {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:297mm;height:210mm;display:flex;}.via{width:50%;height:210mm;overflow:hidden;}.via:first-child{border-right:1px dashed #aaa;}</style></head><body><div class="via">${viaSaudeMental("1ª VIA - FARMÁCIA")}</div><div class="via">${viaSaudeMental("2ª VIA - PACIENTE")}</div></body></html>`;
    } else {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 portrait;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:210mm;height:297mm;}</style></head><body>${viaUsoContinuo()}</body></html>`;
    }

    const w = window.open("", "_blank", "width=900,height=650");
    w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  const filtered = receitas.filter(r => {
    const s = search.toLowerCase();
    return !s || (r.nome_paciente||"").toLowerCase().includes(s) || (r.medico||"").toLowerCase().includes(s);
  });

  const tipoLabel = t => ({ saude_mental: "Saúde Mental", controle_especial: "Controle Especial Novo Modelo 2026", uso_continuo: "Uso Contínuo" }[t] || t);
  const tipoColor = t => ({ saude_mental: "#4F46E5", controle_especial: "#DC2626", uso_continuo: "#0F9B8E" }[t] || "#64748B");

  const inp = {
    padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 14, width: "100%", background: "#fff", color: C.text,
    boxSizing: "border-box", outline: "none",
    transition: "border-color 0.15s",
  };
  const label = { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, letterSpacing: "0.01em" };
  const field = (lbl, el) => <div><span style={label}>{lbl}</span>{el}</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>Receitas Médicas</h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 3 }}>Crie, salve e imprima receitas com layout oficial</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

        {/* FORMULÁRIO */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            {editing ? "✏️ Editar Receita" : "➕ Nova Receita"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Tipo */}
            <div>
              <span style={label}>Tipo de Receita</span>
              <select style={{ ...inp, background: "#F8FAFC" }} value={form.tipo} onChange={e => setField("tipo", e.target.value)}>
                <option value="saude_mental">Saúde Mental — A4 Paisagem (2 vias)</option>
                <option value="uso_continuo">Uso Oral Contínuo — A4 Retrato (1 via)</option>
                <option value="controle_especial">Controle Especial Novo Modelo 2026 — A4 Paisagem (2 vias)</option>
              </select>
            </div>

            {/* Dados do paciente */}
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.teal, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {field("Nome completo *",
                  <input style={inp} placeholder="Nome do paciente" value={form.nome_paciente} onChange={e => setField("nome_paciente", e.target.value)} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {field("Data de nascimento",
                    <input style={inp} type="date" value={form.data_nascimento} onChange={e => setField("data_nascimento", e.target.value)} />
                  )}
                  {field("CPF / CNS",
                    <input style={inp} placeholder="000.000.000-00" value={form.cpf_cns} onChange={e => setField("cpf_cns", e.target.value)} />
                  )}
                </div>
                {(form.tipo === "controle_especial" || form.tipo === "uso_continuo") &&
                  field("Endereço do paciente",
                    <input style={inp} placeholder="Rua, número, bairro" value={form.endereco_paciente || ""} onChange={e => setField("endereco_paciente", e.target.value)} />
                  )
                }
              </div>
            </div>

            {/* Prescritor (somente leitura) */}
            <div style={{ background: "#EEF2FF", borderRadius: 8, padding: 12, border: "1px solid #C7D2FE" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prescritor</div>
                <span style={{ fontSize: 11, color: C.indigo, opacity: 0.7 }}>via ⚙️ Configurações</span>
              </div>
              <div style={{ fontSize: 13, color: "#3730A3", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600 }}>{form.medico || <span style={{ opacity: 0.5 }}>Nome não configurado</span>}</div>
                <div style={{ opacity: 0.8 }}>
                  {form.crm ? `CRM ${form.crm}` : ""}
                  {form.especialidade ? ` · ${form.especialidade}` : ""}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{form.unidade || ""}</div>
              </div>
            </div>

            {/* Medicamentos */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Medicamentos</span>
                <button onClick={addMed} style={{ padding: "4px 10px", background: C.teal, color: "#fff", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Adicionar</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.medicamentos.map((m, i) => (
                  <div key={i} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={{ ...inp, flex: 2 }} placeholder="Nome do medicamento" value={m.nome} onChange={e => setMed(i, "nome", e.target.value)} />
                      <input style={{ ...inp, flex: 1 }} placeholder="Qtd." value={m.quantidade} onChange={e => setMed(i, "quantidade", e.target.value)} />
                      {form.medicamentos.length > 1 && (
                        <button onClick={() => removeMed(i)} style={{ padding: "0 10px", background: "#FEE2E2", color: C.red, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                      )}
                    </div>
                    <input style={inp} placeholder="Posologia e instruções de uso" value={m.instrucao} onChange={e => setMed(i, "instrucao", e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Data */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="inc_data" checked={!!form.incluir_data} onChange={e => setField("incluir_data", e.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal }} />
              <label htmlFor="inc_data" style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Incluir data na receita (sempre a data do dia da impressão)</label>
            </div>

            {/* Obs */}
            {field("Observações (uso interno — não aparece no impresso)",
              <textarea style={{ ...inp, height: 64, resize: "vertical", fontFamily: "inherit" }} placeholder="Anotações internas…" value={form.observacoes} onChange={e => setField("observacoes", e.target.value)} />
            )}

            {/* Ações */}
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              <button onClick={saveReceita} style={{ flex: 1, padding: "10px", background: C.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {editing ? "💾 Atualizar" : "💾 Salvar"}
              </button>
              <button onClick={() => printReceita(null)} style={{ flex: 1, padding: "10px", background: C.teal, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                🖨️ Imprimir
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(makeForm(config)); }} style={{ padding: "10px 14px", background: "#F1F5F9", color: C.muted, border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Receitas Salvas</h2>
            <span style={{ background: "#EEF2F7", color: C.muted, fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>{receitas.length}</span>
          </div>

          <input style={{ ...inp, marginBottom: 10 }} placeholder="Buscar por paciente ou médico…" value={search} onChange={e => setSearch(e.target.value)} />

          {search && (
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 10 }}>{filtered.length} de {receitas.length} receitas</div>
          )}

          <button onClick={loadReceitas} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#F1F5F9", border: "none", borderRadius: 6, fontSize: 12, color: C.muted, cursor: "pointer", marginBottom: 12, fontWeight: 500 }}>
            🔄 Recarregar
          </button>

          <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, borderLeft: `3px solid ${tipoColor(r.tipo_receita || r.tipo)}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>{r.nome_paciente}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{r.medico}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: tipoColor(r.tipo_receita || r.tipo), fontWeight: 600, background: `${tipoColor(r.tipo_receita || r.tipo)}15`, padding: "2px 7px", borderRadius: 20 }}>
                    {tipoLabel(r.tipo_receita || r.tipo)}
                  </span>
                  <span style={{ fontSize: 11, color: C.faint }}>
                    {r.criado_em ? new Date(r.criado_em).toLocaleDateString("pt-BR") : ""}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => printReceita(r)} title="Imprimir" style={{ flex: 1, padding: "6px", background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>🖨️</button>
                  <button onClick={() => editReceita(r)} title="Editar" style={{ flex: 1, padding: "6px", background: "#EEF2FF", color: C.indigo, border: "1px solid #C7D2FE", borderRadius: 6, cursor: "pointer", fontSize: 15 }}>✏️</button>
                  <button onClick={() => deleteReceita(r.id)} title="Excluir" style={{ flex: 1, padding: "6px", background: "#FEF2F2", color: C.red, border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer", fontSize: 15 }}>🗑️</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 20px", color: C.faint }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13 }}>{search ? "Nenhuma receita encontrada" : "Nenhuma receita salva ainda"}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
