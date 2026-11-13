import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "./config/firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";

// ============================================================
// CONSTANTES
// ============================================================
const CATEGORIES = [
  { id: "vaz_mangueiras", label: "Vaz. Mangueiras", color: "#3b82f6" },
  { id: "vaz_tubos_cilindros", label: "Vaz. Tubos/Cilindros", color: "#ef4444" },
  { id: "freio", label: "Freio", color: "#f97316" },
  { id: "lubrificantes_filtros", label: "Lubrificantes e Filtros", color: "#22c55e" },
  { id: "pneus", label: "Pneus", color: "#eab308" },
  { id: "funilaria", label: "Funilaria", color: "#8b5cf6" },
  { id: "eletrica", label: "Elétrica", color: "#06b6d4" },
  { id: "pinos_soldas", label: "Pinos e Soldas", color: "#a16207" },
  { id: "motor", label: "Motor", color: "#dc2626" },
  { id: "lampadas_sinaleiras", label: "Lâmpadas/Sinaleiras/Refletores", color: "#fbbf24" },
  { id: "vidros_espelhos", label: "Vidros e Espelhos", color: "#7dd3fc" },
  { id: "suspensao", label: "Suspensão Diant./Tras.", color: "#a78bfa" },
  { id: "carroceria", label: "Carroceria", color: "#fb923c" },
  { id: "comando_guindaste", label: "Comando do Guindaste", color: "#f472b6" },
  { id: "guindaste", label: "Guindaste", color: "#2dd4bf" },
  { id: "cesto_aereo", label: "Cesto Aéreo", color: "#38bdf8" },
  { id: "lavagem", label: "Lavagem", color: "#34d399" },
  { id: "outros", label: "Outros", color: "#6b7280" },
];

const VEHICLE_TYPES = [
  { id: "caminhao", label: "Caminhão", icon: "🚛" },
  { id: "veiculo", label: "Veículo", icon: "🚗" },
];

const INITIAL_VEHICLES = {
  v1:  { placa: "JAD2E49", motorista: "LUCAS NEU", equipe: "SR05414", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 170E28", ano: 2020 },
  v2:  { placa: "JDL2G75", motorista: "PAULO STEINBORN", equipe: "SRO5501", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "18.260 4X2", ano: 2025 },
  v3:  { placa: "JBO2G50", motorista: "VANDERLEI PAQUEIRA", equipe: "SRO5081", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 240E28", ano: 2022 },
  v4:  { placa: "JBO9B97", motorista: "MÁRCIO JURAWSKI", equipe: "SRO5838", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 240E28", ano: 2023 },
  v5:  { placa: "IYX1898", motorista: "SANDRO KUZEY", equipe: "SRO5839", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723B", ano: 2019 },
  v6:  { placa: "JBG7D86", motorista: "JOÃO DURÃO", equipe: "SRO5823", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "17.260 CRM 4X2 4P", ano: 2022 },
  v7:  { placa: "IYY6903", motorista: "CLÉVERSON PAYVA", equipe: "SRO5658", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723B", ano: 2019 },
  v8:  { placa: "JAX2H68", motorista: "ELEMAR RATKE", equipe: "SRO5363", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "17.260 CRM 4X2 4P", ano: 2022 },
  v9:  { placa: "JBA2H75", motorista: "DARCI STEFAN", equipe: "SRO5483", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "17.260 CRM 4X2", ano: 2022 },
  v10: { placa: "JAG0F42", motorista: "ELÓI PAVÃO", equipe: "SRO5761", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 170E28", ano: 2020 },
  v11: { placa: "IYX0585", motorista: "DIECSON BATISTA", equipe: "LV 6252", tipo: "caminhao", marca: "FORD", modelo: "CARGO 816 S", ano: 2019 },
  v12: { placa: "IZZ6113", motorista: "JOSIAS GODOY", equipe: "LV 6143", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 9-190", ano: 2020 },
  v13: { placa: "IZA6112", motorista: "ROGÉRIO SCHUCK", equipe: "SRO 7951", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723B", ano: 2019 },
  v14: { placa: "IUI2G62", motorista: "POLIDRIL 1 (SRO)", equipe: "SRO 7744", tipo: "caminhao", marca: "IVECO", modelo: "EUROCARGO 260E25", ano: 2012 },
  v15: { placa: "IUL1160", motorista: "GILBERTO REICHEL", equipe: "SRO 7743", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "24.280 CRM 6X2", ano: 2013 },
  v16: { placa: "IZX8A52", motorista: "GABRIEL PAULOS", equipe: "GERENTE", tipo: "veiculo", marca: "VOLKSWAGEN", modelo: "GOL 1.6L MB5", ano: 2021 },
  v17: { placa: "IWI8H60", motorista: "CALÇADA", equipe: "ADM SANTA ROSA", tipo: "veiculo", marca: "FIAT", modelo: "STRADA WORKING", ano: 2015 },
  v18: { placa: "IVM3D85", motorista: "LUÍZ", equipe: "SRO", tipo: "veiculo", marca: "FIAT", modelo: "STRADA WORKING 1.4", ano: 2014 },
  v19: { placa: "JBG5J56", motorista: "JOSEMAR", equipe: "SRO", tipo: "veiculo", marca: "FIAT", modelo: "STRADA ENDURANCE CS 1.4", ano: 2022 },
};

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const getCat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[9];
const getIcon = (tipo) => VEHICLE_TYPES.find((t) => t.id === tipo)?.icon || "🚛";

// ============================================================
// FIREBASE HOOKS
// ============================================================
function useRT(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onValue(ref(db, path), (s) => { setData(s.val()); setLoading(false); }, () => setLoading(false));
    return () => unsub();
  }, [path]);
  return { data, loading };
}

function toArr(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([id, v]) => ({ id, ...v }));
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function seedVehicles() {
  const r = ref(db, "veiculos");
  onValue(r, (s) => { if (!s.exists()) set(r, INITIAL_VEHICLES); }, { onlyOnce: true });
}

// ============================================================
// TOOLTIP CUSTOMIZADO RECHARTS
// ============================================================
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1f2b", border: "1px solid #2a3040", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

// ============================================================
// COMPONENTE: LANÇAMENTO RÁPIDO (MULTI-ITEM)
// ============================================================
function QuickEntry({ vehicles }) {
  const mob = useIsMobile();
  const today = new Date().toISOString().slice(0, 10);
  const [veiculoId, setVeiculoId] = useState("");
  const [data, setData] = useState(today);
  const [km, setKm] = useState("");
  const [items, setItems] = useState([]); // { categoria, descricao, valor }
  const [curCat, setCurCat] = useState("");
  const [curDesc, setCurDesc] = useState("");
  const [curValor, setCurValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addItem = () => {
    if (!curCat || !curValor) return;
    setItems([...items, { categoria: curCat, descricao: curDesc, valor: parseFloat(curValor) }]);
    setCurCat(""); setCurDesc(""); setCurValor("");
  };

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const totalOS = items.reduce((s, it) => s + it.valor, 0);

  const handleSubmitAll = async () => {
    if (!veiculoId || items.length === 0) return;
    setSaving(true);
    const v = vehicles.find((x) => x.id === veiculoId);
    const osId = Date.now().toString();
    for (const it of items) {
      await push(ref(db, "manutencoes"), {
        veiculoId,
        placa: v?.placa || "",
        motorista: v?.motorista || "",
        data,
        categoria: it.categoria,
        descricao: it.descricao,
        valor: it.valor,
        km: km ? parseInt(km) : null,
        osId,
        criadoEm: Date.now(),
      });
    }
    setSaved(true);
    setItems([]); setVeiculoId(""); setData(today); setKm("");
    setSaving(false);
    setTimeout(() => setSaved(false), 4000);
  };

  const sorted = [...vehicles].sort((a, b) => a.placa.localeCompare(b.placa));

  return (
    <div>
      <h2 style={titleStyle}>Lançamento de Manutenção</h2>
      <p style={{ fontSize: 13, color: "var(--m)", marginBottom: 20 }}>
        Selecione o veículo, depois adicione os serviços realizados. Pode incluir vários itens na mesma manutenção.
      </p>

      {/* Veículos */}
      <label style={lbl}>Veículo *</label>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(185px, 1fr))", gap: 8, marginBottom: 16 }}>
        {sorted.map((v) => (
          <button key={v.id} onClick={() => setVeiculoId(v.id)} style={{
            background: veiculoId === v.id ? "var(--a)" : "var(--c)",
            color: veiculoId === v.id ? "#fff" : "var(--t)",
            border: veiculoId === v.id ? "2px solid var(--a)" : "1px solid var(--b)",
            borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{getIcon(v.tipo)}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{v.placa}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{v.motorista}{v.equipe ? ` · ${v.equipe}` : ""}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{[v.marca, v.modelo].filter(Boolean).join(" ")} · {v.ano}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Data e KM */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div><label style={lbl}>Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inp} /></div>
        <div><label style={lbl}>KM do veículo</label><input type="number" inputMode="numeric" placeholder="KM atual" value={km} onChange={(e) => setKm(e.target.value)} style={inp} /></div>
      </div>

      {/* Adicionar item */}
      <div style={{ ...card, marginBottom: 16, borderLeft: "3px solid var(--a)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Adicionar Serviço</h3>

        <label style={lbl}>Categoria *</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCurCat(c.id)} style={{
              background: curCat === c.id ? c.color : c.color + "18",
              color: curCat === c.id ? "#fff" : c.color,
              border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "2fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div><label style={lbl}>Descrição</label><input placeholder="Ex: Troca mangueira cilindro" value={curDesc} onChange={(e) => setCurDesc(e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Valor (R$) *</label><input type="number" inputMode="decimal" placeholder="0,00" value={curValor} onChange={(e) => setCurValor(e.target.value)} style={{ ...inp, fontWeight: 700 }} /></div>
          <button onClick={addItem} disabled={!curCat || !curValor} style={{
            padding: "10px 20px", background: (!curCat || !curValor) ? "var(--b)" : "#22c55e", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: (!curCat || !curValor) ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            + Adicionar
          </button>
        </div>
      </div>

      {/* Lista de itens adicionados */}
      {items.length > 0 && (
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Itens da Manutenção ({items.length})
          </h3>
          {items.map((it, i) => {
            const cat = getCat(it.categoria);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid var(--b)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: cat.color + "20", color: cat.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{cat.label}</span>
                  <span style={{ fontSize: 13, color: "var(--m)" }}>{it.descricao || "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums", color: "#f59e0b" }}>{fmt(it.valor)}</span>
                  <button onClick={() => removeItem(i)} style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "2px solid var(--b)" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Total da Manutenção</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmt(totalOS)}</span>
          </div>
        </div>
      )}

      {/* Botão salvar */}
      <button onClick={handleSubmitAll} disabled={!veiculoId || items.length === 0 || saving} style={{
        width: "100%", padding: 16,
        background: (!veiculoId || items.length === 0) ? "var(--b)" : "var(--a)",
        color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
        cursor: (!veiculoId || items.length === 0) ? "not-allowed" : "pointer", fontFamily: "inherit",
      }}>
        {saving ? "Salvando..." : `Salvar Manutenção (${items.length} ${items.length === 1 ? "item" : "itens"} — ${fmt(totalOS)})`}
      </button>

      {saved && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 10, color: "#22c55e", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          ✓ Manutenção salva com sucesso!
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: DASHBOARD
// ============================================================
function Dashboard({ vehicles, manutencoes, dataInicio, dataFim, filterCat, selectedVehicle }) {
  const mob = useIsMobile();
  const stats = useMemo(() => {
    const filtered = manutencoes.filter((m) => {
      if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
      if (filterCat !== "todas" && m.categoria !== filterCat) return false;
      if (m.data < dataInicio || m.data > dataFim) return false;
      return true;
    });

    const totalGeral = filtered.reduce((s, m) => s + m.valor, 0);
    const count = filtered.length;

    // por veículo
    const bv = {};
    filtered.forEach((m) => {
      if (!bv[m.veiculoId]) bv[m.veiculoId] = { total: 0, count: 0, cats: {} };
      bv[m.veiculoId].total += m.valor;
      bv[m.veiculoId].count += 1;
      bv[m.veiculoId].cats[m.categoria] = (bv[m.veiculoId].cats[m.categoria] || 0) + m.valor;
    });
    const ranking = vehicles.map((v) => ({ ...v, total: bv[v.id]?.total || 0, count: bv[v.id]?.count || 0, cats: bv[v.id]?.cats || {} }))
      .sort((a, b) => b.total - a.total).filter((v) => v.total > 0);

    // por categoria
    const byCategory = CATEGORIES.map((c) => ({ ...c, value: filtered.filter((m) => m.categoria === c.id).reduce((s, m) => s + m.valor, 0), qty: filtered.filter((m) => m.categoria === c.id).length })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
    const catTotal = byCategory.reduce((s, c) => s + c.value, 0);

    // mensal
    const mm = {};
    filtered.forEach((m) => { const d = new Date(m.data); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; mm[k] = (mm[k]||0) + m.valor; });
    const monthlyTrend = Object.entries(mm).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => ({ mes: MONTHS[parseInt(k.split("-")[1])-1]+"/"+k.split("-")[0].slice(2), valor: v }));

    // barras top 10
    const topVehicles = ranking.slice(0, 10).map((v) => ({
      name: v.placa,
      motorista: v.motorista,
      equipe: v.equipe || "",
      valor: v.total,
    }));

    // barras empilhadas top 8
    const catPerVehicle = ranking.slice(0, 8).map((v) => {
      const row = { name: v.placa, motorista: v.motorista };
      CATEGORIES.forEach((c) => { row[c.id] = v.cats[c.id] || 0; });
      return row;
    });

    // últimas manutenções
    const recentes = [...filtered].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    return { filtered, totalGeral, count, ranking, byCategory, catTotal, monthlyTrend, topVehicles, catPerVehicle, recentes, biggest: ranking[0] || null };
  }, [vehicles, manutencoes, dataInicio, dataFim, filterCat, selectedVehicle]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: mob ? 10 : 14, marginBottom: mob ? 20 : 28 }}>
        {[
          { label: "CUSTO TOTAL", value: fmt(stats.totalGeral), sub: `${stats.count} serviços realizados`, color: "#3b82f6", gradient: "linear-gradient(135deg, #1e3a5f, #1e40af22)", icon: "💰" },
          { label: "MÉDIA POR VEÍCULO", value: fmt(vehicles.length ? stats.totalGeral / vehicles.length : 0), sub: `${vehicles.length} veículos na frota`, color: "#f59e0b", gradient: "linear-gradient(135deg, #422006, #92400e22)", icon: "🚛" },
          { label: "VEÍCULO MAIS CARO", value: stats.biggest ? fmt(stats.biggest.total) : "—", sub: stats.biggest ? `${stats.biggest.placa} · ${stats.biggest.motorista}` : "Sem dados", color: "#ef4444", gradient: "linear-gradient(135deg, #450a0a, #991b1b22)", icon: "🔺" },
          { label: "TICKET MÉDIO", value: fmt(stats.count ? stats.totalGeral / stats.count : 0), sub: "valor médio por serviço", color: "#22c55e", gradient: "linear-gradient(135deg, #052e16, #16653422)", icon: "🔧" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: kpi.gradient, border: `1px solid ${kpi.color}33`, borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -10, right: -5, fontSize: 60, opacity: 0.07 }}>{kpi.icon}</div>
            <p style={{ fontSize: 10, color: kpi.color, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>{kpi.label}</p>
            <p style={{ fontSize: mob ? 18 : 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: "var(--m)" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Evolução Mensal - GRANDE */}
      <div style={{ ...card, marginBottom: 20, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📈 Evolução Mensal de Custos</h3>
        <p style={{ fontSize: 12, color: "var(--m)", marginBottom: 20 }}>Acompanhe a tendência de gastos mês a mês</p>
        {stats.monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyTrend} barSize={32}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e243280" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "#6b7a90", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7a90", fontSize: 11 }} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="valor" name="Custo Mensal" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </div>

      {/* Custos por Categoria + Top Veículos lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Donut + lista de categorias */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏷️ Custos por Categoria</h3>
          <p style={{ fontSize: 12, color: "var(--m)", marginBottom: 16 }}>Onde está indo o dinheiro</p>
          {stats.byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.byCategory} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                    {stats.byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Lista detalhada */}
              <div style={{ marginTop: 8 }}>
                {stats.byCategory.map((c, i) => {
                  const pct = stats.catTotal ? ((c.value / stats.catTotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < stats.byCategory.length - 1 ? "1px solid var(--b)" : "none" }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: "var(--m)", minWidth: 30, textAlign: "right" }}>{pct}%</span>
                      <span style={{ fontSize: 11, color: "var(--m)", minWidth: 20, textAlign: "right" }}>{c.qty}x</span>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 90, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(c.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : <Empty />}
        </div>

        {/* Top veículos - barras horizontais */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏆 Top Veículos por Custo</h3>
          <p style={{ fontSize: 12, color: "var(--m)", marginBottom: 16 }}>Os que mais gastaram no período</p>
          {stats.topVehicles.length > 0 ? (
            <div>
              {stats.topVehicles.map((v, i) => {
                const pct = stats.topVehicles[0]?.valor ? (v.valor / stats.topVehicles[0].valor) * 100 : 0;
                const barColors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e", "#3b82f6", "#3b82f6", "#3b82f6", "#6b7280", "#6b7280"];
                return (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: barColors[i], minWidth: 22 }}>#{i+1}</span>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</span>
                        <span style={{ fontSize: 11, color: "#60a5fa" }}>{v.motorista}</span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{fmt(v.valor)}</span>
                    </div>
                    <div style={{ height: 8, background: "var(--b)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${barColors[i]}, ${barColors[i]}88)`, borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <Empty />}
        </div>
      </div>

      {/* Composição empilhada - GRANDE */}
      <div style={{ ...card, marginBottom: 20, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Composição de Custos por Veículo</h3>
        <p style={{ fontSize: 12, color: "var(--m)", marginBottom: 20 }}>Quais categorias pesam mais em cada veículo</p>
        {stats.catPerVehicle.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(280, stats.catPerVehicle.length * 52)}>
            <BarChart data={stats.catPerVehicle} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e243250" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7a90", fontSize: 11 }} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} axisLine={false} />
              <YAxis dataKey="name" type="category" width={100}
                tick={({ x, y, payload }) => {
                  const item = stats.catPerVehicle.find(v => v.name === payload.value);
                  return (<g><text x={x} y={y-7} textAnchor="end" fill="#e8ecf4" fontSize={13} fontWeight={700}>{payload.value}</text>
                    <text x={x} y={y+9} textAnchor="end" fill="#60a5fa" fontSize={10}>{item?.motorista}</text></g>);
                }} />
              <Tooltip content={<ChartTip />} />
              {CATEGORIES.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} stackId="a" fill={c.color} radius={0} />)}
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
        {/* Legenda */}
        {stats.catPerVehicle.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--b)" }}>
            {CATEGORIES.filter(c => stats.byCategory.some(bc => bc.id === c.id)).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                <span style={{ color: "var(--m)" }}>{c.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking detalhado */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📋 Ranking Detalhado — Veículo / Motorista</h3>
        <p style={{ fontSize: 12, color: "var(--m)", marginBottom: 20 }}>Todos os veículos com custos, categorias e detalhes</p>
        {stats.ranking.map((v, i) => {
          const pct = stats.ranking[0]?.total ? (v.total / stats.ranking[0].total) * 100 : 0;
          const topCats = Object.entries(v.cats).sort(([,a],[,b]) => b - a).slice(0, 4).map(([id, val]) => ({ ...getCat(id), val }));
          const medalColors = ["#ef4444", "#f59e0b", "#f97316"];
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div key={v.id} style={{ padding: "16px 0", borderBottom: i < stats.ranking.length - 1 ? "1px solid var(--b)" : "none" }}>
              <div style={{ display: "flex", flexDirection: mob ? "column" : "row", justifyContent: "space-between", alignItems: mob ? "flex-start" : "center", marginBottom: 8, gap: mob ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: mob ? 8 : 12, flexWrap: "wrap" }}>
                  {i < 3 ? (
                    <span style={{ fontSize: mob ? 18 : 22, minWidth: mob ? 26 : 32, textAlign: "center" }}>{medals[i]}</span>
                  ) : (
                    <span style={{ fontSize: mob ? 12 : 14, fontWeight: 800, minWidth: mob ? 26 : 32, textAlign: "center", color: "var(--m)" }}>#{i+1}</span>
                  )}
                  {!mob && <span style={{ fontSize: 22 }}>{getIcon(v.tipo)}</span>}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: mob ? 14 : 16 }}>{v.placa}</span>
                      <span style={{ fontSize: mob ? 12 : 14, color: "#60a5fa", fontWeight: 600 }}>👤 {v.motorista}</span>
                      {v.equipe && !mob && <span style={{ fontSize: 11, color: "var(--m)", background: "var(--b)", padding: "2px 8px", borderRadius: 4 }}>{v.equipe}</span>}
                    </div>
                    {!mob && <span style={{ fontSize: 12, color: "var(--m)" }}>{[v.marca, v.modelo].filter(Boolean).join(" ")} · {v.ano} · {v.count} {v.count === 1 ? "serviço" : "serviços"}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: mob ? 34 : 0 }}>
                  <span style={{ fontSize: mob ? 18 : 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: i < 3 ? medalColors[i] : "var(--t)" }}>{fmt(v.total)}</span>
                  <span style={{ fontSize: 11, color: "var(--m)" }}>({((v.total / stats.totalGeral) * 100).toFixed(1)}%)</span>
                </div>
              </div>
              {/* Barra de progresso */}
              <div style={{ height: 8, background: "var(--b)", borderRadius: 4, marginLeft: 44, marginRight: 0, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: i < 3 ? `linear-gradient(90deg, ${medalColors[i]}, ${medalColors[i]}66)` : "linear-gradient(90deg, #3b82f6, #3b82f660)", borderRadius: 4, transition: "width 0.6s ease" }} />
              </div>
              {/* Tags de categorias */}
              <div style={{ display: "flex", gap: 8, marginLeft: 44, flexWrap: "wrap" }}>
                {topCats.map((c) => (
                  <div key={c.id} style={{ background: c.color + "15", border: `1px solid ${c.color}30`, borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                    <span style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t)" }}>{fmt(c.val)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {stats.ranking.length === 0 && <Empty />}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: HISTÓRICO (com edição)
// ============================================================
function Historico({ vehicles, manutencoes, dataInicio, dataFim, filterCat, selectedVehicle }) {
  const mob = useIsMobile();
  const [confirmDel, setConfirmDel] = useState(null);
  const [editing, setEditing] = useState(null); // { id, ...fields }
  const [editToast, setEditToast] = useState(null);

  const filtered = manutencoes.filter((m) => {
    if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
    if (filterCat !== "todas" && m.categoria !== filterCat) return false;
    if (m.data < dataInicio || m.data > dataFim) return false;
    return true;
  }).sort((a, b) => new Date(b.data) - new Date(a.data));

  const total = filtered.reduce((s, m) => s + m.valor, 0);

  const handleDel = async (id) => {
    if (confirmDel === id) { await remove(ref(db, `manutencoes/${id}`)); setConfirmDel(null); }
    else { setConfirmDel(id); setTimeout(() => setConfirmDel(null), 3000); }
  };

  const openEdit = (m) => {
    const v = vehicles.find((x) => x.id === m.veiculoId);
    setEditing({ id: m.id, veiculoId: m.veiculoId, data: m.data, categoria: m.categoria, descricao: m.descricao || "", valor: m.valor, km: m.km || "" });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const v = vehicles.find((x) => x.id === editing.veiculoId);
    await update(ref(db, `manutencoes/${editing.id}`), {
      veiculoId: editing.veiculoId,
      placa: v?.placa || "",
      motorista: v?.motorista || "",
      data: editing.data,
      categoria: editing.categoria,
      descricao: editing.descricao,
      valor: parseFloat(editing.valor),
      km: editing.km ? parseInt(editing.km) : null,
    });
    setEditing(null);
    setEditToast("Lançamento atualizado!");
    setTimeout(() => setEditToast(null), 3000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={titleStyle}>Histórico</h2>
        <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>Total: {fmt(total)} ({filtered.length})</span>
      </div>

      {editToast && (
        <div style={{ padding: "10px 16px", background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 10, color: "#22c55e", fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>{editToast}</div>
      )}

      {/* Modal de edição */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...card, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>✏️ Editar Lançamento</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Veículo</label>
              <select value={editing.veiculoId} onChange={(e) => setEditing({...editing, veiculoId: e.target.value})} style={inp}>
                {[...vehicles].sort((a,b) => a.placa.localeCompare(b.placa)).map((v) => (
                  <option key={v.id} value={v.id}>{v.placa} · {v.motorista} — {[v.marca, v.modelo].filter(Boolean).join(" ")}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={lbl}>Data</label><input type="date" value={editing.data} onChange={(e) => setEditing({...editing, data: e.target.value})} style={inp} /></div>
              <div><label style={lbl}>Valor (R$)</label><input type="number" value={editing.valor} onChange={(e) => setEditing({...editing, valor: e.target.value})} style={{ ...inp, fontWeight: 700 }} /></div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Categoria</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setEditing({...editing, categoria: c.id})} style={{
                    background: editing.categoria === c.id ? c.color : c.color + "18",
                    color: editing.categoria === c.id ? "#fff" : c.color,
                    border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 20 }}>
              <div><label style={lbl}>Descrição</label><input value={editing.descricao} onChange={(e) => setEditing({...editing, descricao: e.target.value})} style={inp} placeholder="Descrição do serviço" /></div>
              <div><label style={lbl}>KM</label><input type="number" value={editing.km} onChange={(e) => setEditing({...editing, km: e.target.value})} style={inp} placeholder="KM" /></div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSaveEdit} style={{ ...btnP, flex: 1, padding: 14, fontSize: 15 }}>Salvar Alterações</button>
              <button onClick={() => setEditing(null)} style={{ ...btnP, background: "var(--b)", padding: 14 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((m) => {
          const v = vehicles.find((x) => x.id === m.veiculoId);
          const cat = getCat(m.categoria);
          return (
            <div key={m.id} style={{ ...card, padding: mob ? "12px 14px" : "14px 18px" }}>
              {/* Mobile: layout empilhado / Desktop: layout em linha */}
              {mob ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{m.placa || v?.placa || "—"}</span>
                        <span style={{ background: cat.color + "20", color: cat.color, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{cat.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>👤 {m.motorista || v?.motorista || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--m)", marginTop: 2 }}>
                        {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        {m.descricao && ` — ${m.descricao}`}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmt(m.valor)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(m)} style={{ background: "#3b82f618", color: "#3b82f6", border: "1px solid #3b82f640", borderRadius: 8, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✏️ Editar</button>
                    <button onClick={() => handleDel(m.id)} style={{ background: confirmDel === m.id ? "#ef4444" : "#ef444418", color: confirmDel === m.id ? "#fff" : "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{confirmDel === m.id ? "Confirmar?" : "🗑️"}</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--m)", fontVariantNumeric: "tabular-nums", minWidth: 80 }}>{new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{m.placa || v?.placa || "—"}</span>
                      <span style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>👤 {m.motorista || v?.motorista || "—"}</span>
                      <span style={{ background: cat.color + "20", color: cat.color, padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmt(m.valor)}</span>
                      <button onClick={() => openEdit(m)} style={{ background: "#3b82f618", color: "#3b82f6", border: "1px solid #3b82f640", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✏️ Editar</button>
                      <button onClick={() => handleDel(m.id)} style={{ background: confirmDel === m.id ? "#ef4444" : "#ef444418", color: confirmDel === m.id ? "#fff" : "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{confirmDel === m.id ? "Confirmar?" : "🗑️"}</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--m)" }}>
                    <span>{v ? [v.marca, v.modelo].filter(Boolean).join(" ") + " · " + v.ano : "—"}</span>
                    {m.descricao && <span style={{ color: "var(--t)", opacity: 0.7 }}>— {m.descricao}</span>}
                    {m.km && <span style={{ fontVariantNumeric: "tabular-nums" }}>· {m.km.toLocaleString("pt-BR")} km</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <Empty />}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: VEÍCULOS
// ============================================================
function Veiculos({ vehicles, manutencoes }) {
  const mob = useIsMobile();
  const [form, setForm] = useState({ placa: "", tipo: "caminhao", marca: "", modelo: "", ano: new Date().getFullYear(), motorista: "", equipe: "" });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const show = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const handleAdd = async () => {
    if (!form.placa) return show("Preencha a placa");
    await push(ref(db, "veiculos"), { placa: form.placa.toUpperCase(), tipo: form.tipo, marca: form.marca.toUpperCase(), modelo: form.modelo.toUpperCase(), ano: parseInt(form.ano), motorista: form.motorista.toUpperCase(), equipe: form.equipe.toUpperCase() });
    setForm({ placa: "", tipo: "caminhao", marca: "", modelo: "", ano: new Date().getFullYear(), motorista: "", equipe: "" });
    show("Veículo adicionado!");
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await update(ref(db, `veiculos/${editing.id}`), { placa: editing.placa.toUpperCase(), tipo: editing.tipo, marca: (editing.marca||"").toUpperCase(), modelo: (editing.modelo||"").toUpperCase(), ano: parseInt(editing.ano), motorista: (editing.motorista||"").toUpperCase(), equipe: (editing.equipe||"").toUpperCase() });
    setEditing(null); show("Atualizado!");
  };

  const handleDel = async (id) => {
    if (!confirm("Excluir veículo e manutenções vinculadas?")) return;
    await remove(ref(db, `veiculos/${id}`));
    show("Excluído!");
  };

  return (
    <div>
      <h2 style={titleStyle}>Veículos</h2>

      {toast && <div style={{ padding: "10px 16px", background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 10, color: "#22c55e", fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>{toast}</div>}

      {/* Formulário adicionar */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Adicionar Veículo</h3>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input placeholder="Placa" value={form.placa} onChange={(e) => setForm({...form, placa: e.target.value})} style={inp} />
          <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} style={inp}>
            {VEHICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
          <input placeholder="Marca" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} style={inp} />
          <input placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} style={inp} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "0.6fr 1fr 1fr auto", gap: 10 }}>
          <input type="number" placeholder="Ano" value={form.ano} onChange={(e) => setForm({...form, ano: e.target.value})} style={inp} />
          <input placeholder="Motorista" value={form.motorista} onChange={(e) => setForm({...form, motorista: e.target.value})} style={inp} />
          <input placeholder="Equipe (ex: SRO5414)" value={form.equipe} onChange={(e) => setForm({...form, equipe: e.target.value})} style={inp} />
          <button onClick={handleAdd} style={btnP}>Adicionar</button>
        </div>
      </div>

      {/* Modal edição */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...card, maxWidth: 480, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Editar Veículo</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={editing.placa} onChange={(e) => setEditing({...editing, placa: e.target.value})} style={inp} placeholder="Placa" />
              <select value={editing.tipo} onChange={(e) => setEditing({...editing, tipo: e.target.value})} style={inp}>
                {VEHICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <input value={editing.marca||""} onChange={(e) => setEditing({...editing, marca: e.target.value})} style={inp} placeholder="Marca" />
              <input value={editing.modelo||""} onChange={(e) => setEditing({...editing, modelo: e.target.value})} style={inp} placeholder="Modelo" />
              <input type="number" value={editing.ano} onChange={(e) => setEditing({...editing, ano: e.target.value})} style={inp} placeholder="Ano" />
              <input value={editing.motorista||""} onChange={(e) => setEditing({...editing, motorista: e.target.value})} style={inp} placeholder="Motorista" />
              <input value={editing.equipe||""} onChange={(e) => setEditing({...editing, equipe: e.target.value})} style={inp} placeholder="Equipe" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleUpdate} style={{ ...btnP, flex: 1 }}>Salvar</button>
              <button onClick={() => setEditing(null)} style={{ ...btnP, background: "var(--b)" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de veículos */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {vehicles.map((v) => {
          const total = manutencoes.filter((m) => m.veiculoId === v.id).reduce((s, m) => s + m.valor, 0);
          const count = manutencoes.filter((m) => m.veiculoId === v.id).length;
          return (
            <div key={v.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{getIcon(v.tipo)}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{v.placa}</p>
                    <p style={{ fontSize: 12, color: "var(--m)" }}>{[v.marca,v.modelo].filter(Boolean).join(" ")} · {v.ano}</p>
                    {v.motorista && <p style={{ fontSize: 12, color: "#60a5fa", marginTop: 2 }}>👤 {v.motorista}</p>}
                    {v.equipe && <p style={{ fontSize: 11, color: "var(--m)", marginTop: 1 }}>Equipe: {v.equipe}</p>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setEditing({...v})} style={btnS}>Editar</button>
                  <button onClick={() => handleDel(v.id)} style={{ ...btnS, color: "#ef4444", borderColor: "#ef444440" }}>✕</button>
                </div>
              </div>
              <div style={{ marginTop: 14, borderTop: "1px solid var(--b)", paddingTop: 10 }}>
                <p style={{ fontSize: 10, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1 }}>Custo total</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmt(total)}</p>
                <p style={{ fontSize: 12, color: "var(--m)" }}>{count} manutenções</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ============================================================
// COMPONENTE: RELATÓRIO PARA APRESENTAÇÃO
// ============================================================
function Relatorio({ vehicles, manutencoes, dataInicio, dataFim, filterCat, selectedVehicle }) {
  const periodoLabel = `${new Date(dataInicio+"T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(dataFim+"T12:00:00").toLocaleDateString("pt-BR")}`;
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const filtered = manutencoes.filter((m) => {
    if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
    if (filterCat !== "todas" && m.categoria !== filterCat) return false;
    if (m.data < dataInicio || m.data > dataFim) return false;
    return true;
  });
  const all = manutencoes; // all time for comparisons

  const totalGeral = filtered.reduce((s, m) => s + m.valor, 0);
  const count = filtered.length;

  // por veículo
  const bv = {};
  filtered.forEach((m) => {
    if (!bv[m.veiculoId]) bv[m.veiculoId] = { total: 0, count: 0, cats: {}, items: [] };
    bv[m.veiculoId].total += m.valor;
    bv[m.veiculoId].count += 1;
    bv[m.veiculoId].cats[m.categoria] = (bv[m.veiculoId].cats[m.categoria] || 0) + m.valor;
    bv[m.veiculoId].items.push(m);
  });
  const ranking = vehicles.map((v) => ({ ...v, total: bv[v.id]?.total || 0, count: bv[v.id]?.count || 0, cats: bv[v.id]?.cats || {}, items: bv[v.id]?.items || [] }))
    .sort((a, b) => b.total - a.total).filter((v) => v.total > 0);

  // por categoria
  const byCategory = CATEGORIES.map((c) => ({ ...c, value: filtered.filter((m) => m.categoria === c.id).reduce((s, m) => s + m.valor, 0), qty: filtered.filter((m) => m.categoria === c.id).length })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

  // mensal
  const mm = {};
  all.forEach((m) => { const d = new Date(m.data); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; mm[k] = (mm[k]||0) + m.valor; });
  const monthlyAll = Object.entries(mm).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => ({ mes: MONTHS[parseInt(k.split("-")[1])-1]+"/"+k.split("-")[0].slice(2), valor: v }));

  // top 5 maiores serviços individuais
  const topServices = [...filtered].sort((a,b) => b.valor - a.valor).slice(0, 5);

  // veículos sem manutenção no período
  const veiculosSemManut = vehicles.filter(v => !bv[v.id]);

  // Insights automáticos
  const topCat = byCategory[0];
  const topVehicle = ranking[0];
  const avgPerService = count ? totalGeral / count : 0;

  const handlePrint = () => window.print();

  const rc = { background: "#fff", borderRadius: 14, padding: 28, marginBottom: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e8ecf0" };
  const rt = (icon, text) => ({ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 18, paddingBottom: 10, borderBottom: "2px solid #3b82f6" });
  const th = { textAlign: "left", padding: "10px 8px", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "2px solid #e2e8f0" };

  return (
    <div>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={titleStyle}>Relatório para Apresentação</h2>
        <button onClick={handlePrint} style={{ ...btnP, padding: "12px 28px", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <div id="relatorio" style={{ background: "#f1f5f9", borderRadius: 16, padding: 36, color: "#0f172a" }}>

        {/* ========== CAPA ========== */}
        <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 16, padding: "40px 36px", marginBottom: 28, color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, fontSize: 160, opacity: 0.04 }}>🔧</div>
          <p style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#60a5fa", fontWeight: 700, marginBottom: 8 }}>PROCEL — Gestão de Frota</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, letterSpacing: -1 }}>Relatório de Manutenção</h1>
          <p style={{ fontSize: 16, color: "#94a3b8", marginBottom: 20 }}>Análise detalhada de custos e indicadores</p>
          <div style={{ display: "flex", gap: 28, fontSize: 13, color: "#cbd5e1", flexWrap: "wrap" }}>
            <span>📅 <strong style={{ color: "#fff" }}>{periodoLabel}</strong></span>
            <span>📆 Emitido em <strong style={{ color: "#fff" }}>{hoje}</strong></span>
            <span>🚛 <strong style={{ color: "#fff" }}>{ranking.length}</strong> veículos com manutenção</span>
            <span>🔧 <strong style={{ color: "#fff" }}>{count}</strong> serviços realizados</span>
            {selectedVehicle && (() => { const sv = vehicles.find(v => v.id === selectedVehicle); return sv ? <span>🎯 Filtro: <strong style={{ color: "#fff" }}>{sv.placa} — {sv.motorista}</strong></span> : null; })()}
          </div>
        </div>

        {/* ========== RESUMO EXECUTIVO ========== */}
        <div style={rc}>
          <div style={rt()}>📌 Resumo Executivo</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Custo Total no Período", value: fmt(totalGeral), color: "#3b82f6", bg: "#eff6ff" },
              { label: "Serviços Realizados", value: count.toString(), color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Média por Veículo", value: fmt(vehicles.length ? totalGeral / vehicles.length : 0), color: "#f59e0b", bg: "#fffbeb" },
              { label: "Ticket Médio por Serviço", value: fmt(avgPerService), color: "#22c55e", bg: "#f0fdf4" },
            ].map((kpi, i) => (
              <div key={i} style={{ background: kpi.bg, borderRadius: 12, padding: 20, textAlign: "center", border: `1px solid ${kpi.color}22` }}>
                <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>{kpi.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 18, border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>💡 Insights do Período</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "#334155" }}>
              {topVehicle && <p>🔺 <strong>Veículo mais caro:</strong> {topVehicle.placa} ({topVehicle.motorista}) com <strong style={{ color: "#dc2626" }}>{fmt(topVehicle.total)}</strong> ({((topVehicle.total/totalGeral)*100).toFixed(1)}% do total)</p>}
              {topCat && <p>🏷️ <strong>Categoria que mais pesa:</strong> {topCat.label} com <strong style={{ color: topCat.color }}>{fmt(topCat.value)}</strong> ({((topCat.value/totalGeral)*100).toFixed(1)}%)</p>}
              <p>📊 <strong>Concentração:</strong> Os {Math.min(3, ranking.length)} veículos mais caros somam <strong>{fmt(ranking.slice(0,3).reduce((s,v)=>s+v.total,0))}</strong> ({totalGeral ? ((ranking.slice(0,3).reduce((s,v)=>s+v.total,0)/totalGeral)*100).toFixed(1) : 0}% do total)</p>
              {veiculosSemManut.length > 0 && <p>✅ <strong>{veiculosSemManut.length} veículos</strong> sem manutenção no período</p>}
            </div>
          </div>
        </div>

        {/* ========== EVOLUÇÃO MENSAL ========== */}
        <div style={rc}>
          <div style={rt()}>📈 Evolução Mensal de Custos (Histórico Completo)</div>
          {monthlyAll.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyAll} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="valor" name="Custo Mensal" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Sem dados</p>}
        </div>

        {/* ========== CUSTOS POR CATEGORIA ========== */}
        <div style={rc}>
          <div style={rt()}>🏷️ Distribuição de Custos por Categoria</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
            {/* Donut grande */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {byCategory.length > 0 && (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} strokeWidth={0}>
                      {byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Tabela detalhada */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["Categoria","Qtd","Valor","% do Total"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {byCategory.map((c) => {
                  const pct = totalGeral ? ((c.value / totalGeral) * 100) : 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{c.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center", color: "#475569", fontWeight: 600 }}>{c.qty}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 14 }}>{fmt(c.value)}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 40, color: "#475569" }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #cbd5e1" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 800, fontSize: 14 }}>TOTAL</td>
                  <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 800 }}>{count}</td>
                  <td style={{ padding: "12px 8px", fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{fmt(totalGeral)}</td>
                  <td style={{ padding: "12px 8px", fontWeight: 800 }}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ========== DETALHAMENTO POR VEÍCULO ========== */}
        <div style={rc}>
          <div style={rt()}>🚛 Detalhamento por Veículo / Motorista</div>
          {ranking.map((v, i) => {
            const pct = totalGeral ? ((v.total / totalGeral) * 100) : 0;
            const topCats = Object.entries(v.cats).sort(([,a],[,b]) => b - a).map(([id, val]) => ({ ...getCat(id), val }));
            const medals = ["🥇","🥈","🥉"];
            const barMax = ranking[0]?.total || 1;
            return (
              <div key={v.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < ranking.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                {/* Header do veículo */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: i < 3 ? 28 : 18, minWidth: 36, textAlign: "center" }}>{i < 3 ? medals[i] : `#${i+1}`}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 18 }}>{v.placa}</span>
                        <span style={{ fontSize: 14, color: "#3b82f6", fontWeight: 700 }}>{v.motorista}</span>
                        {v.equipe && <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 10px", borderRadius: 6 }}>{v.equipe}</span>}
                      </div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{[v.marca, v.modelo].filter(Boolean).join(" ")} · {v.ano} · {v.count} {v.count === 1 ? "serviço" : "serviços"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: i === 0 ? "#dc2626" : i < 3 ? "#f59e0b" : "#0f172a" }}>{fmt(v.total)}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{pct.toFixed(1)}% do total</div>
                  </div>
                </div>

                {/* Barra de custo relativa */}
                <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, marginBottom: 14, overflow: "hidden" }}>
                  <div style={{ width: `${(v.total / barMax) * 100}%`, height: "100%", background: i === 0 ? "linear-gradient(90deg,#dc2626,#f87171)" : i < 3 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 5 }} />
                </div>

                {/* Categorias em mini-barras */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {topCats.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 8, padding: "8px 12px", border: "1px solid #f1f5f9" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#334155" }}>{c.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{fmt(c.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========== TOP 5 SERVIÇOS MAIS CAROS ========== */}
        {topServices.length > 0 && (
          <div style={rc}>
            <div style={rt()}>💸 Top 5 — Serviços Mais Caros do Período</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Data","Placa","Motorista","Categoria","Descrição","Valor"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {topServices.map((m, i) => {
                  const v = vehicles.find(x => x.id === m.veiculoId);
                  const cat = getCat(m.categoria);
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9", background: i === 0 ? "#fef2f208" : "transparent" }}>
                      <td style={{ padding: "10px 8px", fontSize: 12, color: "#64748b" }}>{new Date(m.data+"T12:00:00").toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800 }}>{m.placa || v?.placa}</td>
                      <td style={{ padding: "10px 8px", color: "#3b82f6", fontWeight: 600 }}>{m.motorista || v?.motorista}</td>
                      <td style={{ padding: "10px 8px" }}><span style={{ background: cat.color+"18", color: cat.color, padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700 }}>{cat.label}</span></td>
                      <td style={{ padding: "10px 8px", color: "#475569", maxWidth: 220 }}>{m.descricao || "—"}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 15, color: i === 0 ? "#dc2626" : "#0f172a" }}>{fmt(m.valor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ========== VEÍCULOS SEM MANUTENÇÃO ========== */}
        {veiculosSemManut.length > 0 && (
          <div style={rc}>
            <div style={rt()}>✅ Veículos sem Manutenção no Período</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {veiculosSemManut.map(v => (
                <div key={v.id} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{v.placa}</span>
                  <span style={{ color: "#16a34a", marginLeft: 8 }}>{v.motorista}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== RODAPÉ ========== */}
        <div style={{ textAlign: "center", paddingTop: 20, marginTop: 8, borderTop: "2px solid #e2e8f0", color: "#94a3b8", fontSize: 11 }}>
          <p style={{ marginBottom: 4 }}>Relatório gerado automaticamente pelo <strong style={{ color: "#64748b" }}>Sistema de Controle de Frota — PROCEL</strong></p>
          <p>{hoje}</p>
        </div>
      </div>
    </div>
  );
}

// EMPTY STATE
// ============================================================
function Empty() {
  return <div style={{ textAlign: "center", padding: 40, color: "var(--m)", fontSize: 14 }}>Nenhum dado. Registre manutenções para ver os gráficos.</div>;
}

// ============================================================
// APP PRINCIPAL
// ============================================================
const TABS = [
  { id: "painel", label: "Painel", icon: "📊" },
  { id: "lancamento", label: "Lançar", icon: "➕" },
  { id: "historico", label: "Histórico", icon: "📋" },
  { id: "relatorio", label: "Relatório", icon: "📄" },
  { id: "veiculos", label: "Veículos", icon: "🚛" },
];

export default function App() {
  const mob = useIsMobile();
  const [tab, setTab] = useState("painel");
  const [filterCat, setFilterCat] = useState("todas");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const now_ = new Date();
  const [dataInicio, setDataInicio] = useState(`${now_.getFullYear()}-01-01`);
  const [dataFim, setDataFim] = useState(now_.toISOString().slice(0, 10));
  const [periodoAtivo, setPeriodoAtivo] = useState("ano");

  const setPeriodoRapido = (tipo) => {
    const h = new Date();
    let ini, fim = h.toISOString().slice(0, 10);
    if (tipo === "todos") { ini = "2020-01-01"; }
    else if (tipo === "ano") { ini = `${h.getFullYear()}-01-01`; }
    else if (tipo === "mes") { ini = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-01`; }
    else if (tipo === "trimestre") { const m = new Date(h); m.setMonth(m.getMonth()-2); ini = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-01`; }
    setDataInicio(ini); setDataFim(fim); setPeriodoAtivo(tipo);
  };

  const navMes = (dir) => {
    const d = new Date(dataInicio + "T12:00:00");
    d.setMonth(d.getMonth() + dir);
    const ini = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
    const last = new Date(d.getFullYear(), d.getMonth()+1, 0);
    const fim = `${last.getFullYear()}-${String(last.getMonth()+1).padStart(2,"0")}-${String(last.getDate()).padStart(2,"0")}`;
    setDataInicio(ini); setDataFim(fim); setPeriodoAtivo("custom");
  };

  const mesLabel = () => {
    const d = new Date(dataInicio + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const { data: vRaw, loading: lv } = useRT("veiculos");
  const { data: mRaw, loading: lm } = useRT("manutencoes");
  const vehicles = toArr(vRaw);
  const manutencoes = toArr(mRaw);

  useEffect(() => { seedVehicles(); }, []);

  const loading = lv || lm;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={{ background: "var(--c)", borderBottom: "1px solid var(--b)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔧</div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>Controle de Frota</h1>
            <p style={{ fontSize: 11, color: "var(--m)" }}>{vehicles.length} veículos · {manutencoes.length} manutenções</p>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 2 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "var(--a)" : "transparent", color: tab === t.id ? "#fff" : "var(--m)",
              border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{t.icon}</span><span className="hm">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Filtros */}
      {(tab === "painel" || tab === "historico" || tab === "relatorio") && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 16px 0" }}>
          {/* Atalhos rápidos */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[{id:"todos",label:"Tudo"},{id:"ano",label:"Este Ano"},{id:"trimestre",label:"Trimestre"},{id:"mes",label:"Este Mês"}].map((p) => (
              <button key={p.id} onClick={() => setPeriodoRapido(p.id)} style={{
                background: periodoAtivo === p.id ? "var(--a)" : "var(--c)", color: periodoAtivo === p.id ? "#fff" : "var(--m)",
                border: periodoAtivo === p.id ? "none" : "1px solid var(--b)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>{p.label}</button>
            ))}
          </div>
          {/* Navegação mês + datas + filtros */}
          <div style={{ display: "flex", flexDirection: mob ? "column" : "row", gap: 8, alignItems: mob ? "stretch" : "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--c)", border: "1px solid var(--b)", borderRadius: 10, padding: "4px 6px" }}>
              <button onClick={() => navMes(-1)} style={{ background: "transparent", color: "var(--t)", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 16, cursor: "pointer" }}>◀</button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 140, textAlign: "center", textTransform: "capitalize" }}>{mesLabel()}</span>
              <button onClick={() => navMes(1)} style={{ background: "transparent", color: "var(--t)", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 16, cursor: "pointer" }}>▶</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--m)", fontWeight: 600 }}>De:</span>
              <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPeriodoAtivo("custom"); }} style={{ ...inp, width: "auto", padding: "6px 10px", fontSize: 12 }} />
              <span style={{ fontSize: 11, color: "var(--m)", fontWeight: 600 }}>Até:</span>
              <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPeriodoAtivo("custom"); }} style={{ ...inp, width: "auto", padding: "6px 10px", fontSize: 12 }} />
            </div>
            <select value={selectedVehicle || ""} onChange={(e) => setSelectedVehicle(e.target.value || null)} style={{ ...sel, minWidth: mob ? "100%" : 200 }}>
              <option value="">Todos os veículos</option>
              {[...vehicles].sort((a,b)=>a.placa.localeCompare(b.placa)).map((v) => <option key={v.id} value={v.id}>{v.placa} · {v.motorista}</option>)}
            </select>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...sel, minWidth: mob ? "100%" : 160 }}>
              <option value="todas">Todas categorias</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--m)" }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Carregando...</div>
        ) : (
          <>
            {tab === "painel" && <Dashboard vehicles={vehicles} manutencoes={manutencoes} dataInicio={dataInicio} dataFim={dataFim} filterCat={filterCat} selectedVehicle={selectedVehicle} />}
            {tab === "lancamento" && <QuickEntry vehicles={vehicles} />}
            {tab === "historico" && <Historico vehicles={vehicles} manutencoes={manutencoes} dataInicio={dataInicio} dataFim={dataFim} filterCat={filterCat} selectedVehicle={selectedVehicle} />}
            {tab === "relatorio" && <Relatorio vehicles={vehicles} manutencoes={manutencoes} dataInicio={dataInicio} dataFim={dataFim} filterCat={filterCat} selectedVehicle={selectedVehicle} />}
            {tab === "veiculos" && <Veiculos vehicles={vehicles} manutencoes={manutencoes} />}
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================
// ESTILOS GLOBAIS + REUTILIZÁVEIS
// ============================================================
const card = { background: "var(--c)", border: "1px solid var(--b)", borderRadius: 12, padding: 20 };
const titleStyle = { fontSize: 20, fontWeight: 700, marginBottom: 8 };
const secTitle = { fontSize: 14, fontWeight: 700, marginBottom: 16 };
const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
const inp = { width: "100%", padding: "10px 12px", background: "#0a0d12", color: "var(--t)", border: "1px solid var(--b)", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
const sel = { padding: "8px 12px", background: "var(--c)", color: "var(--t)", border: "1px solid var(--b)", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none", cursor: "pointer", minWidth: 160 };
const td = { padding: "10px 10px", whiteSpace: "nowrap" };
const btnP = { padding: "10px 20px", background: "var(--a)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const btnS = { background: "transparent", color: "var(--m)", border: "1px solid var(--b)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };

const CSS = `
:root { --bg:#0a0d12; --c:#12161e; --b:#1e2432; --t:#e8ecf4; --m:#6b7a90; --a:#3b82f6; }
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--t);font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
input,select,textarea{color-scheme:dark}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--b);border-radius:3px}
@media(max-width:767px){
  .hm{display:none}
  select{min-width:100%!important;width:100%!important}
  main{padding-left:10px!important;padding-right:10px!important}
}
.recharts-default-tooltip{background:var(--c)!important;border:1px solid var(--b)!important;border-radius:8px!important}
@media print{
  body{background:#fff!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header,.no-print{display:none!important}
  main{max-width:100%!important;padding:0!important;margin:0!important}
  #relatorio{padding:20px!important;border-radius:0!important}
  div[style*="position: fixed"]{display:none!important}
  .recharts-wrapper{page-break-inside:avoid}
  table{page-break-inside:avoid}
}
`;
