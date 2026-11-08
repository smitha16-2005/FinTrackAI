import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target, ChartNoAxesCombined,
  Sparkles, Lightbulb, Settings, CircleHelp, Bell, Search, Menu, X,
  LogOut, ChevronDown, ArrowUpRight, ArrowDownRight, Plus, TrendingUp,
  CreditCard, RefreshCw,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import api from "./lib/api";
import Transactions from "./pages/Transactions.jsx";
import Budgets from "./pages/budgets.jsx";
import SavingsGoals from "./pages/SavingsGoals.jsx";
import Analytics from "./pages/Analytics.jsx";
import Assistant from "./pages/Assistant.jsx";
import Insights from "./pages/insights.jsx";
import SettingsPage from "./pages/Settings.jsx";
import HelpPage from "./pages/help.jsx";

const navigation = [
  { title: "OVERVIEW", items: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Analytics", icon: ChartNoAxesCombined },
  ]},
  { title: "MONEY MANAGEMENT", items: [
    { label: "Transactions", icon: ArrowLeftRight },
    { label: "Budgets", icon: Wallet },
    { label: "Savings goals", icon: Target },
  ]},
  { title: "INTELLIGENCE", items: [
    { label: "AI Assistant", icon: Sparkles },
    { label: "Insights", icon: Lightbulb },
  ]},
];

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatMonth = (year, month) => new Date(year, month - 1).toLocaleDateString(
  "en-IN", { month: "long", year: "numeric" }
);

function Sidebar({ activePage, setActivePage, onLogout, user, mobileOpen, setMobileOpen }) {
  const initials = user?.full_name?.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "U";
  const selectPage = (page) => { setActivePage(page); setMobileOpen(false); };

  return <>
    {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#343A36] bg-[#191D1A] transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[76px] items-center justify-between border-b border-[#343A36] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C6F36B]"><Wallet size={20} className="text-[#151A0D]" /></div>
          <span className="text-lg font-semibold tracking-tight text-[#F4F6F2]">FinTrack <span className="text-[#C6F36B]">AI</span></span>
        </div>
        <button type="button" onClick={() => setMobileOpen(false)} className="text-[#A4ADA5] hover:text-white lg:hidden" aria-label="Close sidebar"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {navigation.map((group) => <div key={group.title} className="mb-8">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-[#737D75]">{group.title}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return <button key={item.label} type="button" onClick={() => selectPage(item.label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${activePage === item.label ? "bg-[#C6F36B]/10 font-medium text-[#C6F36B]" : "text-[#A4ADA5] hover:bg-[#272D29] hover:text-[#F4F6F2]"}`}>
                <Icon size={18} strokeWidth={1.8} />{item.label}
              </button>;
            })}
          </div>
        </div>)}
        <div className="mb-8">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-[#737D75]">PREFERENCES</p>
          <div className="space-y-1">
            <button type="button" onClick={() => selectPage("Settings")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${activePage === "Settings" ? "bg-[#C6F36B]/10 text-[#C6F36B]" : "text-[#A4ADA5] hover:bg-[#272D29] hover:text-white"}`}><Settings size={18} />Settings</button>
            <button type="button" onClick={() => selectPage("Help")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${activePage === "Help" ? "bg-[#C6F36B]/10 text-[#C6F36B]" : "text-[#A4ADA5] hover:bg-[#272D29] hover:text-white"}`}><CircleHelp size={18} />Help & support</button>
          </div>
        </div>
      </div>
      <div className="border-t border-[#343A36] p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-[#202521] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#343A36] text-xs font-semibold text-[#C6F36B]">{initials}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#F4F6F2]">{user?.full_name || "User"}</p><p className="truncate text-xs text-[#737D75]">{user?.email || ""}</p></div>
        </div>
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#A4ADA5] transition hover:bg-[#F07878]/10 hover:text-[#F07878]"><LogOut size={18} />Sign out</button>
      </div>
    </aside>
  </>;
}

function StatCard({ title, value, icon: Icon, description }) {
  return <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
    <div className="flex items-center justify-between"><p className="text-sm text-[#A4ADA5]">{title}</p><div className="rounded-lg bg-[#272D29] p-2"><Icon size={18} className="text-[#C6F36B]" /></div></div>
    <p className="mt-5 break-words text-2xl font-semibold text-[#F4F6F2]">{value}</p>
    <p className="mt-2 text-xs text-[#737D75]">{description}</p>
  </div>;
}

function EmptyState({ message }) {
  return <div className="flex min-h-[130px] items-center justify-center text-center"><p className="text-sm text-[#737D75]">{message}</p></div>;
}

function Dashboard({ user, setActivePage, summary, loading, error, onRetry }) {
  if (loading) return <div className="flex min-h-[420px] flex-col items-center justify-center"><RefreshCw size={28} className="animate-spin text-[#C6F36B]" /><p className="mt-4 text-sm text-[#A4ADA5]">Loading your financial dashboard...</p></div>;
  if (error) return <div className="rounded-xl border border-[#343A36] bg-[#202521] p-8 text-center"><p className="font-medium text-[#F07878]">Unable to load your dashboard</p><p className="mt-2 text-sm text-[#A4ADA5]">{error}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C6F36B] px-4 py-2.5 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A]"><RefreshCw size={16} />Try again</button></div>;

  const financial = summary?.financial_summary || {};
  const categories = summary?.category_breakdown || [];
  const budgets = summary?.budgets || [];
  const goals = summary?.savings_goals || [];
  const period = summary?.period || {};
  const totalIncome = Number(financial.total_income || 0);
  const totalExpenses = Number(financial.total_expenses || 0);
  const netSavings = Number(financial.net_savings || 0);

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm text-[#A4ADA5]">Welcome back,</p><h1 className="text-2xl font-semibold tracking-tight text-[#F4F6F2] sm:text-3xl">{user?.full_name?.split(" ")[0] || "there"}</h1><p className="mt-2 text-sm text-[#A4ADA5]">Your financial overview for {period.month && period.year ? formatMonth(period.year, period.month) : "this month"}.</p></div>
      <button type="button" onClick={() => setActivePage("Transactions")} className="flex items-center justify-center gap-2 rounded-lg bg-[#C6F36B] px-4 py-2.5 text-sm font-semibold text-[#151A0D] transition hover:bg-[#D3FF7A]"><Plus size={17} />Add transaction</button>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Monthly income" value={formatCurrency(totalIncome)} icon={ArrowDownRight} description="Income received this month" />
      <StatCard title="Monthly expenses" value={formatCurrency(totalExpenses)} icon={ArrowUpRight} description="Money spent this month" />
      <StatCard title="Net savings" value={formatCurrency(netSavings)} icon={TrendingUp} description="Income minus expenses this month" />
      <StatCard title="Savings goals" value={String(goals.length)} icon={Target} description="Your currently recorded goals" />
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#F4F6F2]">Spending breakdown</h2><p className="mt-1 text-xs text-[#737D75]">Expenses by category this month</p></div><CreditCard size={19} className="text-[#737D75]" /></div>
        {categories.length === 0 ? <EmptyState message="No expense records for this month yet." /> : <div className="mt-6 space-y-5">{categories.map((item) => { const amount = Number(item.total || 0); const percentage = totalExpenses > 0 ? Math.min(amount / totalExpenses * 100, 100) : 0; return <div key={item.category}><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm text-[#F4F6F2]">{item.category}</span><span className="shrink-0 text-sm text-[#A4ADA5]">{formatCurrency(amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#343A36]"><div className="h-full rounded-full bg-[#C6F36B]" style={{ width: `${percentage}%` }} /></div></div>; })}</div>}
      </div>
      <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#F4F6F2]">Budget overview</h2><p className="mt-1 text-xs text-[#737D75]">Monthly spending against your budgets</p></div><Wallet size={19} className="text-[#737D75]" /></div>
        {budgets.length === 0 ? <EmptyState message="No budgets created for this month yet." /> : <div className="mt-6 space-y-5">{budgets.map((budget) => { const percentage = Number(budget.usage_percentage || 0); const safe = Math.min(Math.max(percentage, 0), 100); return <div key={budget.category}><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm text-[#F4F6F2]">{budget.category}</span><span className="shrink-0 text-xs text-[#A4ADA5]">{formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#343A36]"><div className={`h-full rounded-full ${percentage > 100 ? "bg-[#F07878]" : "bg-[#C6F36B]"}`} style={{ width: `${safe}%` }} /></div><p className="mt-1 text-xs text-[#737D75]">{formatCurrency(budget.remaining)} remaining · {percentage.toFixed(1)}% used</p></div>; })}</div>}
        <button type="button" onClick={() => setActivePage("Budgets")} className="mt-5 text-xs font-medium text-[#C6F36B] hover:underline">Manage budgets</button>
      </div>
    </div>
    <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
      <div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#F4F6F2]">Savings goals</h2><p className="mt-1 text-xs text-[#737D75]">Track your progress toward financial goals</p></div><button type="button" onClick={() => setActivePage("Savings goals")} className="text-xs font-medium text-[#C6F36B] hover:underline">View goals</button></div>
      {goals.length === 0 ? <EmptyState message="You haven't created any savings goals yet." /> : <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">{goals.map((goal) => { const percentage = Number(goal.progress_percentage || 0); const safe = Math.min(Math.max(percentage, 0), 100); return <div key={goal.id} className="rounded-lg border border-[#343A36] bg-[#191D1A] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-medium text-[#F4F6F2]">{goal.name}</h3><p className="mt-1 text-xs text-[#737D75]">Target: {formatCurrency(goal.target_amount)}</p></div><Target size={19} className="shrink-0 text-[#C6F36B]" /></div><div className="mt-5 flex items-center justify-between text-xs"><span className="text-[#A4ADA5]">{formatCurrency(goal.current_amount)} saved</span><span className="text-[#C6F36B]">{percentage.toFixed(1)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#343A36]"><div className="h-full rounded-full bg-[#C6F36B]" style={{ width: `${safe}%` }} /></div><p className="mt-2 text-xs text-[#737D75]">{formatCurrency(goal.remaining_amount)} remaining</p></div>; })}</div>}
    </div>
    <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5"><div className="flex items-center gap-2"><Sparkles size={19} className="text-[#C6F36B]" /><h2 className="font-semibold text-[#F4F6F2]">Financial intelligence</h2></div><div className="flex min-h-[110px] flex-col items-center justify-center text-center"><Lightbulb size={25} className="mb-3 text-[#737D75]" /><p className="text-sm text-[#A4ADA5]">Explore your personalized financial insights.</p><button type="button" onClick={() => setActivePage("Insights")} className="mt-4 text-sm font-medium text-[#C6F36B] hover:underline">View insights</button></div></div>
  </div>;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true); setError("");
    try { const response = await api.get("/dashboard/summary"); setSummary(response.data); }
    catch (err) { const message = err.response?.data?.detail || "Could not connect to the dashboard. Please try again."; setError(typeof message === "string" ? message : "The server returned an unexpected error."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  let page;
  switch (activePage) {
    case "Dashboard": page = <Dashboard user={user} setActivePage={setActivePage} summary={summary} loading={loading} error={error} onRetry={fetchDashboard} />; break;
    case "Transactions": page = <Transactions />; break;
    case "Budgets": page = <Budgets />; break;
    case "Savings goals": page = <SavingsGoals />; break;
    case "Analytics": page = <Analytics />; break;
    case "AI Assistant": page = <Assistant />; break;
    case "Insights": page = <Insights />; break;
    case "Settings": page = <SettingsPage />; break;
    case "Help": page = <HelpPage />; break;
    default: page = <Dashboard user={user} setActivePage={setActivePage} summary={summary} loading={loading} error={error} onRetry={fetchDashboard} />;
  }

  return <div className="min-h-screen bg-[#111312] text-[#F4F6F2]">
    <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    <div className="min-h-screen lg:pl-[260px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#343A36] bg-[#111312]/95 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="text-[#A4ADA5] hover:text-white lg:hidden" aria-label="Open navigation"><Menu size={22} /></button><div><p className="text-xs text-[#737D75]">FinTrack AI / Workspace</p><p className="mt-1 text-sm font-medium text-[#F4F6F2]">{activePage}</p></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><button type="button" aria-label="Search" title="Search" onClick={() => setActivePage("Transactions")} className="rounded-lg p-2 text-[#A4ADA5] transition hover:bg-[#202521] hover:text-white"><Search size={19} /></button><button type="button" aria-label="Notifications" title="Notifications" onClick={() => setActivePage("Settings")} className="relative rounded-lg p-2 text-[#A4ADA5] transition hover:bg-[#202521] hover:text-white"><Bell size={19} /></button><div className="hidden h-8 w-px bg-[#343A36] sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#343A36] text-xs font-semibold text-[#C6F36B]">{user?.full_name?.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "U"}</div><span className="max-w-[120px] truncate text-sm text-[#A4ADA5]">{user?.full_name || "User"}</span><ChevronDown size={15} className="text-[#737D75]" /></div></div>
      </header>
      <main className="mx-auto max-w-[1600px] p-5 sm:p-8">{page}<footer className="mt-10 border-t border-[#343A36] py-5 text-center text-xs text-[#737D75]">FinTrack AI © 2026. Your finances, your control.</footer></main>
    </div>
  </div>;
}
