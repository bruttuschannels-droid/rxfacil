import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const emptyForm = {
  nome_paciente: "", data_nascimento: "", cpf_cns: "", endereco_paciente: "",
  tipo: "saude_mental",
  medicamentos: [{ nome: "", quantidade: "", instrucao: "" }],
  medico: "", crm: "", especialidade: "", unidade: "",
  incluir_data: true, data_receita: new Date().toISOString().split("T")[0],
  observacoes: "",
};

export default function Receitas({ user }) {
  const [receitas, setReceitas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadReceitas(); }, []);

  async function loadReceitas() {
    const { data, error } = await supabase.from("receitas").select("*").eq("user_id", user.id).order("criado_em", { ascending: false }).limit(500);
    if (error) { alert("Erro ao carregar receitas: " + error.message); return; }
    setReceitas(data || []);
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setMed(i, k, v) { setForm(f => { const m = [...f.medicamentos]; m[i] = { ...m[i], [k]: v }; return { ...f, medicamentos: m }; }); }
  function addMed() { setForm(f => ({ ...f, medicamentos: [...f.medicamentos, { nome: "", quantidade: "", instrucao: "" }] })); }
  function removeMed(i) { setForm(f => ({ ...f, medicamentos: f.medicamentos.filter((_, j) => j !== i) })); }

  async function saveReceita() {
    const { nome_paciente, data_nascimento, cpf_cns, endereco_paciente, tipo, medicamentos, medico, crm, especialidade, unidade, incluir_data, data_receita, observacoes } = form;
    if (!nome_paciente || !nome_paciente.trim()) { alert("Informe o nome do paciente."); return; }
    const payload = {
      nome_paciente: nome_paciente.trim(),
      data_nascimento: data_nascimento || null,
      cpf_cns: cpf_cns || null,
      endereco_paciente: endereco_paciente || null,
      tipo_receita: tipo,
      medicamentos: JSON.stringify(medicamentos),
      medico: medico || null,
      crm: crm || null,
      especialidade: especialidade || null,
      unidade: unidade || null,
      incluir_data: !!incluir_data,
      data_receita: data_receita || null,
      observacoes: observacoes || null,
      user_id: user.id,
    };
    let result;
    if (editing) result = await supabase.from("receitas").update(payload).eq("id", editing);
    else result = await supabase.from("receitas").insert(payload);
    if (result.error) { alert("Erro ao salvar: " + result.error.message); return; }
    setForm(emptyForm); setEditing(null); loadReceitas();
    alert("Receita salva com sucesso!");
  }

  async function deleteReceita(id) {
    if (!window.confirm("Excluir esta receita?")) return;
    await supabase.from("receitas").delete().eq("id", id);
    loadReceitas();
  }

  function editReceita(r) {
    setEditing(r.id);
    const tipo = r.tipo_receita || r.tipo || "saude_mental";
    setForm({ ...r, tipo, endereco_paciente: r.endereco_paciente || "", medicamentos: typeof r.medicamentos === "string" ? JSON.parse(r.medicamentos) : r.medicamentos, incluir_data: r.incluir_data !== false });
  }

  function printReceita(r) {
    const f2 = r || (editing ? { ...form, id: editing } : form);
    const meds = typeof f2.medicamentos === "string" ? JSON.parse(f2.medicamentos) : f2.medicamentos;
    const tipoReceita = f2.tipo_receita || f2.tipo || "saude_mental";
    const dataStr = f2.incluir_data !== false ? new Date().toLocaleDateString("pt-BR") : "";
    const unidade = f2.unidade || "ESF EMÍLIA";

    const medsHtml = meds.map(m => `
      <div style="margin-bottom:7px;line-height:1.5;">
        <div style="font-size:10pt;font-weight:700;font-family:Arial,sans-serif;">- ${(m.nome || "").toUpperCase()} ${m.quantidade ? "----- " + m.quantidade : ""}</div>
        ${m.instrucao ? `<div style="font-size:9pt;font-family:Arial,sans-serif;padding-left:14px;line-height:1.5;">${m.instrucao}</div>` : ""}
      </div>`).join("");

    function blocoEmitente() {
      return `
        <div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO EMITENTE</div>
          <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Unidade de Saúde:</span> ${unidade}</div>
          ${f2.endereco_unidade ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Endereço:</span> ${f2.endereco_unidade}</div>` : ""}
          <div style="display:flex;gap:10px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;">
            ${f2.cnes ? `<span><span style="font-weight:700;">CNES:</span> ${f2.cnes}</span>` : ""}
            ${f2.telefone_unidade ? `<span><span style="font-weight:700;">Telefone:</span> ${f2.telefone_unidade}</span>` : ""}
          </div>
        </div>`;
    }

    function blocoPrescritor() {
      return `
        <div style="border-top:1px solid #000;margin-top:5px;padding-top:4px;">
          <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO E ASSINATURA DO PRESCRITOR</div>
          <div style="display:flex;gap:10px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.8;">
            <span style="flex:1;"><span style="font-weight:700;">Nome:</span> ${f2.medico || ""}</span>
            <span><span style="font-weight:700;">CRM/MG:</span> ${f2.crm || ""}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:8pt;font-family:Arial,sans-serif;line-height:1.8;">
            <span>Assinatura: _______________________________</span>
            <span>Data: ${dataStr || "____/____/________"}</span>
          </div>
        </div>`;
    }

    function viaControle(titulo) {
      return `
        <div style="padding:7mm 10mm;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
          <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:6px;">
            <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.5;">SECRETARIA MUNICIPAL DE SAÚDE</div>
            <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;line-height:1.5;">RECEITA DE CONTROLE ESPECIAL</div>
            <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.5;">${titulo}</div>
          </div>
          ${blocoEmitente()}
          <div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
            <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO PACIENTE</div>
            <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Nome:</span> ${f2.nome_paciente || ""}</div>
            ${f2.endereco_paciente ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Endereço:</span> ${f2.endereco_paciente}</div>` : ""}
            <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">CPF:</span> ${f2.cpf_cns || ""}</div>
          </div>
          <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:4px;">
            <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:3px;text-decoration:underline;">PRESCRIÇÃO</div>
            <div>${medsHtml}</div>
          </div>
          <div style="margin-top:auto;">
            ${blocoPrescritor()}
            <div style="font-size:7.5pt;font-family:Arial,sans-serif;line-height:1.6;margin-top:2px;">Data de impressão: ${new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>`;
    }

    function viaSaudeMental(titulo) {
      return `
        <div style="padding:8mm 10mm;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
          <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:7px;">
            <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.6;">SECRETARIA MUNICIPAL DE SAÚDE</div>
            <div style="font-size:10pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.6;">${unidade}</div>
            <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;line-height:1.5;">RECEITUÁRIO MÉDICO</div>
            <div style="font-size:7.5pt;font-family:Arial,sans-serif;line-height:1.5;">${f2.cidade || ""}</div>
          </div>
          <div style="font-size:8.5pt;font-family:Arial,sans-serif;font-weight:700;margin-bottom:3px;">${titulo}</div>
          <div style="border-bottom:1px solid #000;margin-bottom:7px;"></div>
          <div style="font-size:8.5pt;font-family:Arial,sans-serif;margin-bottom:5px;line-height:1.6;"><span style="font-weight:700;">NOME:</span> ${f2.nome_paciente || ""}</div>
          <div style="display:flex;gap:8px;font-size:8.5pt;font-family:Arial,sans-serif;margin-bottom:7px;line-height:1.6;">
            <span><span style="font-weight:700;">NASC:</span> ${f2.data_nascimento ? new Date(f2.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : ""}</span>
            <span><span style="font-weight:700;">CPF/CNS:</span> ${f2.cpf_cns || ""}</span>
          </div>
          <div style="border-top:1px solid #000;margin:4px 0 7px;"></div>
          <div style="font-size:8.5pt;font-weight:700;font-family:Arial,sans-serif;text-decoration:underline;margin-bottom:7px;">PRESCRIÇÃO:</div>
          <div style="flex:1;">${medsHtml}</div>
          <div style="border-top:1px solid #000;margin-top:8px;padding-top:5px;">
            <div style="display:flex;justify-content:space-between;font-size:8pt;font-family:Arial,sans-serif;line-height:1.8;">
              <span>Local e Data: ${dataStr ? (f2.cidade || "Local") + ", " + dataStr : ""}</span>
              <span>Assinatura e Carimbo: ___________________</span>
            </div>
          </div>
        </div>`;
    }

    function viaUsoContinuo() {
      return `
        <div style="padding:8mm 12mm;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
          <div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:5px;margin-bottom:6px;">
            <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.5;">SECRETARIA MUNICIPAL DE SAÚDE</div>
            <div style="font-size:12pt;font-weight:900;font-family:Arial,sans-serif;letter-spacing:1px;line-height:1.5;">RECEITUÁRIO MÉDICO</div>
            <div style="font-size:8pt;font-weight:700;font-family:Arial,sans-serif;line-height:1.5;">USO ORAL CONTÍNUO</div>
          </div>
          ${blocoEmitente()}
          <div style="border:1px solid #000;padding:4px 7px;margin-bottom:5px;">
            <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px;">IDENTIFICAÇÃO DO PACIENTE</div>
            <div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Nome:</span> ${f2.nome_paciente || ""}</div>
            ${f2.endereco_paciente ? `<div style="font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;"><span style="font-weight:700;">Endereço:</span> ${f2.endereco_paciente}</div>` : ""}
            <div style="display:flex;gap:10px;font-size:8pt;font-family:Arial,sans-serif;line-height:1.6;">
              <span><span style="font-weight:700;">Nasc:</span> ${f2.data_nascimento ? new Date(f2.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : ""}</span>
              <span><span style="font-weight:700;">CPF/CNS:</span> ${f2.cpf_cns || ""}</span>
            </div>
          </div>
          <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:4px;">
            <div style="font-size:7.5pt;font-weight:700;font-family:Arial,sans-serif;margin-bottom:4px;text-decoration:underline;">PRESCRIÇÃO</div>
            <div style="flex:1;">${medsHtml}</div>
          </div>
          <div style="margin-top:auto;">
            ${blocoPrescritor()}
          </div>
        </div>`;
    }

    let html;
    if (tipoReceita === "controle_especial") {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receita Controle Especial</title>
      <style>@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:297mm;height:210mm;display:flex;}.via{width:50%;height:210mm;overflow:hidden;}.via:first-child{border-right:1.5px dashed #aaa;}</style>
      </head><body>
      <div class="via">${viaControle("1ª VIA  ·  RETENÇÃO PELA FARMÁCIA")}</div>
      <div class="via">${viaControle("2ª VIA  ·  PACIENTE")}</div>
      </body></html>`;
    } else if (tipoReceita === "saude_mental" || tipoReceita === "saude mental") {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receita</title>
      <style>@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:297mm;height:210mm;display:flex;}.via{width:50%;height:210mm;overflow:hidden;}.via:first-child{border-right:1px dashed #aaa;}</style>
      </head><body>
      <div class="via">${viaSaudeMental("1ª VIA - FARMÁCIA")}</div>
      <div class="via">${viaSaudeMental("2ª VIA - PACIENTE")}</div>
      </body></html>`;
    } else {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receita</title>
      <style>@page{size:A4 portrait;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{width:210mm;height:297mm;}</style>
      </head><body>${viaUsoContinuo()}</body></html>`;
    }

    const w = window.open("", "_blank", "width=900,height=650");
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  const filtered = receitas.filter(r => {
    const s = search.toLowerCase();
    return !s || (r.nome_paciente || "").toLowerCase().includes(s) || (r.medico || "").toLowerCase().includes(s);
  });

  const inp = { padding: "7px 10px", border: "1px solid #e8e8ec", borderRadius: 6, fontSize: 13, width: "100%", background: "#fff", color: "#18181b", boxSizing: "border-box" };
  const btn = (bg, c = "#fff") => ({ padding: "7px 14px", background: bg, color: c, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 });

  const tipoLabel = t => t === "saude_mental" ? "Saúde Mental" : t === "controle_especial" ? "Controle Especial" : "Uso Contínuo";

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 17, fontWeight: 700, color: "#18181b" }}>💊 Receitas Médicas</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* FORMULÁRIO */}
        <div style={{ background: "#fff", border: "1px solid #e8e8ec", borderRadius: 10, padding: 16 }}>
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 700 }}>{editing ? "✏️ Editar Receita" : "➕ Nova Receita"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select style={inp} value={form.tipo} onChange={e => setField("tipo", e.target.value)}>
              <option value="saude_mental">Saúde Mental (A4 Paisagem - 2 vias)</option>
              <option value="uso_continuo">Uso Oral Contínuo (A4 Retrato - 1 via)</option>
              <option value="controle_especial">Controle Especial (A4 Paisagem - 2 vias)</option>
            </select>
            <input style={inp} placeholder="Nome do Paciente *" value={form.nome_paciente} onChange={e => setField("nome_paciente", e.target.value)} />
            <input style={inp} type="date" value={form.data_nascimento} onChange={e => setField("data_nascimento", e.target.value)} />
            <input style={inp} placeholder="CPF / CNS" value={form.cpf_cns} onChange={e => setField("cpf_cns", e.target.value)} />
            {(form.tipo === "controle_especial" || form.tipo === "uso_continuo") && (
              <input style={inp} placeholder="Endereço do Paciente" value={form.endereco_paciente || ""} onChange={e => setField("endereco_paciente", e.target.value)} />
            )}
            <input style={inp} placeholder="Médico(a)" value={form.medico} onChange={e => setField("medico", e.target.value)} />
            <input style={inp} placeholder="CRM" value={form.crm} onChange={e => setField("crm", e.target.value)} />
            <input style={inp} placeholder="Especialidade" value={form.especialidade} onChange={e => setField("especialidade", e.target.value)} />
            <input style={inp} placeholder="Unidade de Saúde" value={form.unidade} onChange={e => setField("unidade", e.target.value)} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" id="inc_data" checked={!!form.incluir_data} onChange={e => setField("incluir_data", e.target.checked)} />
              <label htmlFor="inc_data" style={{ fontSize: 13 }}>Incluir data na receita</label>
            </div>
            <div style={{ borderTop: "1px solid #e8e8ec", paddingTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Medicamentos:</div>
              {form.medicamentos.map((m, i) => (
                <div key={i} style={{ background: "#f8f8fb", border: "1px solid #e8e8ec", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <input style={{ ...inp, flex: 2 }} placeholder="Nome do medicamento" value={m.nome} onChange={e => setMed(i, "nome", e.target.value)} />
                    <input style={{ ...inp, flex: 1 }} placeholder="Qtd" value={m.quantidade} onChange={e => setMed(i, "quantidade", e.target.value)} />
                    <button style={{ ...btn("#ef4444"), padding: "6px 10px" }} onClick={() => removeMed(i)}>✕</button>
                  </div>
                  <input style={inp} placeholder="Posologia / instruções" value={m.instrucao} onChange={e => setMed(i, "instrucao", e.target.value)} />
                </div>
              ))}
              <button style={btn("#6366f1")} onClick={addMed}>+ Medicamento</button>
            </div>
            <textarea style={{ ...inp, height: 60, resize: "vertical" }} placeholder="Observações (uso interno, não sai no impresso)" value={form.observacoes} onChange={e => setField("observacoes", e.target.value)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button style={btn("#22c55e")} onClick={saveReceita}>{editing ? "💾 Atualizar" : "💾 Salvar"}</button>
              <button style={btn("#3b82f6")} onClick={() => printReceita(null)}>🖨️ Imprimir</button>
              {editing && <button style={btn("#6b7280")} onClick={() => { setEditing(null); setForm(emptyForm); }}>✕ Cancelar</button>}
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div style={{ background: "#fff", border: "1px solid #e8e8ec", borderRadius: 10, padding: 16 }}>
          <h3 style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>📋 Receitas Salvas ({receitas.length})</h3>
          <input style={{ ...inp, marginBottom: 4 }} placeholder="Buscar por paciente ou médico..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{search ? `${filtered.length} de ${receitas.length} receitas` : `${receitas.length} receitas`}</div>
          <button style={{ ...btn("#6b7280"), fontSize: 11, padding: "4px 10px", marginBottom: 8 }} onClick={loadReceitas}>🔄 Recarregar</button>
          <div style={{ maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: "#f8f8fb", border: "1px solid #e8e8ec", borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.nome_paciente}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{r.medico} • {tipoLabel(r.tipo_receita || r.tipo)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.criado_em ? new Date(r.criado_em).toLocaleDateString("pt-BR") : ""}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button style={btn("#3b82f6")} onClick={() => printReceita(r)}>🖨️</button>
                  <button style={btn("#6366f1")} onClick={() => editReceita(r)}>✏️</button>
                  <button style={btn("#ef4444")} onClick={() => deleteReceita(r.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>Nenhuma receita encontrada</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
