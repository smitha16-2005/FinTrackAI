import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet, Plus, Pencil, Trash2, CalendarDays, TrendingUp,
  CircleDollarSign, AlertCircle, RefreshCw, X, Check,
} from "lucide-react";
import api from "../lib/api";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Travel", "Groceries", "Personal Care", "Other"];
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatMoney = (value) => currency.format(Number(value) || 0);
const monthLabel = (year, month) => new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
  return error.message || "Something went wrong. Please try again.";
}

function BudgetModal({ budget, periodStart, onClose, onSave, saving }) {
  const [category, setCategory] = useState(budget?.category || "");
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const cleanCategory = category.trim();
    const numericAmount = Number(amount);
    if (cleanCategory.length < 2 || cleanCategory.length > 50) return setError("Category must contain between 2 and 50 characters.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Enter a valid amount greater than zero.");
    try {
      await onSave({ category: cleanCategory, amount: numericAmount.toFixed(2), period_start: budget?.period_start || periodStart });
    } catch (saveError) { setError(getErrorMessage(saveError)); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-2xl border border-[#343A36] bg-[#191D1A] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A4ADA5]">Money management</p><h2 className="mt-1 text-xl font-semibold text-[#F4F6F2]">{budget ? "Edit budget" : "Create a budget"}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#A4ADA5] hover:bg-[#272D29] hover:text-white" aria-label="Close dialog"><X size={19} /></button></div>
      <form onSubmit={submit} className="space-y-5">
        <div><label className="mb-2 block text-sm font-medium text-[#DCE2DB]">Category</label><select value={category} onChange={(event) => setCategory(event.target.value)} required className="w-full rounded-lg border border-[#343A36] bg-[#111312] px-3 py-3 text-sm text-[#F4F6F2] outline-none focus:border-[#C6F36B]"><option value="" disabled>Select a category</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}{budget && !CATEGORIES.includes(budget.category) && <option value={budget.category}>{budget.category}</option>}</select></div>
        <div><label className="mb-2 block text-sm font-medium text-[#DCE2DB]">Monthly limit (₹)</label><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 5000" required className="w-full rounded-lg border border-[#343A36] bg-[#111312] px-3 py-3 text-sm text-[#F4F6F2] outline-none placeholder:text-[#737D75] focus:border-[#C6F36B]" /></div>
        <div className="rounded-lg border border-[#343A36] bg-[#202521] px-3 py-3"><p className="text-xs text-[#A4ADA5]">Budget period</p><p className="mt-1 text-sm font-medium text-[#F4F6F2]">{new Date(`${budget?.period_start || periodStart}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p><p className="mt-1 text-xs text-[#737D75]">Budgets are created for the selected month.</p></div>
        {error && <div className="rounded-lg border border-[#F07878]/30 bg-[#F07878]/10 px-3 py-2 text-sm text-[#F5A0A0]">{error}</div>}
        <div className="flex gap-3 pt-1"><button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#343A36] px-4 py-3 text-sm font-medium text-[#DCE2DB] hover:bg-[#272D29]">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#C6F36B] px-4 py-3 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A] disabled:opacity-60">{saving ? "Saving..." : budget ? "Save changes" : "Create budget"}</button></div>
      </form>
    </div>
  </div>;
}

function SummaryCard({ icon: Icon, label, value, detail, valueClass = "" }) {
  return <div className="rounded-xl border border-[#343A36] bg-[#191D1A] p-5"><div className="flex items-center justify-between"><p className="text-sm text-[#A4ADA5]">{label}</p><div className="rounded-lg border border-[#343A36] bg-[#202521] p-2 text-[#C6F36B]"><Icon size={17} /></div></div><p className={`mt-4 text-2xl font-semibold tracking-tight ${valueClass || "text-[#F4F6F2]"}`}>{value}</p><p className="mt-2 text-xs text-[#737D75]">{detail}</p></div>;
}

export default function Budgets() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalBudget, setModalBudget] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const periodStart = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const budgetResponse = await api.get("/budgets/", { params: { year: selectedYear, month: selectedMonth } });
      if (!Array.isArray(budgetResponse.data)) throw new Error("Unexpected budgets API response.");

      const allExpenses = [];
      const limit = 100;
      let offset = 0;
      while (true) {
        const response = await api.get("/expenses/", { params: { limit, offset } });
        if (!Array.isArray(response.data)) throw new Error("Unexpected expenses API response.");
        allExpenses.push(...response.data);
        if (response.data.length < limit) break;
        offset += limit;
      }
      setBudgets(budgetResponse.data);
      setExpenses(allExpenses);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const spendingByCategory = useMemo(() => {
    const totals = {};
    expenses.forEach((expense) => {
      const date = new Date(`${expense.expense_date}T00:00:00`);
      if (date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth) {
        const key = String(expense.category || "").trim().toLocaleLowerCase("en-IN");
        totals[key] = (totals[key] || 0) + Number(expense.amount);
      }
    });
    return totals;
  }, [expenses, selectedYear, selectedMonth]);

  const budgetRows = useMemo(() => budgets.map((budget) => {
    const key = String(budget.category || "").trim().toLocaleLowerCase("en-IN");
    const spent = spendingByCategory[key] || 0;
    const limit = Number(budget.amount);
    const remaining = limit - spent;
    return { ...budget, spent, remaining, percentage: limit > 0 ? spent / limit * 100 : 0, exceeded: spent > limit };
  }), [budgets, spendingByCategory]);

  const totals = useMemo(() => budgetRows.reduce((result, item) => {
    result.limit += Number(item.amount);
    result.spent += item.spent;
    result.remaining += item.remaining;
    return result;
  }, { limit: 0, spent: 0, remaining: 0 }), [budgetRows]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (modalBudget) {
        await api.put(`/budgets/${modalBudget.id}`, payload);
        setNotice("Budget updated successfully.");
      } else {
        await api.post("/budgets/", payload);
        setNotice("Budget created successfully.");
      }
      setShowModal(false);
      await fetchData();
    } finally { setSaving(false); }
  };

  const handleDelete = async (budget) => {
    if (!window.confirm(`Delete the ${budget.category} budget for ${monthLabel(selectedYear, selectedMonth)}?`)) return;
    setPageError(""); setNotice("");
    try {
      await api.delete(`/budgets/${budget.id}`);
      setNotice(`${budget.category} budget deleted.`);
      await fetchData();
    } catch (error) { setPageError(getErrorMessage(error)); }
  };

  const changeMonth = (value) => {
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    setSelectedYear(year); setSelectedMonth(month); setNotice("");
  };
  const monthValue = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  return <div className="min-h-full space-y-6 bg-[#111312] text-[#F4F6F2]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm text-[#A4ADA5]">Money management</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Budgets</h1><p className="mt-2 text-sm text-[#A4ADA5]">Set monthly limits and keep track of your spending.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-[#343A36] bg-[#191D1A] px-3 py-2.5 text-sm text-[#A4ADA5]"><CalendarDays size={16} /><input type="month" value={monthValue} onChange={(event) => changeMonth(event.target.value)} className="bg-transparent text-sm text-[#F4F6F2] outline-none [color-scheme:dark]" aria-label="Select budget month" /></label>
        <button type="button" onClick={() => { setModalBudget(null); setShowModal(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C6F36B] px-4 py-2.5 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A]"><Plus size={17} />Add budget</button>
      </div>
    </div>

    {pageError && <div className="flex items-start gap-3 rounded-xl border border-[#F07878]/30 bg-[#F07878]/10 p-4 text-sm text-[#F5A0A0]"><AlertCircle size={18} className="mt-0.5 shrink-0" /><div className="flex-1">{pageError}</div><button type="button" onClick={fetchData} className="inline-flex items-center gap-1 text-xs font-semibold hover:text-white"><RefreshCw size={13} />Retry</button></div>}
    {notice && !pageError && <div className="flex items-center gap-2 rounded-xl border border-[#83C995]/25 bg-[#83C995]/10 p-3 text-sm text-[#9DDBAD]"><Check size={16} />{notice}<button type="button" onClick={() => setNotice("")} className="ml-auto" aria-label="Dismiss message"><X size={16} /></button></div>}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={Wallet} label="Total budget" value={formatMoney(totals.limit)} detail={`${budgetRows.length} budget${budgetRows.length === 1 ? "" : "s"} in ${monthLabel(selectedYear, selectedMonth)}`} />
      <SummaryCard icon={TrendingUp} label="Total spent" value={formatMoney(totals.spent)} detail="Across the listed budget categories" />
      <SummaryCard icon={CircleDollarSign} label="Remaining" value={formatMoney(totals.remaining)} detail="Budget limit minus recorded spending" valueClass={totals.remaining < 0 ? "text-[#F07878]" : "text-[#C6F36B]"} />
      <SummaryCard icon={AlertCircle} label="Over budget" value={String(budgetRows.filter((item) => item.exceeded).length)} detail="Categories that passed their limit" />
    </div>

    <section className="overflow-hidden rounded-xl border border-[#343A36] bg-[#191D1A]">
      <div className="flex flex-col justify-between gap-2 border-b border-[#343A36] px-5 py-4 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-[#F4F6F2]">Category budgets</h2><p className="mt-1 text-xs text-[#A4ADA5]">{monthLabel(selectedYear, selectedMonth)}</p></div><button type="button" onClick={fetchData} className="inline-flex items-center gap-2 self-start rounded-lg border border-[#343A36] px-3 py-2 text-xs font-medium text-[#A4ADA5] hover:bg-[#272D29] hover:text-white sm:self-auto"><RefreshCw size={14} />Refresh</button></div>
      {loading ? <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-[#A4ADA5]"><RefreshCw size={17} className="animate-spin" />Loading budgets...</div> : budgetRows.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center"><div className="mb-4 rounded-2xl border border-[#343A36] bg-[#202521] p-4 text-[#C6F36B]"><Wallet size={26} /></div><h3 className="font-semibold text-[#F4F6F2]">No budgets for this month</h3><p className="mt-2 max-w-sm text-sm text-[#A4ADA5]">Create a category budget to set a spending limit for this month.</p><button type="button" onClick={() => { setModalBudget(null); setShowModal(true); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C6F36B] px-4 py-2.5 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A]"><Plus size={16} />Create your first budget</button></div> : <div className="divide-y divide-[#343A36]">
        {budgetRows.map((budget) => {
          const visualPercentage = Math.min(budget.percentage, 100);
          const barColor = budget.exceeded ? "bg-[#F07878]" : budget.percentage >= 80 ? "bg-[#E9BD70]" : "bg-[#C6F36B]";
          return <div key={budget.id} className="px-5 py-5 transition hover:bg-[#202521]/60">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3"><div className="rounded-xl border border-[#343A36] bg-[#202521] p-3 text-[#C6F36B]"><Wallet size={19} /></div><div className="min-w-0"><h3 className="truncate font-semibold text-[#F4F6F2]">{budget.category}</h3><p className="mt-1 text-xs text-[#737D75]">Monthly spending limit</p></div></div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:w-[58%]"><div><p className="text-xs text-[#737D75]">Spent</p><p className="mt-1 text-sm font-semibold text-[#F4F6F2]">{formatMoney(budget.spent)}</p></div><div><p className="text-xs text-[#737D75]">Budget</p><p className="mt-1 text-sm font-semibold text-[#F4F6F2]">{formatMoney(budget.amount)}</p></div><div className="col-span-2 sm:col-span-1"><p className="text-xs text-[#737D75]">{budget.exceeded ? "Over limit" : "Remaining"}</p><p className={`mt-1 text-sm font-semibold ${budget.exceeded ? "text-[#F07878]" : "text-[#83C995]"}`}>{formatMoney(Math.abs(budget.remaining))}</p></div></div>
              <div className="flex items-center gap-2 lg:w-28 lg:justify-end"><button type="button" onClick={() => { setModalBudget(budget); setShowModal(true); }} className="rounded-lg border border-[#343A36] p-2 text-[#A4ADA5] hover:border-[#C6F36B]/50 hover:text-[#C6F36B]" aria-label={`Edit ${budget.category} budget`}><Pencil size={16} /></button><button type="button" onClick={() => handleDelete(budget)} className="rounded-lg border border-[#343A36] p-2 text-[#A4ADA5] hover:border-[#F07878]/50 hover:text-[#F07878]" aria-label={`Delete ${budget.category} budget`}><Trash2 size={16} /></button></div>
            </div>
            <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-[#A4ADA5]">{budget.exceeded ? "Spending has exceeded this budget" : "Budget usage"}</span><span className={`font-semibold ${budget.exceeded ? "text-[#F07878]" : budget.percentage >= 80 ? "text-[#E9BD70]" : "text-[#C6F36B]"}`}>{budget.percentage.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#343A36]"><div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${visualPercentage}%` }} /></div></div>
          </div>;
        })}
      </div>}
    </section>
    <p className="text-xs leading-relaxed text-[#737D75]">Spending is calculated from all expenses returned by the expenses API and matched to budget categories without case sensitivity.</p>
    {showModal && <BudgetModal budget={modalBudget} periodStart={periodStart} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} />}
  </div>;
}
