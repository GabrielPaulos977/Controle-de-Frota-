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
  { id: "comando_muck", label: "Comando do Muck", color: "#ec4899" },
  { id: "pinos_soldas", label: "Pinos e Soldas", color: "#a16207" },
  { id: "motor", label: "Motor", color: "#dc2626" },
  { id: "lampadas_sinaleiras", label: "Lâmpadas/Sinaleiras/Refletores", color: "#fbbf24" },
  { id: "vidros_espelhos", label: "Vidros e Espelhos", color: "#7dd3fc" },
  { id: "suspensao", label: "Suspensão Diant./Tras.", color: "#a78bfa" },
  { id: "carroceria", label: "Carroceria", color: "#fb923c" },
  { id: "comando_guindaste", label: "Comando do Guindaste", color: "#f472b6" },
  { id: "guindaste", label: "Guindaste", color: "#2dd4bf" },
  { id: "pinos", label: "Pinos", color: "#b45309" },
  { id: "outros", label: "Outros", color: "#6b7280" },
];

const VEHICLE_TYPES = [
  { id: "caminhao", label: "Caminhão", icon: "🚛" },
  { id: "veiculo", label: "Veículo", icon: "🚗" },
];

const INITIAL_VEHICLES = {
  v1:  { placa: "IUI2G62", motorista: "POLIDRIL", tipo: "caminhao", marca: "IVECO", modelo: "EUROCARGO 260E25", ano: 2012 },
  v2:  { placa: "IYX1898", motorista: "SANDRO", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 170E22", ano: 2014 },
  v3:  { placa: "IYY6903", motorista: "CLEVERSSON", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723 B", ano: 2019 },
  v4:  { placa: "IWJ0804", motorista: "RESERVA 7742", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723 B", ano: 2019 },
  v5:  { placa: "IYX0594", motorista: "LV 6254", tipo: "caminhao", marca: "FORD", modelo: "CARGO 816 S", ano: 2019 },
  v6:  { placa: "JAD2E49", motorista: "LUCAS", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 170E28", ano: 2020 },
  v7:  { placa: "JAG0F42", motorista: "ELOI", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 170E28", ano: 2020 },
  v8:  { placa: "JBO2G50", motorista: "VANDERLEI", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 240E28", ano: 2022 },
  v9:  { placa: "IUL1160", motorista: "GILBERTO", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "24.280 CRM 6X2", ano: 2012 },
  v10: { placa: "JBO9B97", motorista: "WAGNER", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 240E28", ano: 2022 },
  v11: { placa: "TQS7A22", motorista: "ELEMAR", tipo: "caminhao", marca: "COSTELLATION", modelo: "", ano: 2025 },
  v12: { placa: "IZA6I12", motorista: "RESERVA 5502", tipo: "caminhao", marca: "FORD", modelo: "CARGO 1723 B", ano: 2019 },
  v13: { placa: "JBA2H75", motorista: "DARCI", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "17.260 CRM 4X2", ano: 2022 },
  v14: { placa: "IYX0585", motorista: "ALEXANDRE", tipo: "caminhao", marca: "FORD", modelo: "CARGO 816 S", ano: 2019 },
  v15: { placa: "JBG5J56", motorista: "JOSEMAR", tipo: "veiculo", marca: "FIAT", modelo: "STRADA ENDURANCE CS 1.4", ano: 2022 },
  v16: { placa: "IWI8H60", motorista: "CALÇADAS", tipo: "veiculo", marca: "FIAT", modelo: "STRADA WORKING", ano: 2015 },
  v17: { placa: "IZZ6A13", motorista: "JOSIAS", tipo: "caminhao", marca: "IVECO", modelo: "TECTOR 9-190", ano: 2020 },
  v18: { placa: "IVM3D85", motorista: "LUIZ", tipo: "veiculo", marca: "FIAT", modelo: "STRADA WORKING", ano: 2019 },
  v19: { placa: "JBG7D86", motorista: "JOÃO", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "17.260 CRM 4X2", ano: 2022 },
  v20: { placa: "JDL2G75", motorista: "PAULO", tipo: "caminhao", marca: "VOLKSWAGEN", modelo: "18.260 CRM 4X2", ano: 2025 },
  v21: { placa: "IZX8A52", motorista: "GABRIEL", tipo: "veiculo", marca: "VOLKSWAGEN", modelo: "GOL 1.6", ano: 2021 },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 8, marginBottom: 16 }}>
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
                <div style={{ fontSize: 11, opacity: 0.8 }}>{v.motorista}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Data e KM */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, alignItems: "end" }}>
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
function Dashboard({ vehicles, manutencoes, filterPeriod, filterCat, selectedVehicle }) {
  const stats = useMemo(() => {
    const filtered = manutencoes.filter((m) => {
      if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
      if (filterCat !== "todas" && m.categoria !== filterCat) return false;
      if (filterPeriod !== "todos") {
        const d = new Date(m.data), now = new Date();
        if (filterPeriod === "mes" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
        if (filterPeriod === "trimestre") { const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth(); if (diff > 2) return false; }
        if (filterPeriod === "ano" && d.getFullYear() !== now.getFullYear()) return false;
      }
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
    const byCategory = CATEGORIES.map((c) => ({ ...c, value: filtered.filter((m) => m.categoria === c.id).reduce((s, m) => s + m.valor, 0) })).filter((c) => c.value > 0);

    // mensal
    const mm = {};
    filtered.forEach((m) => { const d = new Date(m.data); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; mm[k] = (mm[k]||0) + m.valor; });
    const monthlyTrend = Object.entries(mm).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => ({ mes: MONTHS[parseInt(k.split("-")[1])-1]+"/"+k.split("-")[0].slice(2), valor: v }));

    // barras empilhadas top 8
    const catPerVehicle = ranking.slice(0, 8).map((v) => {
      const row = { name: v.placa, motorista: v.motorista };
      CATEGORIES.forEach((c) => { row[c.id] = v.cats[c.id] || 0; });
      return row;
    });

    return { filtered, totalGeral, count, ranking, byCategory, monthlyTrend, catPerVehicle, biggest: ranking[0] || null };
  }, [vehicles, manutencoes, filterPeriod, filterCat, selectedVehicle]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "CUSTO TOTAL", value: fmt(stats.totalGeral), sub: `${stats.count} serviços`, color: "#3b82f6", icon: "💰" },
          { label: "MÉDIA / VEÍCULO", value: fmt(vehicles.length ? stats.totalGeral / vehicles.length : 0), sub: `${vehicles.length} veículos`, color: "#f59e0b", icon: "📊" },
          { label: "MAIOR CUSTO", value: stats.biggest ? fmt(stats.biggest.total) : "—", sub: stats.biggest ? `${stats.biggest.placa} · ${stats.biggest.motorista}` : "", color: "#ef4444", icon: "🔺" },
          { label: "MÉDIA / SERVIÇO", value: fmt(stats.count ? stats.totalGeral / stats.count : 0), sub: "por manutenção", color: "#22c55e", icon: "🔧" },
        ].map((kpi, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 10, color: "var(--m)", letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>{kpi.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{kpi.value}</p>
                <p style={{ fontSize: 12, color: "var(--m)", marginTop: 4 }}>{kpi.sub}</p>
              </div>
              <span style={{ fontSize: 24, opacity: 0.5 }}>{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos linha + donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={secTitle}>Evolução Mensal</h3>
          {stats.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2432" />
                <XAxis dataKey="mes" tick={{ fill: "#6b7a90", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7a90", fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="valor" name="Custo" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>
        <div style={card}>
          <h3 style={secTitle}>Custos por Categoria</h3>
          {stats.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.byCategory} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {stats.byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#6b7a90", fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>
      </div>

      {/* Barras empilhadas */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={secTitle}>Composição de Custos por Veículo / Motorista</h3>
        {stats.catPerVehicle.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, stats.catPerVehicle.length * 44)}>
            <BarChart data={stats.catPerVehicle} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2432" />
              <XAxis type="number" tick={{ fill: "#6b7a90", fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={90}
                tick={({ x, y, payload }) => {
                  const item = stats.catPerVehicle.find(v => v.name === payload.value);
                  return (<g><text x={x} y={y-6} textAnchor="end" fill="#e8ecf4" fontSize={12} fontWeight={700}>{payload.value}</text>
                    <text x={x} y={y+8} textAnchor="end" fill="#6b7a90" fontSize={10}>{item?.motorista}</text></g>);
                }} />
              <Tooltip content={<ChartTip />} />
              {CATEGORIES.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} stackId="a" fill={c.color} />)}
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </div>

      {/* Ranking */}
      <div style={card}>
        <h3 style={secTitle}>Ranking — Veículo / Motorista</h3>
        {stats.ranking.map((v, i) => {
          const pct = stats.ranking[0]?.total ? (v.total / stats.ranking[0].total) * 100 : 0;
          const topCats = Object.entries(v.cats).sort(([,a],[,b]) => b - a).slice(0, 3).map(([id, val]) => ({ ...getCat(id), val }));
          return (
            <div key={v.id} style={{ padding: "12px 0", borderBottom: i < stats.ranking.length - 1 ? "1px solid var(--b)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, minWidth: 28, color: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : i === 2 ? "#f97316" : "var(--m)" }}>#{i+1}</span>
                  <span style={{ fontSize: 18 }}>{getIcon(v.tipo)}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{v.placa}</span>
                      <span style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>👤 {v.motorista}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--m)" }}>{[v.marca, v.modelo].filter(Boolean).join(" ")} · {v.ano} · {v.count} serv.</span>
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{fmt(v.total)}</span>
              </div>
              <div style={{ height: 5, background: "var(--b)", borderRadius: 3, marginLeft: 38, marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "linear-gradient(90deg,#ef4444,#f87171)" : "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 3, transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 38, flexWrap: "wrap" }}>
                {topCats.map((c) => (
                  <span key={c.id} style={{ fontSize: 10, background: c.color + "20", color: c.color, padding: "2px 10px", borderRadius: 12, fontWeight: 600 }}>
                    {c.label}: {fmt(c.val)}
                  </span>
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
// COMPONENTE: HISTÓRICO
// ============================================================
function Historico({ vehicles, manutencoes, filterPeriod, filterCat, selectedVehicle }) {
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = manutencoes.filter((m) => {
    if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
    if (filterCat !== "todas" && m.categoria !== filterCat) return false;
    if (filterPeriod !== "todos") {
      const d = new Date(m.data), now = new Date();
      if (filterPeriod === "mes" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
      if (filterPeriod === "trimestre") { const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth(); if (diff > 2) return false; }
      if (filterPeriod === "ano" && d.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.data) - new Date(a.data));

  const total = filtered.reduce((s, m) => s + m.valor, 0);

  const handleDel = async (id) => {
    if (confirmDel === id) { await remove(ref(db, `manutencoes/${id}`)); setConfirmDel(null); }
    else { setConfirmDel(id); setTimeout(() => setConfirmDel(null), 3000); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={titleStyle}>Histórico</h2>
        <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>Total: {fmt(total)} ({filtered.length})</span>
      </div>
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--b)" }}>
              {["Data","Placa","Motorista","Categoria","Descrição","KM","Valor",""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: "var(--m)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const v = vehicles.find((x) => x.id === m.veiculoId);
              const cat = getCat(m.categoria);
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid #111520" }}>
                  <td style={td}>{new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{m.placa || v?.placa || "—"}</td>
                  <td style={{ ...td, color: "#60a5fa", fontSize: 12 }}>{m.motorista || v?.motorista || "—"}</td>
                  <td style={td}><span style={{ background: cat.color + "20", color: cat.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{cat.label}</span></td>
                  <td style={td}>{m.descricao || "—"}</td>
                  <td style={{ ...td, color: "var(--m)", fontVariantNumeric: "tabular-nums" }}>{m.km ? m.km.toLocaleString("pt-BR") : "—"}</td>
                  <td style={{ ...td, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{fmt(m.valor)}</td>
                  <td style={td}>
                    <button onClick={() => handleDel(m.id)} style={{
                      background: confirmDel === m.id ? "#ef4444" : "transparent",
                      color: confirmDel === m.id ? "#fff" : "#ef4444",
                      border: "1px solid #ef444440", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    }}>{confirmDel === m.id ? "Confirmar" : "Excluir"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty />}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: VEÍCULOS
// ============================================================
function Veiculos({ vehicles, manutencoes }) {
  const [form, setForm] = useState({ placa: "", tipo: "caminhao", marca: "", modelo: "", ano: new Date().getFullYear(), motorista: "" });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const show = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const handleAdd = async () => {
    if (!form.placa) return show("Preencha a placa");
    await push(ref(db, "veiculos"), { placa: form.placa.toUpperCase(), tipo: form.tipo, marca: form.marca.toUpperCase(), modelo: form.modelo.toUpperCase(), ano: parseInt(form.ano), motorista: form.motorista.toUpperCase() });
    setForm({ placa: "", tipo: "caminhao", marca: "", modelo: "", ano: new Date().getFullYear(), motorista: "" });
    show("Veículo adicionado!");
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await update(ref(db, `veiculos/${editing.id}`), { placa: editing.placa.toUpperCase(), tipo: editing.tipo, marca: (editing.marca||"").toUpperCase(), modelo: (editing.modelo||"").toUpperCase(), ano: parseInt(editing.ano), motorista: (editing.motorista||"").toUpperCase() });
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input placeholder="Placa" value={form.placa} onChange={(e) => setForm({...form, placa: e.target.value})} style={inp} />
          <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} style={inp}>
            {VEHICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
          <input placeholder="Marca" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} style={inp} />
          <input placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} style={inp} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1.4fr auto", gap: 10 }}>
          <input type="number" placeholder="Ano" value={form.ano} onChange={(e) => setForm({...form, ano: e.target.value})} style={inp} />
          <input placeholder="Motorista" value={form.motorista} onChange={(e) => setForm({...form, motorista: e.target.value})} style={inp} />
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
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleUpdate} style={{ ...btnP, flex: 1 }}>Salvar</button>
              <button onClick={() => setEditing(null)} style={{ ...btnP, background: "var(--b)" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de veículos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
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
  { id: "veiculos", label: "Veículos", icon: "🚛" },
];

export default function App() {
  const [tab, setTab] = useState("painel");
  const [filterPeriod, setFilterPeriod] = useState("ano");
  const [filterCat, setFilterCat] = useState("todas");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
      {(tab === "painel" || tab === "historico") && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 16px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={selectedVehicle || ""} onChange={(e) => setSelectedVehicle(e.target.value || null)} style={sel}>
            <option value="">Todos os veículos</option>
            {[...vehicles].sort((a,b)=>a.placa.localeCompare(b.placa)).map((v) => <option key={v.id} value={v.id}>{v.placa} · {v.motorista}</option>)}
          </select>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={sel}>
            <option value="todos">Todo período</option><option value="mes">Este mês</option><option value="trimestre">Último trimestre</option><option value="ano">Este ano</option>
          </select>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={sel}>
            <option value="todas">Todas categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}

      {/* Conteúdo */}
      <main style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--m)" }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Carregando...</div>
        ) : (
          <>
            {tab === "painel" && <Dashboard vehicles={vehicles} manutencoes={manutencoes} filterPeriod={filterPeriod} filterCat={filterCat} selectedVehicle={selectedVehicle} />}
            {tab === "lancamento" && <QuickEntry vehicles={vehicles} />}
            {tab === "historico" && <Historico vehicles={vehicles} manutencoes={manutencoes} filterPeriod={filterPeriod} filterCat={filterCat} selectedVehicle={selectedVehicle} />}
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
@media(max-width:640px){.hm{display:none}}
.recharts-default-tooltip{background:var(--c)!important;border:1px solid var(--b)!important;border-radius:8px!important}
`;
