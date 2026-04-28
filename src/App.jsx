import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "vaz_mangueiras", label: "Vazamento Mangueiras", color: "#2563eb" },
  { id: "vaz_tubos_cilindros", label: "Vazamento Tubos/Cilindros", color: "#dc2626" },
  { id: "freio", label: "Freio", color: "#f97316" },
  { id: "lubrificantes_filtros", label: "Troca Lubrificantes e Filtros", color: "#16a34a" },
  { id: "pneus", label: "Pneus", color: "#d97706" },
  { id: "funilaria", label: "Funilaria", color: "#7c3aed" },
  { id: "eletrica", label: "Elétrica", color: "#0891b2" },
  { id: "comando_muck", label: "Comando do Muck", color: "#e11d48" },
  { id: "pinos_soldas", label: "Pinos e Soldas", color: "#854d0e" },
  { id: "outros", label: "Outros", color: "#6b7280" },
];

const VEHICLE_TYPES = [
  { id: "caminhao", label: "Caminhão", icon: "🚛" },
  { id: "veiculo", label: "Veículo", icon: "🚗" },
];

const INITIAL_VEHICLES = [
  { id: 1, placa: "IUI2G62", motorista: "POLIDRIL", tipo: "caminhao", modelo: "EUROCARGO 260E25", marca: "IVECO", ano: 2012 },
  { id: 2, placa: "IYX1898", motorista: "SANDRO", tipo: "caminhao", modelo: "TECTOR 170E22", marca: "IVECO", ano: 2014 },
  { id: 3, placa: "IYY6903", motorista: "CLEVERSSON", tipo: "caminhao", modelo: "CARGO 1723 B", marca: "FORD", ano: 2019 },
  { id: 4, placa: "IWJ0804", motorista: "RESERVA 7742", tipo: "caminhao", modelo: "CARGO 1723 B", marca: "FORD", ano: 2019 },
  { id: 5, placa: "IYX0594", motorista: "LV 6254", tipo: "caminhao", modelo: "CARGO 816 S", marca: "FORD", ano: 2019 },
  { id: 6, placa: "JAD2E49", motorista: "LUCAS", tipo: "caminhao", modelo: "TECTOR 170E28", marca: "IVECO", ano: 2020 },
  { id: 7, placa: "JAG0F42", motorista: "ELOI", tipo: "caminhao", modelo: "TECTOR 170E28", marca: "IVECO", ano: 2020 },
  { id: 8, placa: "JBO2G50", motorista: "VANDERLEI", tipo: "caminhao", modelo: "TECTOR 240E28", marca: "IVECO", ano: 2022 },
  { id: 9, placa: "IUL1160", motorista: "GILBERTO", tipo: "caminhao", modelo: "24.280 CRM 6X2", marca: "VOLKSWAGEN", ano: 2012 },
  { id: 10, placa: "JBO9B97", motorista: "WAGNER", tipo: "caminhao", modelo: "TECTOR 240E28", marca: "IVECO", ano: 2022 },
  { id: 11, placa: "TQS7A22", motorista: "ELEMAR", tipo: "caminhao", modelo: "", marca: "COSTELLATION", ano: 2025 },
  { id: 12, placa: "IZA6I12", motorista: "RESERVA 5502", tipo: "caminhao", modelo: "CARGO 1723 B", marca: "FORD", ano: 2019 },
  { id: 13, placa: "JBA2H75", motorista: "DARCI", tipo: "caminhao", modelo: "17.260 CRM 4X2", marca: "VOLKSWAGEN", ano: 2022 },
  { id: 14, placa: "IYX0585", motorista: "ALEXANDRE", tipo: "caminhao", modelo: "CARGO 816 S", marca: "FORD", ano: 2019 },
  { id: 15, placa: "JBG5J56", motorista: "JOSEMAR", tipo: "veiculo", modelo: "STRADA ENDURANCE CS 1.4", marca: "FIAT", ano: 2022 },
  { id: 16, placa: "IWI8H60", motorista: "CALÇADAS", tipo: "veiculo", modelo: "STRADA WORKING", marca: "FIAT", ano: 2015 },
  { id: 17, placa: "IZZ6A13", motorista: "JOSIAS", tipo: "caminhao", modelo: "TECTOR 9-190", marca: "IVECO", ano: 2020 },
  { id: 18, placa: "IVM3D85", motorista: "LUIZ", tipo: "veiculo", modelo: "STRADA WORKING", marca: "FIAT", ano: 2019 },
  { id: 19, placa: "JBG7D86", motorista: "JOÃO", tipo: "caminhao", modelo: "17.260 CRM 4X2", marca: "VOLKSWAGEN", ano: 2022 },
  { id: 20, placa: "JDL2G75", motorista: "PAULO", tipo: "caminhao", modelo: "18.260 CRM 4X2", marca: "VOLKSWAGEN", ano: 2025 },
  { id: 21, placa: "IZX8A52", motorista: "GABRIEL", tipo: "veiculo", modelo: "GOL 1.6", marca: "VOLKSWAGEN", ano: 2021 },
];

const INITIAL_MANUTENCOES = [];

const formatCurrency = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const storageKey = (k) => `frota_${k}`;

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Mini bar chart
function MiniBar({ data, maxVal, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: maxVal ? Math.max(2, (v / maxVal) * 30) : 2,
            background: color,
            borderRadius: 2,
            opacity: 0.7 + (i / data.length) * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Donut chart
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (!total) return null;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -90;
  const paths = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const angle = (seg.value / total) * 360;
      const startRad = (cumAngle * Math.PI) / 180;
      const endRad = ((cumAngle + angle) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const large = angle > 180 ? 1 : 0;
      cumAngle += angle;
      return (
        <path
          key={seg.id}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
          fill={seg.color}
          opacity={0.85}
        />
      );
    });
  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--bg)" />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="var(--text)"
        fontSize={11}
        fontWeight={700}
      >
        {formatCurrency(total)}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize={9}
      >
        total
      </text>
    </svg>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState(() => loadData("vehicles", INITIAL_VEHICLES));
  const [manutencoes, setManutencoes] = useState(() => loadData("manutencoes", INITIAL_MANUTENCOES));
  const [view, setView] = useState("dashboard"); // dashboard | vehicles | novo | historico | editVehicle
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({
    veiculoId: "",
    data: new Date().toISOString().slice(0, 10),
    categoria: "lubrificantes_filtros",
    descricao: "",
    valor: "",
    km: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    placa: "",
    tipo: "caminhao",
    marca: "",
    modelo: "",
    ano: new Date().getFullYear(),
    motorista: "",
  });
  const [toast, setToast] = useState(null);
  const [filterCat, setFilterCat] = useState("todas");
  const [filterPeriod, setFilterPeriod] = useState("todos");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey("vehicles"), JSON.stringify(vehicles));
      localStorage.setItem(storageKey("manutencoes"), JSON.stringify(manutencoes));
    } catch {}
  }, [vehicles, manutencoes]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Filtered data
  const filteredManutencoes = manutencoes.filter((m) => {
    if (selectedVehicle && m.veiculoId !== selectedVehicle) return false;
    if (filterCat !== "todas" && m.categoria !== filterCat) return false;
    if (filterPeriod !== "todos") {
      const d = new Date(m.data);
      const now = new Date();
      if (filterPeriod === "mes") {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (filterPeriod === "trimestre") {
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diff > 2) return false;
      } else if (filterPeriod === "ano") {
        if (d.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const totalGeral = filteredManutencoes.reduce((s, m) => s + m.valor, 0);

  const custosPorCategoria = CATEGORIES.map((c) => ({
    ...c,
    value: filteredManutencoes.filter((m) => m.categoria === c.id).reduce((s, m) => s + m.valor, 0),
  }));

  const custosPorVeiculo = vehicles.map((v) => {
    const ms = filteredManutencoes.filter((m) => m.veiculoId === v.id);
    return { ...v, total: ms.reduce((s, m) => s + m.valor, 0), count: ms.length };
  }).sort((a, b) => b.total - a.total);

  // Monthly data for mini charts
  const monthlyByVehicle = (vid) => {
    const months = Array(12).fill(0);
    manutencoes
      .filter((m) => m.veiculoId === vid)
      .forEach((m) => {
        const mo = new Date(m.data).getMonth();
        months[mo] += m.valor;
      });
    return months;
  };

  const maxMonthly = Math.max(
    ...vehicles.map((v) => Math.max(...monthlyByVehicle(v.id)))
  );

  const handleSubmit = () => {
    if (!form.veiculoId || !form.descricao || !form.valor) {
      showToast("Preencha todos os campos obrigatórios");
      return;
    }
    const newM = {
      id: Date.now(),
      veiculoId: Number(form.veiculoId),
      data: form.data,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      km: form.km ? parseInt(form.km) : null,
    };
    setManutencoes([...manutencoes, newM]);
    setForm({
      veiculoId: "",
      data: new Date().toISOString().slice(0, 10),
      categoria: "lubrificantes_filtros",
      descricao: "",
      valor: "",
      km: "",
    });
    showToast("Manutenção registrada com sucesso!");
    setView("dashboard");
  };

  const handleAddVehicle = () => {
    if (!vehicleForm.placa) {
      showToast("Preencha a placa");
      return;
    }
    const newV = {
      id: Date.now(),
      placa: vehicleForm.placa.toUpperCase(),
      tipo: vehicleForm.tipo,
      marca: vehicleForm.marca.toUpperCase(),
      modelo: vehicleForm.modelo.toUpperCase(),
      ano: parseInt(vehicleForm.ano),
      motorista: vehicleForm.motorista.toUpperCase(),
    };
    setVehicles([...vehicles, newV]);
    setVehicleForm({ placa: "", tipo: "caminhao", marca: "", modelo: "", ano: new Date().getFullYear(), motorista: "" });
    showToast("Veículo adicionado!");
  };

  const handleUpdateVehicle = () => {
    if (!editingVehicle.placa || !editingVehicle.modelo) {
      showToast("Preencha placa e modelo");
      return;
    }
    setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...editingVehicle, placa: editingVehicle.placa.toUpperCase() } : v));
    showToast("Veículo atualizado!");
    setView("vehicles");
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = (id) => {
    if (!confirm("Tem certeza que deseja excluir este veículo e todas as suas manutenções?")) return;
    setVehicles(vehicles.filter(v => v.id !== id));
    setManutencoes(manutencoes.filter(m => m.veiculoId !== id));
    if (selectedVehicle === id) setSelectedVehicle(null);
    showToast("Veículo excluído!");
  };

  const handleDeleteManutencao = (id) => {
    if (!confirm("Excluir este registro de manutenção?")) return;
    setManutencoes(manutencoes.filter(m => m.id !== id));
    showToast("Registro excluído!");
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');
    :root {
      --bg: #0c0f14;
      --bg2: #141820;
      --bg3: #1a1f2b;
      --bg4: #222838;
      --border: #2a3040;
      --text: #e8ecf4;
      --text-muted: #7a8599;
      --accent: #3b82f6;
      --accent2: #60a5fa;
      --danger: #ef4444;
      --success: #22c55e;
      --warn: #f59e0b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
    input, select, textarea {
      background: var(--bg3);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
    }
    select { cursor: pointer; }
    .mono { font-family: 'Space Mono', monospace; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeIn 0.35s ease-out both; }
    .slide-up { animation: slideUp 0.4s ease-out both; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }
  `;

  const btnStyle = (variant = "primary") => ({
    background: variant === "primary" ? "var(--accent)" : variant === "danger" ? "var(--danger)" : "var(--bg4)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    opacity: 0.95,
  });

  const cardStyle = {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "var(--bg3)",
            border: "1px solid var(--success)",
            color: "var(--success)",
            padding: "12px 24px",
            borderRadius: 10,
            zIndex: 999,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          className="slide-up"
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <header
        style={{
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🔧
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
              Controle de Frota
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {vehicles.length} veículos · {manutencoes.length} manutenções
            </p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          {[
            { id: "dashboard", label: "Painel", icon: "📊" },
            { id: "novo", label: "Nova Manutenção", icon: "➕" },
            { id: "historico", label: "Histórico", icon: "📋" },
            { id: "vehicles", label: "Veículos", icon: "🚛" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                ...btnStyle("ghost"),
                background: view === item.id ? "var(--bg4)" : "transparent",
                color: view === item.id ? "var(--accent2)" : "var(--text-muted)",
                padding: "8px 14px",
                fontSize: 13,
                borderRadius: 8,
              }}
            >
              <span style={{ marginRight: 6 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* ===== DASHBOARD ===== */}
        {view === "dashboard" && (
          <div className="fade-in">
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                value={selectedVehicle || ""}
                onChange={(e) => setSelectedVehicle(e.target.value ? Number(e.target.value) : null)}
                style={{ width: "auto", minWidth: 180 }}
              >
                <option value="">Todos os veículos</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{ width: "auto", minWidth: 140 }}
              >
                <option value="todos">Todo período</option>
                <option value="mes">Este mês</option>
                <option value="trimestre">Último trimestre</option>
                <option value="ano">Este ano</option>
              </select>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ width: "auto", minWidth: 140 }}
              >
                <option value="todas">Todas categorias</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              {[
                {
                  label: "Custo Total",
                  value: formatCurrency(totalGeral),
                  sub: `${filteredManutencoes.length} serviços`,
                  color: "var(--accent)",
                },
                {
                  label: "Média por Veículo",
                  value: formatCurrency(
                    vehicles.length ? totalGeral / vehicles.length : 0
                  ),
                  sub: `${vehicles.length} veículos`,
                  color: "var(--warn)",
                },
                {
                  label: "Maior Custo",
                  value: custosPorVeiculo[0]
                    ? formatCurrency(custosPorVeiculo[0].total)
                    : "—",
                  sub: custosPorVeiculo[0]
                    ? `${custosPorVeiculo[0].placa}`
                    : "",
                  color: "var(--danger)",
                },
                {
                  label: "Custo Médio/Serviço",
                  value: formatCurrency(
                    filteredManutencoes.length
                      ? totalGeral / filteredManutencoes.length
                      : 0
                  ),
                  sub: "por manutenção",
                  color: "var(--success)",
                },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="slide-up"
                  style={{
                    ...cardStyle,
                    animationDelay: `${i * 0.08}s`,
                    borderLeft: `3px solid ${kpi.color}`,
                  }}
                >
                  <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {kpi.label}
                  </p>
                  <p className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {kpi.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Donut */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  Custos por Categoria
                </h3>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <DonutChart segments={custosPorCategoria} size={140} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {custosPorCategoria
                    .filter((c) => c.value > 0)
                    .map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: c.color,
                          }}
                        />
                        <span style={{ color: "var(--text-muted)" }}>{c.label}</span>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 11 }}>
                          {formatCurrency(c.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Ranking */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  Ranking de Custos por Veículo
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {custosPorVeiculo.slice(0, 6).map((v, i) => {
                    const pct = custosPorVeiculo[0]?.total
                      ? (v.total / custosPorVeiculo[0].total) * 100
                      : 0;
                    const tipo = VEHICLE_TYPES.find((t) => t.id === v.tipo);
                    return (
                      <div key={v.id} className="slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{tipo?.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              {v.placa}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {v.modelo}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <MiniBar
                              data={monthlyByVehicle(v.id).slice(0, new Date().getMonth() + 1)}
                              maxVal={maxMonthly}
                              color={i === 0 ? "var(--danger)" : "var(--accent)"}
                            />
                            <span
                              className="mono"
                              style={{ fontWeight: 700, fontSize: 13, minWidth: 100, textAlign: "right" }}
                            >
                              {formatCurrency(v.total)}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "var(--bg4)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background:
                                i === 0
                                  ? "linear-gradient(90deg, var(--danger), #f87171)"
                                  : "linear-gradient(90deg, var(--accent), var(--accent2))",
                              borderRadius: 2,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Últimas Manutenções
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Data", "Veículo", "Categoria", "Descrição", "KM", "Valor"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: 0.8,
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredManutencoes]
                      .sort((a, b) => new Date(b.data) - new Date(a.data))
                      .slice(0, 8)
                      .map((m) => {
                        const v = vehicles.find((v) => v.id === m.veiculoId);
                        const cat = CATEGORIES.find((c) => c.id === m.categoria);
                        return (
                          <tr
                            key={m.id}
                            style={{
                              borderBottom: "1px solid var(--bg4)",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "var(--bg3)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td className="mono" style={{ padding: "10px 12px", fontSize: 12 }}>
                              {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                              {v?.placa || "—"}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span
                                style={{
                                  background: cat?.color + "22",
                                  color: cat?.color,
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {cat?.label}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>{m.descricao}</td>
                            <td className="mono" style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 12 }}>
                              {m.km ? m.km.toLocaleString("pt-BR") : "—"}
                            </td>
                            <td className="mono" style={{ padding: "10px 12px", fontWeight: 700, color: "var(--warn)" }}>
                              {formatCurrency(m.valor)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOVA MANUTENÇÃO ===== */}
        {view === "novo" && (
          <div className="fade-in" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Registrar Manutenção
            </h2>
            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Veículo *
                </label>
                <select
                  value={form.veiculoId}
                  onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {VEHICLE_TYPES.find((t) => t.id === v.tipo)?.icon} {v.placa} — {v.marca} {v.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Categoria *
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Descrição do serviço *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de óleo e filtros"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Quilometragem
                  </label>
                  <input
                    type="number"
                    placeholder="KM atual"
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                style={{ ...btnStyle("primary"), marginTop: 8, width: "100%", padding: 14 }}
              >
                Registrar Manutenção
              </button>
            </div>
          </div>
        )}

        {/* ===== HISTÓRICO ===== */}
        {view === "historico" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Histórico Completo</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={selectedVehicle || ""}
                  onChange={(e) => setSelectedVehicle(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: "auto", minWidth: 180 }}
                >
                  <option value="">Todos os veículos</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</option>
                  ))}
                </select>
                <select
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                  style={{ width: "auto" }}
                >
                  <option value="todas">Todas categorias</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ ...cardStyle, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Data", "Veículo", "Categoria", "Descrição", "KM", "Valor", ""].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredManutencoes]
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((m) => {
                      const v = vehicles.find((v) => v.id === m.veiculoId);
                      const cat = CATEGORIES.find((c) => c.id === m.categoria);
                      return (
                        <tr key={m.id} style={{ borderBottom: "1px solid var(--bg4)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="mono" style={{ padding: "10px 12px", fontSize: 12 }}>
                            {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{v?.placa || "—"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: cat?.color + "22", color: cat?.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                              {cat?.label}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>{m.descricao}</td>
                          <td className="mono" style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 12 }}>
                            {m.km ? m.km.toLocaleString("pt-BR") : "—"}
                          </td>
                          <td className="mono" style={{ padding: "10px 12px", fontWeight: 700, color: "var(--warn)" }}>
                            {formatCurrency(m.valor)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              onClick={() => handleDeleteManutencao(m.id)}
                              style={{ ...btnStyle("danger"), padding: "4px 10px", fontSize: 11 }}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {filteredManutencoes.length === 0 && (
                <p style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  Nenhum registro encontrado com os filtros selecionados.
                </p>
              )}
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                Total filtrado: {formatCurrency(totalGeral)}
              </span>
            </div>
          </div>
        )}

        {/* ===== VEÍCULOS ===== */}
        {view === "vehicles" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Gerenciar Veículos
            </h2>

            {/* Add form */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Adicionar Veículo
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Placa</label>
                  <input
                    placeholder="ABC1D23"
                    value={vehicleForm.placa}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, placa: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Tipo</label>
                  <select
                    value={vehicleForm.tipo}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, tipo: e.target.value })}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Marca</label>
                  <input
                    placeholder="Ex: IVECO"
                    value={vehicleForm.marca}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, marca: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Modelo</label>
                  <input
                    placeholder="Ex: TECTOR 170E28"
                    value={vehicleForm.modelo}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, modelo: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.5fr auto", gap: 12, alignItems: "end", marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Ano</label>
                  <input
                    type="number"
                    value={vehicleForm.ano}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, ano: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Motorista</label>
                  <input
                    placeholder="Nome do motorista"
                    value={vehicleForm.motorista}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, motorista: e.target.value })}
                  />
                </div>
                <button onClick={handleAddVehicle} style={{ ...btnStyle("primary"), padding: "10px 20px" }}>
                  Adicionar
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {vehicles.map((v, i) => {
                const total = manutencoes
                  .filter((m) => m.veiculoId === v.id)
                  .reduce((s, m) => s + m.valor, 0);
                const count = manutencoes.filter((m) => m.veiculoId === v.id).length;
                const tipo = VEHICLE_TYPES.find((t) => t.id === v.tipo);
                return (
                  <div
                    key={v.id}
                    className="slide-up"
                    style={{ ...cardStyle, animationDelay: `${i * 0.05}s` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 28 }}>{tipo?.icon}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 16 }}>{v.placa}</p>
                          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            {[v.marca, v.modelo].filter(Boolean).join(" ")} · {v.ano}
                          </p>
                          {v.motorista && (
                            <p style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2 }}>
                              👤 {v.motorista}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setEditingVehicle({ ...v }); setView("editVehicle"); }}
                          style={{ ...btnStyle("ghost"), padding: "4px 10px", fontSize: 11 }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          style={{ ...btnStyle("danger"), padding: "4px 10px", fontSize: 11 }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                          Custo total
                        </p>
                        <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--warn)" }}>
                          {formatCurrency(total)}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {count} manutenções
                        </p>
                      </div>
                      <MiniBar
                        data={monthlyByVehicle(v.id).slice(0, new Date().getMonth() + 1)}
                        maxVal={maxMonthly}
                        color="var(--accent)"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== EDITAR VEÍCULO ===== */}
        {view === "editVehicle" && editingVehicle && (
          <div className="fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              Editar Veículo
            </h2>
            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Placa</label>
                <input
                  value={editingVehicle.placa}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, placa: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Tipo</label>
                <select
                  value={editingVehicle.tipo}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, tipo: e.target.value })}
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Marca</label>
                <input
                  value={editingVehicle.marca || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, marca: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Modelo</label>
                <input
                  value={editingVehicle.modelo}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, modelo: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Ano</label>
                <input
                  type="number"
                  value={editingVehicle.ano}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, ano: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Motorista</label>
                <input
                  value={editingVehicle.motorista || ""}
                  placeholder="Nome do motorista"
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, motorista: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleUpdateVehicle} style={{ ...btnStyle("primary"), flex: 1, padding: 14 }}>
                  Salvar Alterações
                </button>
                <button onClick={() => { setView("vehicles"); setEditingVehicle(null); }} style={{ ...btnStyle("ghost"), padding: 14 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
