import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Plus,
    Download,
    FileSpreadsheet,
    FileText,
    PieChart as PieIcon,
    BarChart3,
    Calendar,
    Filter,
    Trash2,
    Edit,
    ExternalLink,
    Percent,
    CheckCircle2,
    Folder,
    ChevronRight,
    ChevronDown,
    Crown,
    Lock,
    Loader2,
    Building2,
    ShieldCheck,
    Clock
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useSubscription } from "@/hooks/useSubscription";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { getFinancialAnalytics, deleteExpense, ExpenseItem, FinancialAnalyticsData } from "@/api/expenses";
import { AddExpenseModal, CATEGORIES } from "./AddExpenseModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface FinancialDashboardTabProps {
    properties: { id: string; name: string }[];
    customGroups: { id: string; name: string; propertyIds: string[]; parentId?: string }[];
    currency?: string;
}

const MONTH_NAMES = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

const formatCompactNumber = (val: number): string => {
    if (val === 0) return "0";
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000) {
        const formatted = (val / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "");
        return `${formatted}B`;
    }
    if (abs >= 1_000_000) {
        const formatted = (val / 1_000_000).toFixed(2).replace(/\.?0+$/, "");
        return `${formatted}M`;
    }
    if (abs >= 1_000) {
        const formatted = (val / 1_000).toFixed(1).replace(/\.?0+$/, "");
        return `${formatted}k`;
    }
    return val.toString();
};

const FinancialFolderTreePicker = ({
    groups,
    value,
    onSelect
}: {
    groups: { id: string; name: string; propertyIds: string[]; parentId?: string }[];
    value: string;
    onSelect: (groupId: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const toggleExpand = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setOpenMap(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const selectedGroup = groups.find(g => g.id === value);
    const displayLabel = value === "all" || !selectedGroup ? "Tous les dossiers" : selectedGroup.name;

    const handleScrollStop = (e: React.UIEvent) => {
        e.stopPropagation();
    };

    const renderTreeNodes = (parentId?: string, depth = 0) => {
        const children = groups.filter(g => (parentId ? g.parentId === parentId : !g.parentId));
        children.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));

        if (children.length === 0) return null;

        return (
            <div className={`space-y-1 ${depth > 0 ? "ml-3 pl-2 border-l border-primary/20" : ""}`}>
                {children.map(group => {
                    const subChildren = groups.filter(g => g.parentId === group.id);
                    const hasSub = subChildren.length > 0;
                    const isCollapsed = !openMap[group.id];
                    const isSelected = value === group.id;

                    return (
                        <div key={group.id} className="space-y-1">
                            <div
                                onClick={() => {
                                    onSelect(group.id);
                                    setOpen(false);
                                }}
                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition-colors ${
                                    isSelected
                                        ? "bg-primary/10 font-bold text-primary border border-primary/30"
                                        : "hover:bg-muted/80 bg-background border border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    {hasSub ? (
                                        <button
                                            type="button"
                                            onClick={(e) => toggleExpand(group.id, e)}
                                            className="p-0.5 hover:bg-muted rounded transition-colors text-primary shrink-0"
                                            title={isCollapsed ? "Afficher les sous-dossiers" : "Masquer les sous-dossiers"}
                                        >
                                            {isCollapsed ? (
                                                <ChevronRight className="h-3.5 w-3.5 text-primary font-bold" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5 text-primary font-bold" />
                                            )}
                                        </button>
                                    ) : depth > 0 ? (
                                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">↳</span>
                                    ) : null}

                                    <Folder className={`h-3.5 w-3.5 shrink-0 ${depth === 0 ? "text-amber-500 fill-amber-100" : "text-amber-400 fill-amber-50"}`} />
                                    <span className="truncate">{group.name}</span>
                                </div>

                                {hasSub && (
                                    <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 ml-1">
                                        {subChildren.length}
                                    </span>
                                )}
                            </div>

                            {hasSub && !isCollapsed && renderTreeNodes(group.id, depth + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-[150px] h-9 text-xs justify-between font-normal px-2.5 bg-background"
                >
                    <span className="truncate flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{displayLabel}</span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[240px] p-2 bg-popover shadow-lg border rounded-md"
                align="start"
                onWheel={handleScrollStop}
                onTouchMove={handleScrollStop}
            >
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    <div
                        onClick={() => {
                            onSelect("all");
                            setOpen(false);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                            value === "all"
                                ? "bg-primary/10 font-bold text-primary border border-primary/30"
                                : "hover:bg-muted/80 bg-background border border-transparent"
                        }`}
                    >
                        <Folder className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Tous les dossiers</span>
                    </div>

                    {groups.length > 0 ? (
                        renderTreeNodes()
                    ) : (
                        <div className="text-[11px] text-muted-foreground p-2 text-center italic">
                            Aucun dossier créé
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const FinancialDashboardTab: React.FC<FinancialDashboardTabProps> = ({
    properties,
    customGroups,
    currency = "XOF"
}) => {
    const { toast } = useToast();
    const { subscription, loading: subLoading } = useSubscription();

    const isProfessional = useMemo(() => {
        if (!subscription || !subscription.plan_name) return false;
        
        // 1. Vérifier si le statut est 'active'
        if (subscription.status !== 'active') return false;

        // 2. Vérifier si le plan est Professionnel / Agence / Enterprise
        const plan = subscription.plan_name.toLowerCase();
        const isProPlan = plan === 'professional' || plan === 'professionnel' || plan === 'agence' || plan === 'enterprise';
        if (!isProPlan) return false;

        // 3. Vérifier strictement la date d'expiration (expires_at)
        if (subscription.expires_at) {
            const expiryDate = new Date(subscription.expires_at);
            const expiryEndOfDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate(), 23, 59, 59, 999).getTime();
            const now = new Date().getTime();

            // Si la date d'expiration est dépassée, l'accès est bloqué
            if (now > expiryEndOfDay) {
                return false;
            }
        }

        return true;
    }, [subscription]);

    const isProExpired = useMemo(() => {
        if (!subscription || !subscription.plan_name) return false;
        const plan = subscription.plan_name.toLowerCase();
        const isProPlan = plan === 'professional' || plan === 'professionnel' || plan === 'agence' || plan === 'enterprise';
        if (!isProPlan) return false;

        if (subscription.status !== 'active') return true;

        if (subscription.expires_at) {
            const expiryDate = new Date(subscription.expires_at);
            const expiryEndOfDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate(), 23, 59, 59, 999).getTime();
            return new Date().getTime() > expiryEndOfDay;
        }

        return false;
    }, [subscription]);

    const currentYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const [analytics, setAnalytics] = useState<FinancialAnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
    const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
    const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

    const years = useMemo(() => {
        if (analytics?.availableYears && analytics.availableYears.length > 0) {
            return analytics.availableYears;
        }
        const list: number[] = [];
        for (let y = currentYear; y >= currentYear - 3; y--) {
            list.push(y);
        }
        return list;
    }, [analytics?.availableYears, currentYear]);

    useEffect(() => {
        loadAnalytics();
    }, [selectedYear, selectedPropertyId, selectedGroupId]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await getFinancialAnalytics({
                year: selectedYear,
                property_id: selectedPropertyId !== "all" ? selectedPropertyId : undefined,
                group_id: selectedGroupId !== "all" ? selectedGroupId : undefined
            });
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to load financial analytics:", err);
            toast({
                title: "Erreur de chargement",
                description: "Impossible de charger les données financières.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = useMemo(() => {
        if (!analytics?.expenses) return [];
        return analytics.expenses.filter(e => {
            if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
            return true;
        });
    }, [analytics?.expenses, selectedCategory]);

    const chartData = useMemo(() => {
        if (!analytics?.monthlyData) return [];
        return analytics.monthlyData.map(m => ({
            name: MONTH_NAMES[m.month - 1],
            Revenus: m.revenue,
            Dépenses: m.expense,
            CashFlow: m.cashFlow
        }));
    }, [analytics?.monthlyData]);

    const pieChartData = useMemo(() => {
        if (!analytics?.categoryBreakdown) return [];
        return analytics.categoryBreakdown.map(item => {
            const catObj = CATEGORIES.find(c => c.value === item.category);
            return {
                name: catObj ? catObj.label.replace(/^[\p{Emoji}\s]+/gu, '') : item.category,
                value: item.amount
            };
        }).filter(item => item.value > 0);
    }, [analytics?.categoryBreakdown]);

    const handleDeleteClick = (id: string) => {
        setExpenseToDeleteId(id);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDeleteId) return;
        try {
            await deleteExpense(expenseToDeleteId);
            toast({
                title: "Dépense supprimée",
                description: "La dépense a été retirée de votre trésorerie."
            });
            loadAnalytics();
        } catch (err) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer la dépense.",
                variant: "destructive"
            });
        } finally {
            setConfirmDeleteOpen(false);
            setExpenseToDeleteId(null);
        }
    };

    const handleExportCSV = () => {
        if (!analytics) return;

        const headers = ["ID", "Date", "Catégorie", "Bien / Affectation", "Montant (FCFA)", "Description", "Récurrence"];
        const rows = filteredExpenses.map(e => [
            e.id,
            e.expense_date ? new Date(e.expense_date).toLocaleDateString('fr-FR') : "",
            CATEGORIES.find(c => c.value === e.category)?.label || e.category,
            e.property_name || (e.group_id ? `Dossier: ${e.group_id}` : "Global"),
            e.amount.toString(),
            `"${(e.description || "").replace(/"/g, '""')}"`,
            e.is_recurring ? `Oui (${e.recurrence_period})` : "Non"
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Tresorerie_Depenses_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Export réalisé",
            description: "Le rapport CSV des dépenses a été téléchargé."
        });
    };

    const handleDownloadPDF = () => {
        if (!analytics) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        // Textes saisis par l'utilisateur (descriptions, noms) : échappés avant d'être insérés dans la page d'impression
        const esc = (value: unknown) => String(value ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const money = (value: number) => esc(formatCurrency(value || 0, currency));
        const categoryLabel = (value: string) => {
            const catObj = CATEGORIES.find(c => c.value === value);
            // Retire l'émoji de tête (y compris ses caractères invisibles de variante)
            return catObj ? catObj.label.replace(/^[^\p{L}\p{N}]+/u, '') : value;
        };

        // Périmètre du rapport : les mêmes filtres que la page
        const propertyName = selectedPropertyId !== "all" ? properties.find(p => p.id === selectedPropertyId)?.name : null;
        const groupName = selectedGroupId !== "all" ? customGroups.find(g => g.id === selectedGroupId)?.name : null;
        const scopeParts = [
            `Exercice ${selectedYear}`,
            propertyName ? `Bien : ${propertyName}` : groupName ? `Dossier : ${groupName}` : "Tous les biens",
            selectedCategory !== "all" ? `Dépenses : ${categoryLabel(selectedCategory)}` : null
        ].filter(Boolean);

        const netCashFlow = analytics.netCashFlow || 0;
        const monthlyData = analytics.monthlyData || [];
        const maxMonthlyVal = Math.max(...monthlyData.map(m => Math.max(m.revenue, m.expense)), 1);

        const monthlyBarsHtml = monthlyData.map(m => {
            const revHeight = m.revenue > 0 ? Math.max(Math.round((m.revenue / maxMonthlyVal) * 75), 8) : 0;
            const expHeight = m.expense > 0 ? Math.max(Math.round((m.expense / maxMonthlyVal) * 75), 8) : 0;
            const hasData = m.revenue > 0 || m.expense > 0;
            return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                    <div style="height:80px;display:flex;align-items:flex-end;gap:3px;">
                        ${m.revenue > 0 ? `<div style="width:10px;height:${revHeight}px;background-color:#10b981;border:1px solid #059669;border-radius:2px;"></div>` : ''}
                        ${m.expense > 0 ? `<div style="width:10px;height:${expHeight}px;background-color:#ef4444;border:1px solid #dc2626;border-radius:2px;"></div>` : ''}
                        ${!hasData ? `<div style="width:10px;height:2px;background-color:#cbd5e1;"></div>` : ''}
                    </div>
                    <span style="font-size:9px;color:${hasData ? '#1e293b' : '#94a3b8'};font-weight:${hasData ? '700' : '500'};">${MONTH_NAMES[m.month - 1]}</span>
                </div>`;
        }).join('');

        // Montants du flux mensuel (sur la page, ils s'affichent au survol du graphique)
        const monthlyRowsHtml = monthlyData.map(m => `
            <tr>
                <td>${MONTH_NAMES[m.month - 1]}</td>
                <td class="num" style="color:#059669;">${m.revenue ? money(m.revenue) : '-'}</td>
                <td class="num" style="color:#e11d48;">${m.expense ? money(m.expense) : '-'}</td>
                <td class="num" style="font-weight:700;color:${m.cashFlow >= 0 ? '#059669' : '#e11d48'};">${m.revenue || m.expense ? money(m.cashFlow) : '-'}</td>
            </tr>`).join('');

        // Répartition des charges (diagramme circulaire)
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        let accumulatedPercent = 0;
        const categories = (analytics.categoryBreakdown || []).filter(item => item.amount > 0);
        const totalExp = categories.reduce((sum, item) => sum + item.amount, 0) || 1;
        const categorySlicesSvg = categories.map((item, idx) => {
            const pct = item.amount / totalExp;
            const strokeDasharray = `${pct * circumference} ${circumference * (1 - pct)}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += pct;
            return `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${COLORS[idx % COLORS.length]}" stroke-width="16" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" />`;
        }).join('');
        const categoryLegendHtml = categories.map((item, idx) => `
            <div style="display:flex;align-items:center;gap:5px;font-size:10px;">
                <span style="width:8px;height:8px;background-color:${COLORS[idx % COLORS.length]};border-radius:2px;display:inline-block;"></span>
                <span style="font-weight:600;color:#334155;">${esc(categoryLabel(item.category))} (${Math.round((item.amount / totalExp) * 100)}%) — ${money(item.amount)}</span>
            </div>`).join('');

        // Reste à encaisser
        const outstanding = analytics.outstanding;
        const outstandingHtml = outstanding ? `
            <div class="section ${outstanding.count > 0 ? 'section-alert' : ''}">
                <div class="section-head">
                    <div>
                        <div class="section-title">Reste à encaisser (${selectedYear})</div>
                        <div class="section-sub">${outstanding.count > 0
                            ? `${outstanding.count} loyer${outstanding.count > 1 ? 's' : ''} non soldé${outstanding.count > 1 ? 's' : ''} (réglés en partie ou impayés) : ce reste n'est pas compté dans les revenus.`
                            : 'Aucun loyer en attente sur cette période.'}</div>
                    </div>
                    <div class="section-amount" style="color:${outstanding.count > 0 ? '#ea580c' : '#059669'};">${money(outstanding.amount)}</div>
                </div>
                ${outstanding.count > 0 ? `
                <table>
                    <thead><tr><th>Locataire</th><th>Bien</th><th>Mois</th><th class="num">Versé / Loyer dû</th><th class="num">Reste</th></tr></thead>
                    <tbody>
                        ${outstanding.items.map(item => `
                        <tr>
                            <td style="font-weight:600;">${esc(item.tenant_name || 'Locataire')}</td>
                            <td>${esc(item.property_name || '-')}</td>
                            <td style="text-transform:capitalize;">${esc(new Date(item.year, item.month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' }))}</td>
                            <td class="num">${item.paid > 0 ? `${money(item.paid)} / ${money(item.rent_due)}` : `Impayé / ${money(item.rent_due)}`}</td>
                            <td class="num" style="font-weight:700;color:${item.paid > 0 ? '#ea580c' : '#dc2626'};">${money(item.remaining)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>` : ''}
            </div>` : '';

        // Cautions
        const deposits = analytics.deposits;
        const depositsHtml = deposits ? `
            <div class="section">
                <div class="section-title">Cautions (dépôts de garantie)</div>
                <div class="section-sub">Sommes à rendre en fin de bail : elles ne sont pas comptées dans les revenus.</div>
                <div class="kpi-grid" style="margin-top:10px;margin-bottom:0;">
                    <div class="kpi-card"><div class="kpi-label">Détenues actuellement</div><div class="kpi-value" style="color:#d97706;">${money(deposits.heldAmount)}</div><div class="kpi-hint">${deposits.heldCount} caution(s) à restituer</div></div>
                    <div class="kpi-card"><div class="kpi-label">Encaissées en ${selectedYear}</div><div class="kpi-value" style="color:#1e3a8a;">${money(deposits.collectedAmount)}</div><div class="kpi-hint">Cautions versées</div></div>
                    <div class="kpi-card"><div class="kpi-label">Restituées en ${selectedYear}</div><div class="kpi-value" style="color:#059669;">${money(deposits.refundedAmount)}</div><div class="kpi-hint">Rendues aux locataires</div></div>
                    <div class="kpi-card"><div class="kpi-label">Retenues en ${selectedYear}</div><div class="kpi-value" style="color:#e11d48;">${money(deposits.retainedAmount)}</div><div class="kpi-hint">Déduites des cautions</div></div>
                </div>
            </div>` : '';

        // Historique des dépenses (mêmes colonnes que la page, sans les actions)
        const filteredTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const expenseRowsHtml = filteredExpenses.map(e => `
            <tr>
                <td style="white-space:nowrap;">${e.expense_date ? new Date(e.expense_date).toLocaleDateString('fr-FR') : '-'}</td>
                <td style="font-weight:600;">${esc(categoryLabel(e.category))}</td>
                <td>${e.property_name ? esc(e.property_name) : e.group_id ? 'Dossier' : 'Global'}</td>
                <td>${esc(e.description || '-')}${e.is_recurring ? ` <span style="color:#64748b;">(récurrente${e.recurrence_period ? ` : ${esc(e.recurrence_period)}` : ''})</span>` : ''}</td>
                <td class="num" style="font-weight:700;color:#e11d48;white-space:nowrap;">-${money(e.amount)}</td>
                <td style="text-align:center;">${e.receipt_url ? 'Oui' : '-'}</td>
            </tr>`).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Rapport_Financier_${selectedYear}_SamaLocation</title>
                <style>
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    @page { margin: 14mm 12mm 18mm; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 900px; margin: 0 auto; box-sizing: border-box; }
                    .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; }
                    .brand { font-size: 22px; font-weight: 800; color: #1e3a8a; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
                    .scope { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
                    .chip { font-size: 10px; font-weight: 700; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 2px 9px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
                    .kpi-card { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
                    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
                    .kpi-value { font-size: 16px; font-weight: 800; margin-top: 4px; }
                    .kpi-hint { font-size: 9px; color: #64748b; margin-top: 2px; }
                    .section { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 18px; break-inside: avoid; }
                    .section-alert { border-color: #fdba74; background-color: #fff7ed; }
                    .section-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
                    .section-title { font-size: 13px; font-weight: 800; color: #1e293b; }
                    .section-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
                    .section-amount { font-size: 18px; font-weight: 800; white-space: nowrap; }
                    .charts-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 15px; margin-bottom: 18px; break-inside: avoid; }
                    .chart-card { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    th { background-color: #f1f5f9; text-align: left; padding: 6px 8px; border-bottom: 2px solid #94a3b8; font-weight: 700; color: #334155; }
                    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                    tr { break-inside: avoid; }
                    .num { text-align: right; white-space: nowrap; }
                    tfoot td { font-weight: 800; border-top: 2px solid #94a3b8; border-bottom: none; }
                    h3 { margin: 20px 0 6px; font-size: 14px; color: #1e293b; break-after: avoid; }
                    .keep-together { break-inside: avoid; }
                    .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">Samalocation — Trésorerie & Rentabilité (ROI)</div>
                    <div class="subtitle">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="scope">${scopeParts.map(part => `<span class="chip">${esc(part)}</span>`).join('')}</div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card"><div class="kpi-label">Cash Flow (${selectedYear})</div><div class="kpi-value" style="color:${netCashFlow >= 0 ? '#059669' : '#e11d48'};">${money(netCashFlow)}</div><div class="kpi-hint">Revenus nets</div></div>
                    <div class="kpi-card"><div class="kpi-label">Loyers encaissés</div><div class="kpi-value" style="color:#059669;">${money(analytics.totalRevenue)}</div><div class="kpi-hint">Quittances validées</div></div>
                    <div class="kpi-card"><div class="kpi-label">Dépenses totales</div><div class="kpi-value" style="color:#e11d48;">${money(analytics.totalExpense)}</div><div class="kpi-hint">Charges & entretien</div></div>
                    <div class="kpi-card"><div class="kpi-label">Taux d'occupation</div><div class="kpi-value" style="color:#d97706;">${analytics.occupancyRate || 0}%</div><div class="kpi-hint">${analytics.occupiedUnits || 0} / ${analytics.totalUnits || 0} louée(s)</div></div>
                </div>

                ${outstandingHtml}
                ${depositsHtml}

                <div class="charts-grid">
                    <div class="chart-card">
                        <div style="font-size:12px;font-weight:700;margin-bottom:12px;display:flex;justify-content:space-between;">
                            <span>Flux de trésorerie mensuel (${selectedYear})</span>
                            <span style="font-size:10px;color:#64748b;"><span style="color:#10b981;">■</span> Revenus &nbsp;<span style="color:#ef4444;">■</span> Dépenses</span>
                        </div>
                        <div style="display:flex;align-items:flex-end;gap:3px;height:85px;padding-bottom:5px;">${monthlyBarsHtml}</div>
                    </div>
                    <div class="chart-card">
                        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Répartition des charges</div>
                        ${categories.length > 0 ? `
                            <div style="display:flex;flex-direction:column;align-items:center;padding:5px 0;">
                                <svg width="90" height="90" viewBox="0 0 100 100" style="transform:rotate(-90deg);overflow:visible;">${categorySlicesSvg}</svg>
                                <div style="margin-top:10px;display:flex;flex-direction:column;gap:3px;width:100%;">${categoryLegendHtml}</div>
                            </div>` : '<div style="font-size:11px;color:#94a3b8;text-align:center;padding:15px;">Aucune charge enregistrée.</div>'}
                    </div>
                </div>

                <div class="keep-together">
                <h3>Détail mensuel (${selectedYear})</h3>
                <table>
                    <thead><tr><th>Mois</th><th class="num">Revenus</th><th class="num">Dépenses</th><th class="num">Cash flow</th></tr></thead>
                    <tbody>${monthlyRowsHtml}</tbody>
                    <tfoot><tr>
                        <td>Total</td>
                        <td class="num" style="color:#059669;">${money(analytics.totalRevenue)}</td>
                        <td class="num" style="color:#e11d48;">${money(analytics.totalExpense)}</td>
                        <td class="num" style="color:${netCashFlow >= 0 ? '#059669' : '#e11d48'};">${money(netCashFlow)}</td>
                    </tr></tfoot>
                </table>
                </div>

                <h3>Historique des dépenses (${filteredExpenses.length} entrée${filteredExpenses.length > 1 ? 's' : ''}${selectedCategory !== "all" ? ` — ${esc(categoryLabel(selectedCategory))}` : ''})</h3>
                <table>
                    <thead><tr><th>Date</th><th>Catégorie</th><th>Affectation</th><th>Description</th><th class="num">Montant</th><th style="text-align:center;">Justificatif</th></tr></thead>
                    <tbody>
                        ${expenseRowsHtml || '<tr><td colspan="6" style="text-align:center;padding:15px;color:#94a3b8;">Aucune dépense enregistrée pour les filtres sélectionnés.</td></tr>'}
                    </tbody>
                    ${filteredExpenses.length > 0 ? `<tfoot><tr><td colspan="4">Total des dépenses listées</td><td class="num" style="color:#e11d48;">-${money(filteredTotal)}</td><td></td></tr></tfoot>` : ''}
                </table>

                <div class="footer">Document généré par Samalocation — Plateforme de gestion immobilière</div>

                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (subLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isProfessional) {
        return (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border rounded-2xl shadow-sm my-4 space-y-5">
                <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Crown className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-2 max-w-md">
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600 gap-1 px-3 py-1 text-xs">
                        <Crown className="h-3.5 w-3.5" /> Plan Professionnel
                    </Badge>
                    <h3 className="text-xl font-bold tracking-tight">
                        {isProExpired
                            ? "Abonnement Professionnel expiré"
                            : "Trésorerie & Rentabilité (ROI)"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {isProExpired
                            ? "Votre abonnement Professionnel est terminé. Veuillez renouveler votre abonnement pour rouvrir l'accès à votre trésorerie, vos bilans financiers et l'export PDF."
                            : "Cette fonctionnalité d'analyse financière avancée (Cash Flow Net, suivi analytique des charges, diagrammes de rentabilité et téléchargement de rapports PDF officiels) est réservée exclusivement aux abonnés au plan Professionnel."}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left text-xs bg-muted/50 p-4 rounded-xl border">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Calcul du Cash Flow Net</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Diagrammes & Statistiques</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Export Rapports PDF & CSV</span>
                    </div>
                </div>

                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 font-semibold px-6 h-11"
                    onClick={() => {
                        const subTab = document.querySelector('[data-value="subscription"]') as HTMLElement || document.querySelector('[data-tab="subscription"]') as HTMLElement;
                        if (subTab) {
                            subTab.click();
                        } else {
                            window.location.href = '/dashboard/proprietaire?tab=subscription';
                        }
                    }}
                >
                    <Crown className="h-4 w-4 text-amber-300" />
                    <span>
                        {isProExpired
                            ? "Renouveler le plan Professionnel"
                            : "Passer au plan Professionnel"}
                    </span>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Filtres */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <span>Trésorerie & Rentabilité (ROI)</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Suivez vos revenus, vos dépenses et analysez la rentabilité nette de votre patrimoine.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filtre Année */}
                    <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                        <SelectTrigger className="w-[110px] h-9 text-xs">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Filtre Dossier Hiérarchique avec Chevrons */}
                    <FinancialFolderTreePicker
                        groups={customGroups}
                        value={selectedGroupId}
                        onSelect={setSelectedGroupId}
                    />

                    {/* Filtre Bien */}
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                            <SelectValue placeholder="Tous les biens" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les biens</SelectItem>
                            {properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        size="sm"
                        className="h-9 text-xs gap-1.5"
                        onClick={() => {
                            setExpenseToEdit(null);
                            setIsAddExpenseOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        <span>Ajouter dépense</span>
                    </Button>
                </div>
            </div>

            {/* Cartes KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Cash Flow Net */}
                <Card className="shadow-sm">
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                        <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span className="truncate">Cash Flow ({selectedYear})</span>
                            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 ml-1" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                        <div className={`text-base sm:text-2xl font-bold truncate ${
                            (analytics?.netCashFlow || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                            {formatCurrency(analytics?.netCashFlow || 0, currency)}
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
                            {(analytics?.netCashFlow || 0) >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate">Revenus nets</span>
                        </p>
                    </CardContent>
                </Card>

                {/* Loyers Encaissés */}
                <Card className="shadow-sm">
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                        <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span className="truncate">Loyers Encaissés</span>
                            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0 ml-1" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                        <div className="text-base sm:text-2xl font-bold text-emerald-600 truncate">
                            {formatCurrency(analytics?.totalRevenue || 0, currency)}
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
                            Quittances validées
                        </p>
                    </CardContent>
                </Card>

                {/* Dépenses Totales */}
                <Card className="shadow-sm">
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                        <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span className="truncate">Dépenses Totales</span>
                            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 shrink-0 ml-1" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                        <div className="text-base sm:text-2xl font-bold text-rose-600 truncate">
                            {formatCurrency(analytics?.totalExpense || 0, currency)}
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
                            Charges & Entretien
                        </p>
                    </CardContent>
                </Card>

                {/* Taux d'Occupation */}
                <Card className="shadow-sm">
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                        <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span className="truncate">Taux Occupation</span>
                            <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0 ml-1" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                        <div className="text-base sm:text-2xl font-bold text-amber-600 truncate">
                            {analytics?.occupancyRate || 0}%
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
                            {analytics?.occupiedUnits || 0} / {analytics?.totalUnits || 0} louée(s)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Reste à encaisser : loyers de l'année réglés en partie (non comptés dans les revenus tant qu'ils ne sont pas versés) */}
            {analytics?.outstanding && (
                <Card className={`shadow-sm ${analytics.outstanding.count > 0 ? "border-orange-200 dark:border-orange-900/60" : ""}`}>
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
                        <div className="min-w-0">
                            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                                <Clock className={`h-4 w-4 shrink-0 ${analytics.outstanding.count > 0 ? "text-orange-600" : "text-emerald-600"}`} />
                                <span>Reste à encaisser ({selectedYear})</span>
                            </CardTitle>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {analytics.outstanding.count > 0
                                    ? `${analytics.outstanding.count} loyer${analytics.outstanding.count > 1 ? "s" : ""} non soldé${analytics.outstanding.count > 1 ? "s" : ""} (réglés en partie ou impayés) : ce reste n'est pas compté dans vos revenus.`
                                    : "Aucun loyer en attente sur cette période."}
                            </p>
                        </div>
                        <div className={`text-base sm:text-2xl font-bold whitespace-nowrap ${analytics.outstanding.count > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                            {formatCurrency(analytics.outstanding.amount, currency)}
                        </div>
                    </CardHeader>
                    {analytics.outstanding.count > 0 && (
                        <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
                            <div className="divide-y rounded-lg bg-muted/40">
                                {analytics.outstanding.items.map(item => (
                                    <div key={`${item.tenant_id}-${item.property_id}-${item.month}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 p-2.5 text-xs">
                                        <div className="min-w-0">
                                            <span className="font-semibold">{item.tenant_name || "Locataire"}</span>
                                            <span className="text-muted-foreground">
                                                {item.property_name ? ` — ${item.property_name}` : ""} · {new Date(item.year, item.month - 1, 1).toLocaleDateString("fr-FR", { month: "long" })}
                                            </span>
                                        </div>
                                        <div className="whitespace-nowrap">
                                            {item.paid > 0 ? (
                                                <>
                                                    <span className="text-muted-foreground">{formatCurrency(item.paid, currency)} / {formatCurrency(item.rent_due, currency)}</span>
                                                    <span className="font-bold text-orange-600"> · reste {formatCurrency(item.remaining, currency)}</span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-red-600">Impayé · {formatCurrency(item.remaining, currency)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Cautions : suivies à part, jamais comptées dans les revenus ni dans le cash flow */}
            {analytics?.deposits && (
                <Card className="shadow-sm">
                    <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                            <span>Cautions (dépôts de garantie)</span>
                        </CardTitle>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Sommes à rendre en fin de bail : elles ne sont pas comptées dans vos revenus.
                        </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            {
                                label: "Détenues actuellement",
                                value: analytics.deposits.heldAmount,
                                hint: `${analytics.deposits.heldCount} caution(s) à restituer`,
                                color: "text-amber-600",
                            },
                            { label: `Encaissées en ${selectedYear}`, value: analytics.deposits.collectedAmount, hint: "Cautions versées", color: "text-primary" },
                            { label: `Restituées en ${selectedYear}`, value: analytics.deposits.refundedAmount, hint: "Rendues aux locataires", color: "text-emerald-600" },
                            { label: `Retenues en ${selectedYear}`, value: analytics.deposits.retainedAmount, hint: "Déduites des cautions", color: "text-rose-600" },
                        ].map(item => (
                            <div key={item.label} className="rounded-lg bg-muted/40 p-2.5 sm:p-3 min-w-0">
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
                                <p className={`text-sm sm:text-lg font-bold truncate ${item.color}`}>{formatCurrency(item.value, currency)}</p>
                                <p className="text-[9px] sm:text-[11px] text-muted-foreground truncate">{item.hint}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graphique Revenus vs Dépenses */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <span>Flux de Trésorerie Mensuel ({selectedYear})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        width={42}
                                        tickFormatter={(val: number) => formatCompactNumber(val)}
                                    />
                                    <Tooltip
                                        formatter={(val: number) => [formatCurrency(val, currency), ""]}
                                        contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                    <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Camembert des Dépenses par Catégorie */}
                <Card className="shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <PieIcon className="h-4 w-4 text-primary" />
                            <span>Répartition des Charges</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex flex-col items-center justify-center">
                        {pieChartData.length > 0 ? (
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: number) => formatCurrency(val, currency)} />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-xs italic">
                                <span>Aucune dépense enregistrée</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tableau des Dépenses */}
            <Card className="shadow-sm">
                <CardHeader className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold">Historique des Dépenses</CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {filteredExpenses.length} entrée(s)
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Filtre Catégorie */}
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[150px] h-8 text-xs">
                                <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportCSV}>
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Export CSV</span>
                        </Button>

                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleDownloadPDF}>
                            <Download className="h-3.5 w-3.5 text-primary" />
                            <span>Télécharger PDF</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Catégorie</TableHead>
                                    <TableHead className="text-xs">Affectation</TableHead>
                                    <TableHead className="text-xs">Description</TableHead>
                                    <TableHead className="text-xs text-right">Montant</TableHead>
                                    <TableHead className="text-xs text-center">Justificatif</TableHead>
                                    <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                                            Aucune dépense enregistrée pour les filtres sélectionnés.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredExpenses.map(expense => {
                                        const catObj = CATEGORIES.find(c => c.value === expense.category);
                                        return (
                                            <TableRow key={expense.id}>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('fr-FR') : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <Badge variant="secondary" className="text-[11px] font-normal">
                                                        {catObj ? catObj.label : expense.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium">
                                                    {expense.property_name ? (
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <Building2 className="h-3 w-3" />
                                                            {expense.property_name}
                                                        </span>
                                                    ) : expense.group_id ? (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            📁 Dossier
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Global</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate" title={expense.description || ""}>
                                                    {expense.description || "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-right font-bold text-rose-600 whitespace-nowrap">
                                                    -{formatCurrency(expense.amount, currency)}
                                                </TableCell>
                                                <TableCell className="text-xs text-center">
                                                    {expense.receipt_url ? (
                                                        <a
                                                            href={expense.receipt_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            <span>Voir</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px]">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-right whitespace-nowrap">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        onClick={() => {
                                                            setExpenseToEdit(expense);
                                                            setIsAddExpenseOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeleteClick(expense.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal d'ajout / modification */}
            <AddExpenseModal
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
                onSuccess={loadAnalytics}
                expenseToEdit={expenseToEdit}
                properties={properties}
                customGroups={customGroups}
            />

            {/* Confirmation de suppression */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title="Supprimer la dépense"
                description="Êtes-vous sûr de vouloir supprimer cette dépense de votre trésorerie ? Cette action est irréversible."
                onConfirm={confirmDelete}
            />
        </div>
    );
};
