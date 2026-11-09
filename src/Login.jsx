import { useState } from "react";
import { supabase } from "./supabase.js";

export default function Login() {
  const [modo, setModo] = useState("login"); // login | cadastro | recuperar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const inp = { width: "100%", padding: "10px 12px", border: "1px solid #e8e8ec", borderRadius: 8, fontSize: 14, background: "#fff", color: "#18181b", outline: "none", boxSizing: "border-box" };
  const btn = (bg, c = "#fff") => ({ width: "100%", padding: "11px", background: bg, color: c, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 });

  async function handleLogin(e) {
    e.preventDefault();
    setErro(""); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setLoading(false);
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setErro(""); setMsg(""); setLoading(true);
    if (!nome.trim()) { setErro("Informe seu nome."); setLoading(false); return; }
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome_completo: nome } }
    });
    if (error) setErro(error.message);
    else setMsg("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
    setLoading(false);
  }

  async function handleRecuperar(e) {
    e.preventDefault();
    setErro(""); setMsg(""); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setErro(error.message);
    else setMsg("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 36, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💊</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#18181b", letterSpacing: "-1px" }}>RxFácil</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Sistema de receitas médicas</div>
        </div>

        {msg && <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        {erro && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        {modo === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={inp} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={inp} type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
            <button style={btn("#6366f1")} type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <button type="button" onClick={() => { setModo("cadastro"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, cursor: "pointer" }}>Criar conta</button>
              <button type="button" onClick={() => { setModo("recuperar"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Esqueci a senha</button>
            </div>
          </form>
        )}

        {modo === "cadastro" && (
          <form onSubmit={handleCadastro} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={inp} type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} required />
            <input style={inp} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={inp} type="password" placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} />
            <button style={btn("#22c55e")} type="submit" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</button>
            <button type="button" onClick={() => { setModo("login"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginTop: 8 }}>← Voltar ao login</button>
          </form>
        )}

        {modo === "recuperar" && (
          <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Digite seu e-mail para receber o link de recuperação.</div>
            <input style={inp} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={btn("#6366f1")} type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</button>
            <button type="button" onClick={() => { setModo("login"); setErro(""); setMsg(""); }} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginTop: 8 }}>← Voltar ao login</button>
          </form>
        )}
      </div>
    </div>
  );
}
