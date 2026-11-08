import { useCallback, useEffect, useState } from "react";
import { Plus, Target, Pencil, Trash2, X, RefreshCw, CalendarDays, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v || 0));
const today = () => new Date().toISOString().slice(0, 10);
const inputClass = "w-full rounded-lg border border-[#343A36] bg-[#191D1A] px-3 py-2.5 text-sm text-[#F4F6F2] outline-none focus:border-[#C6F36B]";
const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";

function GoalModal({ goal, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: goal?.name || "", description: goal?.description || "",
    target_amount: goal?.target_amount ?? "", current_amount: goal?.current_amount ?? 0,
    target_date: goal?.target_date || ""
  });
  const [error, setError] = useState("");
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (form.name.trim().length < 2) return setError("Goal name must contain at least 2 characters.");
    if (!(Number(form.target_amount) > 0)) return setError("Enter a target amount greater than zero.");
    if (Number(form.current_amount) < 0 || Number(form.current_amount) > Number(form.target_amount)) return setError("Current savings must be between zero and the target amount.");
    try { await onSave({ name: form.name.trim(), description: form.description.trim() || null, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount), target_date: form.target_date || null }); }
    catch (err) { setError(err.response?.data?.detail || "Could not save this goal."); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl border border-[#343A36] bg-[#202521] p-6 shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-[#F4F6F2]">{goal ? "Edit savings goal" : "Create savings goal"}</h2><button type="button" onClick={onClose} className="text-[#A4ADA5]"><X/></button></div>
      <label className="block text-sm text-[#A4ADA5]">Goal name<input className={inputClass+" mt-2"} name="name" value={form.name} onChange={change} maxLength="100" required placeholder="Emergency fund"/></label>
      <label className="block text-sm text-[#A4ADA5]">Description <span className="text-[#737D75]">(optional)</span><textarea className={inputClass+" mt-2"} name="description" value={form.description} onChange={change} maxLength="500" rows="2" placeholder="What are you saving for?"/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-[#A4ADA5]">Target amount<input className={inputClass+" mt-2"} type="number" min="0.01" step="0.01" name="target_amount" value={form.target_amount} onChange={change} required/></label>
        <label className="text-sm text-[#A4ADA5]">Already saved<input className={inputClass+" mt-2"} type="number" min="0" step="0.01" name="current_amount" value={form.current_amount} onChange={change}/></label>
      </div>
      <label className="block text-sm text-[#A4ADA5]">Target date <span className="text-[#737D75]">(optional)</span><input className={inputClass+" mt-2"} type="date" min={today()} name="target_date" value={form.target_date} onChange={change}/></label>
      {error && <p className="rounded-lg bg-[#F07878]/10 p-3 text-sm text-[#F07878]">{typeof error === "string" ? error : "Please check the entered values."}</p>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btn+" border border-[#343A36] text-[#A4ADA5]"}>Cancel</button><button disabled={saving} className={btn+" bg-[#C6F36B] text-[#151A0D]"}>{saving ? "Saving..." : "Save goal"}</button></div>
    </form>
  </div>;
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [modal, setModal] = useState(null), [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  const fetchGoals = useCallback(async () => {
    setLoading(true); setError("");
    try { const r = await api.get("/savings-goals/"); setGoals(Array.isArray(r.data) ? r.data : []); }
    catch (e) { setError(e.response?.data?.detail || "Unable to load savings goals."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  const saveGoal = async (payload) => {
    setSaving(true);
    try { if (modal?.id) await api.put(`/savings-goals/${modal.id}`, payload); else await api.post("/savings-goals/", payload); setModal(null); setNotice("Savings goal saved."); await fetchGoals(); }
    finally { setSaving(false); }
  };
  const removeGoal = async (goal) => {
    if (!window.confirm(`Delete "${goal.name}"? This cannot be undone.`)) return;
    try { await api.delete(`/savings-goals/${goal.id}`); setNotice("Goal deleted."); await fetchGoals(); }
    catch (e) { setError(e.response?.data?.detail || "Could not delete this goal."); }
  };
  const totalTarget = goals.reduce((s,g)=>s+Number(g.target_amount||0),0);
  const totalSaved = goals.reduce((s,g)=>s+Number(g.current_amount||0),0);
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#A4ADA5]">Money management</p><h1 className="mt-1 text-2xl font-semibold text-[#F4F6F2] sm:text-3xl">Savings goals</h1><p className="mt-2 text-sm text-[#737D75]">Give your savings a purpose and track every milestone.</p></div><button onClick={()=>setModal({})} className={btn+" bg-[#C6F36B] text-[#151A0D] hover:bg-[#D3FF7A]"}><Plus size={17}/> New goal</button></div>
    {notice && <p className="rounded-lg border border-[#83C995]/30 bg-[#83C995]/10 p-3 text-sm text-[#83C995]">{notice}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      {[["Active goals",goals.length],["Total target",money(totalTarget)],["Total saved",money(totalSaved)]].map(([label,value])=><div key={label} className="rounded-xl border border-[#343A36] bg-[#202521] p-5"><p className="text-sm text-[#A4ADA5]">{label}</p><p className="mt-3 text-2xl font-semibold text-[#F4F6F2]">{value}</p></div>)}
    </div>
    {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-[#A4ADA5]"><RefreshCw className="animate-spin text-[#C6F36B]"/>Loading goals...</div> : error ? <div className="rounded-xl border border-[#F07878]/30 bg-[#202521] p-6 text-[#F07878]">{error}<button onClick={fetchGoals} className="ml-3 underline">Retry</button></div> : goals.length === 0 ? <div className="rounded-xl border border-dashed border-[#343A36] bg-[#202521] px-6 py-16 text-center"><Target size={34} className="mx-auto text-[#C6F36B]"/><h2 className="mt-4 font-semibold text-[#F4F6F2]">Start your first savings goal</h2><p className="mt-2 text-sm text-[#737D75]">Create a goal for an emergency fund, trip, purchase or anything important to you.</p><button onClick={()=>setModal({})} className={btn+" mt-5 bg-[#C6F36B] text-[#151A0D]"}><Plus size={16}/> Create goal</button></div> :
      <div className="grid gap-4 lg:grid-cols-2">{goals.map(g=>{const target=Number(g.target_amount||0), saved=Number(g.current_amount||0), pct=target>0?Math.min(saved/target*100,100):0; return <article key={g.id} className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="rounded-lg bg-[#C6F36B]/10 p-3 text-[#C6F36B]"><Target/></div><div className="min-w-0"><h2 className="font-semibold text-[#F4F6F2]">{g.name}</h2><p className="mt-1 text-sm text-[#737D75]">{g.description || "Savings goal"}</p></div></div><div className="flex gap-1"><button title="Edit" onClick={()=>setModal(g)} className="rounded-lg p-2 text-[#A4ADA5] hover:bg-[#343A36]"><Pencil size={16}/></button><button title="Delete" onClick={()=>removeGoal(g)} className="rounded-lg p-2 text-[#A4ADA5] hover:bg-[#F07878]/10 hover:text-[#F07878]"><Trash2 size={16}/></button></div></div>
        <div className="mt-6 flex items-end justify-between gap-3"><div><p className="text-xs text-[#737D75]">Saved so far</p><p className="mt-1 text-xl font-semibold text-[#F4F6F2]">{money(saved)}</p></div><p className="text-sm font-semibold text-[#C6F36B]">{pct.toFixed(1)}%</p></div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#343A36]"><div className="h-full rounded-full bg-[#C6F36B] transition-all" style={{width:`${pct}%`}}/></div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#A4ADA5]"><span>{money(Math.max(target-saved,0))} remaining</span><span className="flex items-center gap-1">{g.target_date ? <><CalendarDays size={13}/>Target {new Date(g.target_date+"T00:00:00").toLocaleDateString("en-IN")}</> : "No target date"}</span></div>
        {pct>=100 && <p className="mt-4 flex items-center gap-2 text-sm text-[#83C995]"><CheckCircle2 size={16}/> Goal achieved!</p>}
      </article>})}</div>}
    {modal && <GoalModal goal={modal.id?modal:null} onClose={()=>setModal(null)} onSave={saveGoal} saving={saving}/>}
  </div>;
}
