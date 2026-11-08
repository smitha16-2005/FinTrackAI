
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Download,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Filter,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import api from "../lib/api";

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatCurrency = (amount) =>
  currency.format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const initialForm = {
  amount: "",
  category: "",
  source: "",
  description: "",
  date: toDateTimeLocal(new Date()),
};

const inputClass =
  "w-full rounded-lg border border-[#343A36] bg-[#191D1A] px-3 py-3 text-sm text-[#F4F6F2] outline-none transition focus:border-[#C6F36B] placeholder:text-[#737D75]";

const labelClass =
  "mb-2 block text-sm font-medium text-[#C1C9C1]";

function SummaryCard({ title, amount, icon: Icon, color, description }) {
  return (
    <div className="rounded-xl border border-[#343A36] bg-[#202521] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#A4ADA5]">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#F4F6F2]">
            {formatCurrency(amount)}
          </p>
          <p className="mt-2 text-xs text-[#737D75]">{description}</p>
        </div>

        <div className="rounded-lg bg-[#191D1A] p-3">
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

function TransactionModal({
  open,
  onClose,
  onSave,
  editingTransaction,
  saving,
}) {
  const [type, setType] = useState("expense");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (editingTransaction) {
      setType(editingTransaction.type);

      setForm({
        amount: String(editingTransaction.amount),
        category: editingTransaction.category || "",
        source: editingTransaction.source || "",
        description: editingTransaction.description || "",
        date: toDateTimeLocal(editingTransaction.date),
      });
    } else {
      setType("expense");
      setForm({
        ...initialForm,
        date: toDateTimeLocal(new Date()),
      });
    }
  }, [open, editingTransaction]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select a transaction date.");
      return;
    }

    const label =
      type === "expense" ? form.category.trim() : form.source.trim();

    if (label.length < 2 || label.length > 50) {
      setError(
        type === "expense"
          ? "Category must contain 2 to 50 characters."
          : "Source must contain 2 to 50 characters."
      );
      return;
    }

    if (form.description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    try {
      await onSave({
        type,
        amount: amount.toFixed(2),
        category: type === "expense" ? label : undefined,
        source: type === "income" ? label : undefined,
        description: form.description.trim() || null,
        date: new Date(form.date).toISOString(),
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to save transaction."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <div className="my-auto w-full max-w-lg rounded-xl border border-[#343A36] bg-[#202521] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#343A36] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#F4F6F2]">
              {editingTransaction ? "Edit transaction" : "Add transaction"}
            </h2>
            <p className="mt-1 text-sm text-[#A4ADA5]">
              Enter the transaction details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-[#A4ADA5] transition hover:bg-[#272D29] hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className={labelClass}>Transaction type</label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={Boolean(editingTransaction)}
                onClick={() => setType("expense")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  type === "expense"
                    ? "border-[#F07878] bg-[#F07878]/10 text-[#F07878]"
                    : "border-[#343A36] text-[#A4ADA5] hover:bg-[#272D29]"
                }`}
              >
                <ArrowUpRight size={17} />
                Expense
              </button>

              <button
                type="button"
                disabled={Boolean(editingTransaction)}
                onClick={() => setType("income")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  type === "income"
                    ? "border-[#83C995] bg-[#83C995]/10 text-[#83C995]"
                    : "border-[#343A36] text-[#A4ADA5] hover:bg-[#272D29]"
                }`}
              >
                <ArrowDownLeft size={17} />
                Income
              </button>
            </div>

            {editingTransaction && (
              <p className="mt-2 text-xs text-[#737D75]">
                Transaction type cannot be changed while editing.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max="9999999999.99"
              required
              value={form.amount}
              onChange={(event) =>
                updateField("amount", event.target.value)
              }
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {type === "expense" ? "Category" : "Income source"}
            </label>

            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={type === "expense" ? form.category : form.source}
              onChange={(event) =>
                updateField(
                  type === "expense" ? "category" : "source",
                  event.target.value
                )
              }
              placeholder={
                type === "expense"
                  ? "e.g. Food, Travel, Shopping"
                  : "e.g. Salary, Freelance, Business"
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Date and time</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Description <span className="font-normal text-[#737D75]">(optional)</span>
            </label>

            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Add a note about this transaction..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[#F07878]/30 bg-[#F07878]/10 px-4 py-3 text-sm text-[#F07878]">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-[#343A36] px-4 py-3 text-sm font-medium text-[#C1C9C1] transition hover:bg-[#272D29] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#C6F36B] px-4 py-3 text-sm font-semibold text-[#151A0D] transition hover:bg-[#D3FF7A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingTransaction
                  ? "Save changes"
                  : "Add transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function BankStatementImport({ onImported, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const upload = async (endpoint) => {
    if (!file) {
      setError("Choose a CSV bank statement first.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/imports/${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to process this CSV. Check its format and try again."
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setResult(null);
    const data = await upload("preview");
    if (data) setPreview(data);
  };

  const handleConfirm = async () => {
    const data = await upload("confirm");
    if (data) {
      setResult(data);
      setPreview(null);
      await onImported();
    }
  };

  const close = () => {
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#343A36] bg-[#202521] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#343A36] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#F4F6F2]">Import bank statement</h2>
            <p className="mt-1 text-sm text-[#A4ADA5]">Upload a CSV statement to preview and import transactions.</p>
          </div>
          <button onClick={close} disabled={loading} className="rounded-lg p-2 text-[#A4ADA5] hover:bg-[#272D29]">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-dashed border-[#59634F] bg-[#191D1A] p-6 text-center">
            <FileUp size={30} className="mx-auto text-[#C6F36B]" />
            <p className="mt-3 text-sm font-medium text-[#F4F6F2]">Choose your bank's CSV statement</p>
            <p className="mt-1 text-xs text-[#737D75]">CSV files only. PDF statements are not supported yet.</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setResult(null);
                setError("");
              }}
              className="mx-auto mt-4 block max-w-full text-sm text-[#A4ADA5] file:mr-3 file:rounded-lg file:border-0 file:bg-[#C6F36B] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#151A0D] hover:file:bg-[#D3FF7A]"
            />
            {file && <p className="mt-3 break-all text-xs text-[#C6F36B]">{file.name}</p>}
          </div>

          {error && (
            <div className="flex gap-2 rounded-lg border border-[#F07878]/30 bg-[#F07878]/10 p-3 text-sm text-[#F07878]">
              <AlertCircle size={17} className="shrink-0" /> {error}
            </div>
          )}

          {preview && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#191D1A] p-4"><p className="text-xs text-[#A4ADA5]">Total rows</p><p className="mt-1 text-2xl font-semibold text-[#F4F6F2]">{preview.total_transactions}</p></div>
                <div className="rounded-lg bg-[#191D1A] p-4"><p className="text-xs text-[#A4ADA5]">New transactions</p><p className="mt-1 text-2xl font-semibold text-[#83C995]">{preview.new_transactions}</p></div>
                <div className="rounded-lg bg-[#191D1A] p-4"><p className="text-xs text-[#A4ADA5]">Possible duplicates</p><p className="mt-1 text-2xl font-semibold text-[#E9BD70]">{preview.duplicate_transactions}</p></div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#343A36]">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#191D1A] text-xs uppercase text-[#737D75]">
                    <tr>
                      <th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#343A36]">
                    {preview.transactions.map((item, index) => {
                      const duplicate = item.duplicate_in_file || item.possible_duplicate;
                      return (
                        <tr key={`${item.date}-${index}`} className="text-[#C1C9C1]">
                          <td className="whitespace-nowrap px-4 py-3">{formatDate(item.date)}</td>
                          <td className="max-w-[220px] truncate px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 capitalize">{item.type}</td>
                          <td className="px-4 py-3">{item.category || "Uncategorised"}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(item.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={duplicate ? "text-[#E9BD70]" : "text-[#83C995]"}>
                              {duplicate ? "Duplicate / review" : "New"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#737D75]">Rows marked duplicate or possible duplicate will be skipped by the backend.</p>
            </>
          )}

          {result && (
            <div className="rounded-xl border border-[#83C995]/30 bg-[#83C995]/10 p-5">
              <div className="flex items-center gap-2 text-[#83C995]"><CheckCircle2 size={20} /><h3 className="font-semibold">Import completed</h3></div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-[#A4ADA5]">Total rows</p><p className="mt-1 text-xl font-semibold text-[#F4F6F2]">{result.total_transactions}</p></div>
                <div><p className="text-xs text-[#A4ADA5]">Expenses imported</p><p className="mt-1 text-xl font-semibold text-[#F4F6F2]">{result.imported_expenses}</p></div>
                <div><p className="text-xs text-[#A4ADA5]">Income imported</p><p className="mt-1 text-xl font-semibold text-[#F4F6F2]">{result.imported_incomes}</p></div>
                <div><p className="text-xs text-[#A4ADA5]">Duplicates skipped</p><p className="mt-1 text-xl font-semibold text-[#F4F6F2]">{result.skipped_duplicates}</p></div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#343A36] pt-5 sm:flex-row sm:justify-between">
            <button onClick={close} disabled={loading} className="rounded-lg border border-[#343A36] px-4 py-3 text-sm font-medium text-[#C1C9C1] hover:bg-[#272D29]">Close</button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!preview && !result && (
                <button onClick={handlePreview} disabled={!file || loading} className="rounded-lg bg-[#C6F36B] px-5 py-3 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A] disabled:opacity-50">
                  {loading ? "Processing..." : "Preview transactions"}
                </button>
              )}
              {preview && (
                <>
                  <button onClick={() => { setPreview(null); setResult(null); }} disabled={loading} className="rounded-lg border border-[#343A36] px-4 py-3 text-sm text-[#C1C9C1] hover:bg-[#272D29]">Choose another file</button>
                  <button onClick={handleConfirm} disabled={loading || preview.new_transactions === 0} className="rounded-lg bg-[#C6F36B] px-5 py-3 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A] disabled:opacity-50">
                    {loading ? "Importing..." : `Import ${preview.new_transactions} new transactions`}
                  </button>
                </>
              )}
              {result && <button onClick={close} className="rounded-lg bg-[#C6F36B] px-5 py-3 text-sm font-semibold text-[#151A0D] hover:bg-[#D3FF7A]">Done</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [expenseResponse, incomeResponse] = await Promise.all([
        api.get("/expenses/", {
          params: { limit: 100, offset: 0 },
        }),
        api.get("/incomes/", {
          params: { limit: 100, offset: 0 },
        }),
      ]);

      const expenses = expenseResponse.data.map((item) => ({
        ...item,
        type: "expense",
        label: item.category,
        date: item.expense_date,
      }));

      const incomes = incomeResponse.data.map((item) => ({
        ...item,
        type: "income",
        label: item.source,
        date: item.income_date,
      }));

      const combined = [...expenses, ...incomes].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
    } catch (error) {
      setPageError(
        error.response?.data?.detail ||
          "Unable to load transactions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();

    return transactions.filter((transaction) => {
      if (activeTab !== "all" && transaction.type !== activeTab) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        transaction.label !== categoryFilter
      ) {
        return false;
      }

      if (query) {
        const searchable = [
          transaction.label,
          transaction.description,
          transaction.amount,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      const transactionDate = new Date(transaction.date);

      if (dateFilter === "month") {
        if (
          transactionDate.getMonth() !== now.getMonth() ||
          transactionDate.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      }

      if (dateFilter === "year") {
        if (transactionDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeTab, categoryFilter, dateFilter, search]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [filteredTransactions]);

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.label))].sort(),
    [transactions]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE)
  );

  const visibleTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, categoryFilter, dateFilter]);

  const handleSave = async (formData) => {
    setSaving(true);

    try {
      const isEditing = Boolean(editingTransaction);

      if (formData.type === "expense") {
        const payload = {
          amount: formData.amount,
          category: formData.category,
          description: formData.description,
          expense_date: formData.date,
        };

        if (isEditing) {
          await api.put(
            `/expenses/${editingTransaction.id}`,
            payload
          );
        } else {
          await api.post("/expenses/", payload);
        }
      } else {
        const payload = {
          amount: formData.amount,
          source: formData.source,
          description: formData.description,
          income_date: formData.date,
        };

        if (isEditing) {
          await api.put(
            `/incomes/${editingTransaction.id}`,
            payload
          );
        } else {
          await api.post("/incomes/", payload);
        }
      }

      setModalOpen(false);
      setEditingTransaction(null);
      setSuccessMessage(
        isEditing
          ? "Transaction updated successfully."
          : "Transaction added successfully."
      );

      await fetchTransactions();
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(
      `Delete this ${transaction.type}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(transaction.id);
    setPageError("");
    setSuccessMessage("");

    try {
      const endpoint =
        transaction.type === "expense"
          ? `/expenses/${transaction.id}`
          : `/incomes/${transaction.id}`;

      await api.delete(endpoint);

      setSuccessMessage("Transaction deleted successfully.");
      await fetchTransactions();
    } catch (error) {
      setPageError(
        error.response?.data?.detail ||
          "Unable to delete this transaction."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const exportCSV = () => {
    const headers = [
      "Type",
      "Amount",
      "Category/Source",
      "Description",
      "Date",
    ];

    const rows = filteredTransactions.map((item) => [
      item.type,
      item.amount,
      item.label,
      item.description || "",
      formatDate(item.date),
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fintrack-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F4F6F2]">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-[#A4ADA5]">
            Manage and review your income and expenses.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[#343A36] px-4 py-3 text-sm font-medium text-[#C1C9C1] transition hover:bg-[#272D29]"
          >
            <FileUp size={16} />
            Import bank statement
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 rounded-lg border border-[#343A36] px-4 py-3 text-sm font-medium text-[#C1C9C1] transition hover:bg-[#272D29] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-[#C6F36B] px-4 py-3 text-sm font-semibold text-[#151A0D] transition hover:bg-[#D3FF7A]"
          >
            <Plus size={17} />
            Add transaction
          </button>
        </div>
      </div>

      {pageError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#F07878]/30 bg-[#F07878]/10 px-4 py-3 text-sm text-[#F07878]">
          <span>{pageError}</span>
          <button
            onClick={fetchTransactions}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#83C995]/30 bg-[#83C995]/10 px-4 py-3 text-sm text-[#83C995]">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total income"
          amount={totals.income}
          icon={TrendingUp}
          color="text-[#83C995]"
          description="Based on the current filters"
        />

        <SummaryCard
          title="Total expenses"
          amount={totals.expenses}
          icon={TrendingDown}
          color="text-[#F07878]"
          description="Based on the current filters"
        />

        <SummaryCard
          title="Net balance"
          amount={totals.net}
          icon={Wallet}
          color={totals.net >= 0 ? "text-[#C6F36B]" : "text-[#F07878]"}
          description="Income minus expenses"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#343A36] bg-[#202521]">
        <div className="flex flex-col gap-4 border-b border-[#343A36] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 rounded-lg bg-[#191D1A] p-1">
            {[
              { value: "all", label: "All transactions" },
              { value: "expense", label: "Expenses" },
              { value: "income", label: "Income" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.value
                    ? "bg-[#343A36] text-[#F4F6F2]"
                    : "text-[#A4ADA5] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 sm:w-56">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737D75]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions..."
                className="w-full rounded-lg border border-[#343A36] bg-[#191D1A] py-2.5 pl-9 pr-3 text-sm text-[#F4F6F2] outline-none focus:border-[#C6F36B] placeholder:text-[#737D75]"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A4ADA5]"
              />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-[#343A36] bg-[#191D1A] py-2.5 pl-9 pr-9 text-sm text-[#C1C9C1] outline-none focus:border-[#C6F36B] sm:w-44"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ADA5]"
              />
            </div>

            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A4ADA5]"
              />
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full appearance-none rounded-lg border border-[#343A36] bg-[#191D1A] py-2.5 pl-9 pr-9 text-sm text-[#C1C9C1] outline-none focus:border-[#C6F36B] sm:w-40"
              >
                <option value="all">All dates</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ADA5]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-[#191D1A]">
              <tr className="text-xs font-medium uppercase tracking-wider text-[#737D75]">
                <th className="px-5 py-4">Transaction</th>
                <th className="px-5 py-4">Category / Source</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#343A36]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <LoaderCircle
                      size={24}
                      className="mx-auto animate-spin text-[#C6F36B]"
                    />
                    <p className="mt-3 text-sm text-[#A4ADA5]">
                      Loading transactions...
                    </p>
                  </td>
                </tr>
              ) : visibleTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#272D29]">
                      <Wallet size={22} className="text-[#A4ADA5]" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#F4F6F2]">
                      No transactions found
                    </p>
                    <p className="mt-1 text-sm text-[#737D75]">
                      Add a transaction or change your filters.
                    </p>
                    <button
                      onClick={openAddModal}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C6F36B] hover:text-[#D3FF7A]"
                    >
                      <CirclePlus size={16} />
                      Add your first transaction
                    </button>
                  </td>
                </tr>
              ) : (
                visibleTransactions.map((transaction) => (
                  <tr
                    key={`${transaction.type}-${transaction.id}`}
                    className="transition hover:bg-[#272D29]/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            transaction.type === "income"
                              ? "bg-[#83C995]/10 text-[#83C995]"
                              : "bg-[#F07878]/10 text-[#F07878]"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#F4F6F2]">
                            {transaction.label}
                          </p>
                          <p className="mt-1 max-w-[220px] truncate text-xs text-[#737D75]">
                            {transaction.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-[#83C995]/10 text-[#83C995]"
                            : "bg-[#F07878]/10 text-[#F07878]"
                        }`}
                      >
                        {transaction.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#A4ADA5]">
                      {formatDate(transaction.date)}
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold tabular-nums ${
                        transaction.type === "income"
                          ? "text-[#83C995]"
                          : "text-[#F07878]"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(transaction)}
                          title="Edit transaction"
                          className="rounded-lg p-2 text-[#A4ADA5] transition hover:bg-[#343A36] hover:text-[#C6F36B]"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(transaction)}
                          disabled={deletingId === transaction.id}
                          title="Delete transaction"
                          className="rounded-lg p-2 text-[#A4ADA5] transition hover:bg-[#F07878]/10 hover:text-[#F07878] disabled:opacity-40"
                        >
                          {deletingId === transaction.id ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#343A36] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#737D75]">
            Showing{" "}
            {filteredTransactions.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            {"–"}
            {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)}
            {" "}of {filteredTransactions.length} loaded transactions
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#343A36] p-2 text-[#A4ADA5] transition hover:bg-[#272D29] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-2 text-sm text-[#A4ADA5]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-[#343A36] p-2 text-[#A4ADA5] transition hover:bg-[#272D29] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {importOpen && (
        <BankStatementImport
          onClose={() => setImportOpen(false)}
          onImported={fetchTransactions}
        />
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingTransaction(null);
          }
        }}
        onSave={handleSave}
        editingTransaction={editingTransaction}
        saving={saving}
      />
    </div>
  );
}
