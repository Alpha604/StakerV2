import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis,
  LabelList, ReferenceLine, Brush
} from "recharts";
import { 
  Plus, Trash2, Download, FileSpreadsheet, Maximize, Minimize, 
  Upload, ClipboardPaste, Table, Activity, Save, LayoutTemplate,
  SlidersHorizontal, LayoutDashboard, TrendingUp, Database
} from "lucide-react";
import toast from "react-hot-toast";
import { AgGridReact, AgGridProvider } from "ag-grid-react";
import { AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const agGridModules = [AllCommunityModule];

type ChartType = "bar" | "line" | "area" | "composed" | "radar" | "pie" | "scatter";

interface DataSeries {
  id: string;
  key: string;
  name: string;
  color: string;
  chartType: "bar" | "line" | "area"; 
}

interface DataPoint {
  id: string;
  name: string; 
  [key: string]: any; 
}

interface RefLine {
  id: string;
  value: number;
  label: string;
  color: string;
  strokeDasharray: string;
}

interface ChartSettings {
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  stacked: boolean;
  curvedLines: boolean;
  showLabels: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  enableBrush: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export const ChartCreator = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [series, setSeries] = useState<DataSeries[]>([
    { id: "s1", key: "v1", name: "Rendement A", color: COLORS[0], chartType: "bar" },
    { id: "s2", key: "v2", name: "Objectif B", color: COLORS[1], chartType: "line" }
  ]);
  
  const [data, setData] = useState<DataPoint[]>([
    { id: "1", name: "Q1", v1: 4500, v2: 4000 },
    { id: "2", name: "Q2", v1: 3800, v2: 4200 },
    { id: "3", name: "Q3", v1: 5200, v2: 4500 },
    { id: "4", name: "Q4", v1: 6100, v2: 4800 },
    { id: "5", name: "Q1+1", v1: 5900, v2: 5000 },
  ]);

  const [refLines, setRefLines] = useState<RefLine[]>([]);
  const [chartType, setChartType] = useState<ChartType>("composed");
  const [chartTitle, setChartTitle] = useState("Analyse Performance Industrielle");
  
  const [settings, setSettings] = useState<ChartSettings>({
    showGrid: true, showLegend: true, showTooltip: true, stacked: false,
    curvedLines: true, showLabels: false, backgroundColor: "#000000",
    textColor: "#9ca3af", fontSize: 12, enableBrush: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    const pastedText = clipboardData.getData('text');
    if (pastedText) pasteData(pastedText);
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [handleGlobalPaste]);

  const pasteData = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) {
       toast.error("Format non reconnu ou insuffisant.");
       return;
    }
    const delim = lines[0].includes("\t") ? "\t" : (lines[0].includes(";") ? ";" : ",");
    const grid = lines.map(l => l.split(delim));
    
    const headers = grid[0];
    const newSeries: DataSeries[] = headers.slice(1).map((h, i) => ({
      id: `s_import_${Date.now()}_${i}`, key: `val_${i}`,
      name: h.replace(/"/g, '').trim() || `Série ${i+1}`,
      color: COLORS[i % COLORS.length], chartType: "bar"
    }));
    
    const newData: DataPoint[] = grid.slice(1).map((row, rIdx) => {
      const obj: any = { id: `r_import_${Date.now()}_${rIdx}`, name: row[0]?.replace(/"/g, '').trim() || `Ligne ${rIdx}` };
      newSeries.forEach((s, sIdx) => {
         const valStr = row[sIdx + 1]?.replace(/,/g, '.') || "0";
         const val = parseFloat(valStr.replace(/\s/g, '')); // remove spaces (french thousands)
         obj[s.key] = isNaN(val) ? 0 : val;
      });
      return obj;
    });
    
    setSeries(newSeries); setData(newData);
    toast.success("Structure importée depuis le presse-papiers !");
  };

  const addDataPoint = () => {
    const newPoint: DataPoint = { id: Date.now().toString(), name: `Cat ${data.length + 1}` };
    series.forEach(s => newPoint[s.key] = 0);
    setData([...data, newPoint]);
  };
  const updateDataPoint = (id: string, field: string, value: string | number) => {
    setData(data.map(d => d.id === id ? { ...d, [field]: field === "name" ? value : Number(value) } : d));
  };
  const removeDataPoint = (id: string) => setData(data.filter(d => d.id !== id));

  const addSeries = () => {
    if (series.length >= 10) return toast.error("Maximum 10 séries.");
    const newKey = `val_${Date.now()}`;
    const newColor = COLORS[series.length % COLORS.length];
    setSeries([...series, { id: Date.now().toString(), key: newKey, name: `New Series`, color: newColor, chartType: "bar" }]);
    setData(data.map(d => ({ ...d, [newKey]: 0 })));
  };
  const updateSeries = (id: string, updates: Partial<DataSeries>) => setSeries(series.map(s => s.id === id ? { ...s, ...updates } : s));
  const removeSeries = (id: string) => {
    if (series.length <= 1) return toast.error("Une série minimum requise.");
    const sToRemove = series.find(s => s.id === id);
    setSeries(series.filter(s => s.id !== id));
    if (sToRemove) setData(data.map(d => { const n = {...d}; delete n[sToRemove.key]; return n; }));
  };

  const addRefLine = () => setRefLines([...refLines, { id: Date.now().toString(), value: 1000, label: "Cible", color: "#ef4444", strokeDasharray: "3 3" }]);
  const updateRefLine = (id: string, updates: Partial<RefLine>) => setRefLines(refLines.map(r => r.id === id ? { ...r, ...updates } : r));
  const removeRefLine = (id: string) => setRefLines(refLines.filter(r => r.id !== id));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ title: chartTitle, type: chartType, series, data, settings, refLines }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `nexus_export_${Date.now()}.json`; a.click();
  };

  const exportCSV = () => {
    let csv = "X-Axis"; series.forEach(s => csv += `;${s.name}`); csv += "\n";
    data.forEach(d => { csv += `"${d.name}"`; series.forEach(s => csv += `;${d[s.key] || 0}`); csv += "\n"; });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `nexus_data.csv`; a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && parsed.series) {
          setData(parsed.data); setSeries(parsed.series);
          if (parsed.type) setChartType(parsed.type);
          if (parsed.title) setChartTitle(parsed.title);
          if (parsed.settings) setSettings({ ...settings, ...parsed.settings });
          if (parsed.refLines) setRefLines(parsed.refLines);
          toast.success("Projet chargé avec succès !");
        } else toast.error("Format invalide.");
      } catch (err) { toast.error("Erreur de parsing."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const TopButton = ({ icon, label, onClick, highlight = false, title }: any) => (
    <button onClick={onClick} title={title} className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${highlight ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
       {icon} <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );

  const renderRefLines = () => refLines.map(ref => (
     <ReferenceLine key={ref.id} y={ref.value} stroke={ref.color} strokeDasharray={ref.strokeDasharray} label={{ position: 'top', value: ref.label, fill: ref.color, fontSize: settings.fontSize - 2, fontWeight: 'bold' }} />
  ));

  const renderChart = () => {
    const margin = { top: 30, right: 30, left: 20, bottom: settings.enableBrush ? 30 : 20 };
    const customTooltip = settings.showTooltip ? (
      <Tooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: '#27272a', color: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} itemStyle={{ fontWeight: 'bold' }} />
    ) : null;
    const customLegend = settings.showLegend ? <Legend wrapperStyle={{ paddingTop: '10px' }} /> : null;
    const customGrid = settings.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.6} /> : null;
    const brush = settings.enableBrush ? <Brush dataKey="name" height={20} stroke="#3b82f6" fill="#09090b" tickFormatter={() => ""} /> : null;

    const tickProps = { fill: settings.textColor, fontSize: settings.fontSize };
    const labelProps = { position: "top" as any, fill: settings.textColor, fontSize: settings.fontSize - 2, fontWeight: "bold" };
    const lineType = settings.curvedLines ? "monotone" : "linear";

    if (data.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm uppercase">Absence de Data</div>;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={margin}>
              {customGrid} <XAxis dataKey="name" stroke="#52525b" tick={tickProps} /> <YAxis stroke="#52525b" tick={tickProps} />
              {customTooltip} {customLegend} {renderRefLines()} {brush}
              {series.map(s => (
                <Bar key={s.id} dataKey={s.key} name={s.name} fill={s.color} radius={settings.stacked ? [0,0,0,0] : [2,2,0,0]} stackId={settings.stacked ? "1" : undefined} animationDuration={800}>
                  {settings.showLabels && <LabelList dataKey={s.key} {...labelProps} />}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={margin}>
              {customGrid} <XAxis dataKey="name" stroke="#52525b" tick={tickProps} /> <YAxis stroke="#52525b" tick={tickProps} />
              {customTooltip} {customLegend} {renderRefLines()} {brush}
              {series.map(s => (
                <Line key={s.id} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 3, fill: '#09090b', strokeWidth: 2, stroke: s.color }} activeDot={{ r: 5 }} animationDuration={800}>
                   {settings.showLabels && <LabelList dataKey={s.key} {...labelProps} />}
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={margin}>
              <defs>
                {series.map(s => (
                  <linearGradient key={`grad-${s.id}`} id={`color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.0}/>
                  </linearGradient>
                ))}
              </defs>
              {customGrid} <XAxis dataKey="name" stroke="#52525b" tick={tickProps} /> <YAxis stroke="#52525b" tick={tickProps} />
              {customTooltip} {customLegend} {renderRefLines()} {brush}
              {series.map(s => (
                <Area key={s.id} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${s.id})`} stackId={settings.stacked ? "1" : undefined} animationDuration={800}>
                   {settings.showLabels && <LabelList dataKey={s.key} {...labelProps} />}
                </Area>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case "composed":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={margin}>
              {customGrid} <XAxis dataKey="name" stroke="#52525b" tick={tickProps} /> <YAxis stroke="#52525b" tick={tickProps} />
              {customTooltip} {customLegend} {renderRefLines()} {brush}
              {series.map((s) => {
                if (s.chartType === "area") return <Area key={s.id} type={lineType} dataKey={s.key} name={s.name} fill={s.color} stroke={s.color} fillOpacity={0.2} animationDuration={800} />;
                if (s.chartType === "line") return <Line key={s.id} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} animationDuration={800} />;
                return <Bar key={s.id} dataKey={s.key} name={s.name} fill={s.color} radius={[2,2,0,0]} animationDuration={800} />;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );
      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
             <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
               <PolarGrid stroke="#27272a" />
               <PolarAngleAxis dataKey="name" tick={tickProps} />
               <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fill: '#52525b', fontSize: settings.fontSize-2}} />
               {customTooltip} {customLegend}
               {series.map(s => <Radar key={s.id} name={s.name} dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.4} animationDuration={800} />)}
             </RadarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {customTooltip} {customLegend}
              <Pie
                data={data} cx="50%" cy="50%" labelLine={settings.showLabels} innerRadius={settings.stacked ? "50%" : 0} outerRadius="80%"
                fill="#8884d8" dataKey={series[0]?.key || ""} nameKey="name" stroke="#000" strokeWidth={2}
                label={settings.showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
                animationDuration={800}
              >
                {data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={margin}>
              {customGrid} <XAxis dataKey="name" type="category" stroke="#52525b" tick={tickProps} /> <YAxis dataKey={series[0]?.key} type="number" stroke="#52525b" tick={tickProps} />
              {series.length > 1 && <ZAxis dataKey={series[1]?.key} type="number" range={[20, 200]} />}
              {customTooltip} {customLegend} {renderRefLines()}
              {series.map(s => <Scatter key={s.id} name={s.name} data={data} fill={s.color} animationDuration={800} />)}
            </ScatterChart>
          </ResponsiveContainer>
        );
    }
  };

  const wrapperClass = isFullscreen 
     ? "fixed inset-0 z-[200] bg-[#050505] flex flex-col w-full h-full font-sans text-gray-300"
     : "flex-1 flex flex-col h-[90vh] min-h-[700px] w-full bg-[#050505] text-gray-300 font-sans border border-gray-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in transition-all my-2 mx-auto max-w-[1600px]";

  return (
    <div className={wrapperClass}>
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
      
      {/* Global Toast hint */}
      {data.length === 0 && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-[10px] shadow-xl animate-bounce">Utilisez Ctrl+V pour importer depuis Excel</div>}

      {/* Ribbon Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#09090b] border-b border-gray-800 select-none">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white font-black tracking-widest uppercase text-sm select-none">
               <Activity className="text-blue-500" size={18}/> <span className="hidden sm:inline">Nexus Studio</span>
            </div>
            <div className="h-4 w-px bg-gray-800"></div>
            <div className="flex gap-1">
               <TopButton icon={<Upload size={16}/>} label="Importer" onClick={() => fileInputRef.current?.click()} title="Importer un projet JSON" />
               <TopButton icon={<ClipboardPaste size={16}/>} label="Coller" onClick={() => toast.success("Raccourci: Utilisez Ctrl+V sur n'importe où pour coller.")} title="Indication de collage Excel" />
               <TopButton icon={<Save size={16}/>} label="Save" onClick={exportJSON} highlight title="Télécharger le modèle complet JSON" />
            </div>
         </div>
         <div className="flex items-center gap-1">
            <TopButton icon={<Download size={16}/>} label="Export JSON" onClick={exportJSON} />
            <TopButton icon={<FileSpreadsheet size={16}/>} label="Export CSV" onClick={exportCSV} />
            <div className="h-4 w-px bg-gray-800 mx-1"></div>
            <TopButton icon={isFullscreen ? <Minimize size={16}/> : <Maximize size={16}/>} label={isFullscreen ? "Réduire" : "Plein Écran"} onClick={() => setIsFullscreen(!isFullscreen)} />
         </div>
      </div>

      {/* Main Workspace Splitter */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
         
         {/* Left Properties Panel */}
         <div className="w-full md:w-72 flex flex-col bg-[#09090b] border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto custom-scrollbar shrink-0">
            
            {/* Meta Section */}
            <div className="p-4 border-b border-gray-800">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2"><LayoutTemplate size={12}/> Métadonnées</h4>
               <input 
                  type="text" value={chartTitle} onChange={e => setChartTitle(e.target.value)}
                  className="w-full bg-[#18181b] border border-gray-800 focus:border-blue-500 outline-none rounded p-2 text-sm text-white font-bold transition-colors"
                  placeholder="Titre de l'analyse..."
               />
            </div>

            {/* Type Section */}
            <div className="p-4 border-b border-gray-800">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2"><LayoutDashboard size={12}/> Topologie Visuelle</h4>
               <div className="grid grid-cols-2 gap-2">
                  {[
                     {id:"bar", n:"Barres"}, {id:"line", n:"Lignes"}, {id:"area", n:"Aires"}, {id:"pie", n:"Secteurs"},
                     {id:"composed", n:"Mixte"}, {id:"radar", n:"Radar"}, {id:"scatter", n:"Nuage"}
                  ].map(t => (
                     <button key={t.id} onClick={() => setChartType(t.id as ChartType)} className={`py-1.5 px-2 rounded border text-xs font-bold transition-all uppercase tracking-wider ${chartType === t.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#18181b] border-gray-800 text-gray-500 hover:text-gray-300'}`}>
                        {t.n}
                     </button>
                  ))}
               </div>
            </div>

            {/* Settings Section */}
            <div className="p-4 border-b border-gray-800">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2"><SlidersHorizontal size={12}/> Attributs de Rendu</h4>
               <div className="space-y-3">
                  <div className="flex gap-2">
                     <div className="flex-1">
                        <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Fond</label>
                        <input type="color" value={settings.backgroundColor} onChange={e=>setSettings({...settings, backgroundColor: e.target.value})} className="w-full h-6 rounded border-0 p-0 cursor-pointer bg-transparent" />
                     </div>
                     <div className="flex-1">
                        <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Texte</label>
                        <input type="color" value={settings.textColor} onChange={e=>setSettings({...settings, textColor: e.target.value})} className="w-full h-6 rounded border-0 p-0 cursor-pointer bg-transparent" />
                     </div>
                  </div>
                  
                  {[
                     { id: 'showGrid', label: 'Matrice de fond (Grid)' },
                     { id: 'showLegend', label: 'Légendes' },
                     { id: 'showTooltip', label: 'Valeurs au survol (Tooltip)' },
                     { id: 'showLabels', label: 'Étiquettes intégrées' },
                     { id: 'stacked', label: 'Mode Empilé / Donut' },
                     { id: 'curvedLines', label: 'Lissage (Spline/Monotone)' },
                     { id: 'enableBrush', label: 'Timeline de Zoom (Brush)' },
                  ].map(toggle => (
                     <label key={toggle.id} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">{toggle.label}</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${(settings as any)[toggle.id] ? 'bg-blue-600' : 'bg-gray-800'}`}>
                           <div className={`w-3 h-3 rounded-full bg-white transition-transform ${(settings as any)[toggle.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={(settings as any)[toggle.id]} onChange={e => setSettings({...settings, [toggle.id]: e.target.checked})} className="hidden" />
                     </label>
                  ))}
               </div>
            </div>

            {/* Reference Lines Section */}
            <div className="p-4 border-b border-gray-800">
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><TrendingUp size={12}/> Seuils & Cibles (Y)</h4>
                  <button onClick={addRefLine} className="text-gray-500 hover:text-white"><Plus size={14}/></button>
               </div>
               <div className="space-y-2">
                  {refLines.map(ref => (
                     <div key={ref.id} className="p-2 border border-gray-800 rounded bg-[#18181b] flex flex-col gap-2">
                        <div className="flex gap-2">
                           <input value={ref.label} onChange={e=>updateRefLine(ref.id, {label: e.target.value})} className="flex-1 bg-[#27272a] outline-none px-2 py-1 text-[11px] text-white rounded font-bold" placeholder="Label"/>
                           <input type="color" value={ref.color} onChange={e=>updateRefLine(ref.id, {color: e.target.value})} className="w-6 h-6 rounded border-0 p-0 bg-transparent shrink-0 cursor-pointer"/>
                           <button onClick={()=>removeRefLine(ref.id)} className="text-red-500/70 hover:text-red-500 px-1"><Trash2 size={12}/></button>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-gray-600 w-12">Valeur Y</span>
                           <input type="number" value={ref.value} onChange={e=>updateRefLine(ref.id, {value: parseFloat(e.target.value)||0})} className="flex-1 bg-[#27272a] outline-none px-2 py-1 text-[11px] font-mono text-blue-300 rounded"/>
                        </div>
                     </div>
                  ))}
                  {refLines.length === 0 && <div className="text-[10px] text-gray-600 italic">Aucun seuil défini.</div>}
               </div>
            </div>

         </div>

         {/* Center Workspace (Canvas + Spreadsheet) */}
         <div className="flex-1 flex flex-col min-w-0 bg-[#000]">
            
            {/* Chart Area */}
            <div className="flex-[3] relative p-4 lg:p-8 overflow-hidden flex flex-col items-center justify-center border-b border-gray-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-[#000] to-[#000]">
               <div className="w-full h-full max-h-[800px] flex flex-col transition-colors duration-500 border shadow-2xl relative" style={{ backgroundColor: settings.backgroundColor, borderColor: settings.backgroundColor === '#000000' || settings.backgroundColor === 'transparent' ? '#18181b' : settings.backgroundColor, borderRadius: '16px' }}>
                  <div className="p-6 pb-2 text-center">
                     <h2 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: settings.textColor === "transparent" ? "#fff" : settings.textColor }}>{chartTitle || "..."}</h2>
                  </div>
                  <div className="flex-1 w-full min-h-[300px] p-2 lg:p-6 pt-0">
                     {renderChart()}
                  </div>
               </div>
            </div>

            {/* Spreadsheet Area (Industrial Grid) */}
            <div className="flex-[2] min-h-[200px] bg-[#09090b] flex flex-col relative z-20">
               <div className="bg-[#18181b] border-b border-gray-800 p-2 px-4 flex justify-between items-center z-30 sticky top-0 shadow-[0_4px_15px_rgba(0,0,0,0.5)] select-none">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Database size={14} className="text-blue-500"/> Matrice de Données (<span className="text-white">{data.length}x{series.length}</span>)</span>
                  <div className="text-[9px] uppercase font-bold text-gray-600 flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded">V</kbd> depuis Excel
                  </div>
               </div>
               
               <div className="flex-1 w-full relative z-10 ag-theme-alpine-dark" style={{ '--ag-background-color': '#050505', '--ag-header-background-color': '#18181b', '--ag-odd-row-background-color': '#09090b', '--ag-border-color': '#27272a' } as React.CSSProperties}>
                  <AgGridProvider modules={agGridModules}>
                     <AgGridReact
                        rowData={data}
                        columnDefs={[
                           { field: "name", headerName: "Axe Primaire (X)", editable: true, flex: 1, pinned: 'left' },
                           ...series.map(s => ({ 
                              field: s.key, 
                              headerName: s.name, 
                              editable: true, 
                              flex: 1,
                              valueSetter: (params: any) => {
                                if (params.newValue !== params.oldValue) {
                                  updateDataPoint(params.data.id, s.key, params.newValue);
                                  return true;
                                }
                                return false;
                              }
                           }))
                        ]}
                        defaultColDef={{ resizable: true, filter: true, sortable: true }}
                        onCellValueChanged={(e) => {
                           if (e.colDef.field === "name") {
                              updateDataPoint(e.data.id, "name", e.newValue);
                           }
                        }}
                        rowHeight={35}
                        headerHeight={40}
                     />
                  </AgGridProvider>
               </div>
               <div className="bg-[#09090b] border-t border-gray-800 p-2 flex justify-between">
                 <button onClick={addDataPoint} className="px-4 py-1.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white bg-[#18181b] border border-gray-800 rounded transition-colors">
                    <Plus size={14}/> Ajouter Ligne
                 </button>
                 <button onClick={addSeries} className="px-4 py-1.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white bg-[#18181b] border border-gray-800 rounded transition-colors">
                    <Plus size={14}/> Ajouter Colonne
                 </button>
               </div>
            </div>

         </div>
      </div>
      
      {/* System Footer Bar */}
      <div className="h-6 bg-[#000] border-t border-gray-900 flex items-center justify-between px-4 text-[9px] text-gray-600 font-mono tracking-widest uppercase select-none shrink-0">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> Engine Active</span>
            <span className="hidden sm:inline">DOM: {data.length * series.length} Nodes</span>
         </div>
         <div>
            Nexus V2.1.0  //  Data Studio Workspace
         </div>
      </div>

    </div>
  );
};
