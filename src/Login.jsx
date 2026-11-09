import { useState } from "react";
import { supabase } from "./supabase.js";

export default function Login() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const inp = {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #E2E8F0", borderRadius: 8,
    fontSize: 15, background: "#fff", color: "#1E293B",
    outline: "none", boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };
  const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, letterSpacing: "0.01em" };

  async function handleLogin(e) {
    e.preventDefault(); setErro(""); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setLoading(false);
  }

  async function handleCadastro(e) {
    e.preventDefault(); setErro(""); setMsg(""); setLoading(true);
    if (!nome.trim()) { setErro("Informe seu nome."); setLoading(false); return; }
    const { error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome_completo: nome } } });
    if (error) setErro(error.message);
    else setMsg("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
    setLoading(false);
  }

  async function handleRecuperar(e) {
    e.preventDefault(); setErro(""); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) setErro(error.message);
    else setMsg("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
    setLoading(false);
  }

  const title = { login: "Entrar na conta", cadastro: "Criar conta", recuperar: "Recuperar senha" }[modo];

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Painel esquerdo */}
      <div style={{
        width: 420, flexShrink: 0, background: "linear-gradient(160deg, #1E3A5F 0%, #0F2744 60%, #0D1F38 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 44px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
            <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #0F9B8E, #0D7A70)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💊</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>RxFácil</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Sistema de Receitas Médicas</div>
            </div>
          </div>

          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 26, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.5px", marginBottom: 16 }}>
            Receitas médicas com layout oficial, prontas para imprimir.
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7 }}>
            Saúde Mental · Uso Contínuo · Controle Especial
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, lineHeight: 1.6 }}>
          Dados armazenados com segurança<br />
          no Supabase com criptografia em repouso
        </div>
      </div>

      {/* Painel direito */}
      <div style={{ flex: 1, background: "#EEF2F7", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F", marginBottom: 6, letterSpacing: "-0.3px" }}>{title}</h1>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
            {modo === "login" && "Bem-vindo de volta."}
            {modo === "cadastro" && "Crie sua conta gratuitamente."}
            {modo === "recuperar" && "Vamos enviar um link para você."}
          </p>

          {msg && <div style={{ background: "#DCFCE7", color: "#166534", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{msg}</div>}
          {erro && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{erro}</div>}

          {modo === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>E-mail</label><input style={inp} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><label style={lbl}>Senha</label><input style={inp} type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required /></div>
              <button style={{ padding: "12px", background: "linear-gradient(135deg, #1E3A5F, #0F9B8E)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }} type="submit" disabled={loading}>
                {loading ? "Entrando…" : "Entrar"}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <button type="button" onClick={() => { setModo("cadastro"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#0F9B8E", fontSize: 13, cursor: "pointer", fontWeight: 600, padding: 0 }}>Criar conta</button>
                <button type="button" onClick={() => { setModo("recuperar"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0 }}>Esqueci a senha</button>
              </div>
            </form>
          )}

          {modo === "cadastro" && (
            <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Nome completo</label><input style={inp} type="text" placeholder="Dr. Nome Sobrenome" value={nome} onChange={e => setNome(e.target.value)} required /></div>
              <div><label style={lbl}>E-mail</label><input style={inp} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div><label style={lbl}>Senha (mínimo 6 caracteres)</label><input style={inp} type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} /></div>
              <button style={{ padding: "12px", background: "linear-gradient(135deg, #0F9B8E, #0D7A70)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }} type="submit" disabled={loading}>
                {loading ? "Criando conta…" : "Criar conta"}
              </button>
              <button type="button" onClick={() => { setModo("login"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>← Voltar ao login</button>
            </form>
          )}

          {modo === "recuperar" && (
            <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>E-mail da sua conta</label><input style={inp} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <button style={{ padding: "12px", background: "linear-gradient(135deg, #1E3A5F, #0F9B8E)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }} type="submit" disabled={loading}>
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
              <button type="button" onClick={() => { setModo("login"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>← Voltar ao login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
