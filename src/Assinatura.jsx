import { useState } from "react";

// Planos disponíveis
const PLANOS = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: "R$ 29,90",
    periodo: "por mês",
    descricao: "Acesso completo por 30 dias",
    destaque: false,
  },
  {
    id: "trimestral",
    nome: "Trimestral",
    preco: "R$ 69,90",
    periodo: "por 3 meses",
    descricao: "Economize 22% em relação ao mensal",
    destaque: true,
  },
  {
    id: "anual",
    nome: "Anual",
    preco: "R$ 199,90",
    periodo: "por ano",
    descricao: "Economize 44% — melhor custo-benefício",
    destaque: false,
  },
];

export default function Assinatura({ user, onAssinado }) {
  const [planoSelecionado, setPlanoSelecionado] = useState("trimestral");
  const [loading, setLoading] = useState(false);

  async function handleAssinar() {
    setLoading(true);
    // TODO: integrar com Mercado Pago Checkout Pro
    // Por ora abre o WhatsApp para contato
    const plano = PLANOS.find(p => p.id === planoSelecionado);
    const msg = encodeURIComponent(`Olá! Quero assinar o RxFácil — Plano ${plano.nome} (${plano.preco}). Meu e-mail: ${user.email}`);
    window.open(`https://wa.me/5531999999999?text=${msg}`, "_blank");
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#18181b", marginBottom: 8 }}>Escolha seu plano</h2>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Para acessar o RxFácil, selecione um plano abaixo.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {PLANOS.map(plano => (
          <div
            key={plano.id}
            onClick={() => setPlanoSelecionado(plano.id)}
            style={{
              border: planoSelecionado === plano.id ? "2px solid #6366f1" : "2px solid #e8e8ec",
              borderRadius: 12,
              padding: "20px 16px",
              cursor: "pointer",
              background: planoSelecionado === plano.id ? "#f5f3ff" : "#fff",
              position: "relative",
              transition: "all 0.15s",
            }}
          >
            {plano.destaque && (
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                MAIS POPULAR
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: 15, color: "#18181b", marginBottom: 6 }}>{plano.nome}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#6366f1", marginBottom: 2 }}>{plano.preco}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{plano.periodo}</div>
            <div style={{ fontSize: 12, color: "#374151" }}>{plano.descricao}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#f8f8fb", border: "1px solid #e8e8ec", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#18181b" }}>O que está incluído:</div>
        {["✓ Receituário Médico — Saúde Mental (2 vias)", "✓ Receituário de Uso Oral Contínuo (1 via)", "✓ Receita de Controle Especial (2 vias)", "✓ Impressão com layout oficial", "✓ Histórico de receitas salvas", "✓ Busca por paciente ou médico"].map(item => (
          <div key={item} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{item}</div>
        ))}
      </div>

      <button
        onClick={handleAssinar}
        disabled={loading}
        style={{ width: "100%", padding: "13px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
      >
        {loading ? "Aguarde..." : `Assinar Plano ${PLANOS.find(p => p.id === planoSelecionado)?.nome}`}
      </button>
      <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 10 }}>
        Pagamento via Mercado Pago · PIX, cartão de crédito e boleto
      </div>
    </div>
  );
}
