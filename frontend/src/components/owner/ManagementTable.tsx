import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Download, Building2, Plus, Trash2, Users, Save, X, ChevronDown, ChevronRight, Folder, FolderOpen, ArrowLeft, Home, Info, HelpCircle, Lightbulb, Lock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Tenant, Receipt, Property, PropertyUnit } from "@/types";

interface ManagementTableProps {
    tenants: Tenant[];
    receipts: Receipt[];
    properties: Property[];
    onDeleteTenant?: (tenantId: string) => void;
    selectedYear: string;
    onYearChange: (year: string) => void;
    navigationPath: string[];
    onNavigationChange: (path: string[] | ((prev: string[]) => string[])) => void;
    customGroups: { id: string; name: string; tenantIds: string[]; parentId?: string }[];
    onGroupsChange: (groups: any[] | ((prev: any[]) => any[])) => void;
    groupedData: any[];
    years: number[];
}

export const ManagementTable = ({
    tenants,
    receipts,
    properties,
    onDeleteTenant,
    selectedYear,
    onYearChange,
    navigationPath,
    onNavigationChange,
    customGroups,
    onGroupsChange,
    groupedData,
    years
}: ManagementTableProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { hasFeature, subscription } = useSubscription();
    const canExport = hasFeature('excel');
    const userGroupsKey = useMemo(() => user?.id ? `owner_tenant_groups_v2_${user.id}` : "owner_tenant_groups_v2_guest", [user?.id]);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupParentId, setNewGroupParentId] = useState<string>("root");

    const enterGroup = (groupId: string) => {
        onNavigationChange(prev => [...prev, groupId]);
    };

    const goBack = () => {
        onNavigationChange(prev => prev.slice(0, -1));
    };

    const goToLevel = (index: number) => {
        onNavigationChange(prev => prev.slice(0, index + 1));
    };

    const resetNavigation = () => {
        onNavigationChange([]);
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    useEffect(() => {
        console.log(`[MANAGEMENT] Render debug:`, {
            propertiesCount: properties?.length,
            tenantsCount: tenants?.length,
            receiptsCount: receipts?.length,
            navigationPath,
            groupedDataCount: groupedData?.length,
            currentNodesCount: getCurrentNodes()?.length
        });
    });

    const saveGroups = (newGroups: any) => {
        onGroupsChange(newGroups);
        localStorage.setItem(userGroupsKey, JSON.stringify(newGroups));
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now().toString(),
            name: newGroupName.trim(),
            tenantIds: [],
            parentId: newGroupParentId === "root" ? undefined : newGroupParentId,
        };
        saveGroups([...customGroups, newGroup]);
        setNewGroupName("");
        setNewGroupParentId("root");
    };

    const handleDeleteGroup = (groupId: string) => {
        // When a group is deleted, its children should move to its parent or root
        const groupToDelete = customGroups.find(g => g.id === groupId);
        const newGroups = customGroups
            .filter(g => g.id !== groupId)
            .map(g => g.parentId === groupId ? { ...g, parentId: groupToDelete?.parentId } : g);
        saveGroups(newGroups);
    };

    const findNodeRecursive = (nodes: any[], targetId: string): any => {
        if (!nodes) return null;
        for (const node of nodes) {
            if (node.id === targetId) return node;
            if (node.children) {
                const found = findNodeRecursive(node.children, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    const getCurrentNodes = () => {
        if (!navigationPath || navigationPath.length === 0) return groupedData || [];
        const targetGroup = findNodeRecursive(groupedData, navigationPath[navigationPath.length - 1]);
        return targetGroup?.children || [];
    };

    const handleDeleteAllGroups = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer TOUS les groupes ? Cette action est irréversible.")) {
            saveGroups([]);
            onNavigationChange([]);
            toast({
                title: "Dossiers supprimés",
                description: "Tous les dossiers personnalisés ont été effacés.",
            });
        }
    };

    const toggleTenantInGroup = (groupId: string, tenantId: string) => {
        saveGroups(customGroups.map(g => {
            if (g.id === groupId) {
                const isIncluded = g.tenantIds.includes(tenantId);
                return {
                    ...g,
                    tenantIds: isIncluded
                        ? g.tenantIds.filter(id => id !== tenantId)
                        : [...g.tenantIds, tenantId]
                };
            }
            // Remove tenant from other groups to ensure unique assignment
            // (Only if not in the same branch? No, keep it simple for now: one tenant per group)
            return {
                ...g,
                tenantIds: g.tenantIds.filter(id => id !== tenantId)
            };
        }));
    };



    const months = [
        { id: 1, label: "Jan" },
        { id: 2, label: "Fév" },
        { id: 3, label: "Mar" },
        { id: 4, label: "Avr" },
        { id: 5, label: "Mai" },
        { id: 6, label: "Juin" },
        { id: 7, label: "Juil" },
        { id: 8, label: "Août" },
        { id: 9, label: "Sep" },
        { id: 10, label: "Oct" },
        { id: 11, label: "Nov" },
        { id: 12, label: "Déc" },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
            maximumFractionDigits: 0,
        })
            .format(amount)
            .replace("XOF", "F CFA");
    };

    const getReceiptForNode = (unitId: string, tenant: Tenant | null | undefined, monthId: number) => {
        if (!receipts) return null;
        const year = parseInt(selectedYear);
        return receipts.find(r => {
            const rYear = typeof r.year === 'string' ? parseInt(r.year) : r.year;
            const rMonth = typeof r.month === 'string' ? parseInt(r.month) : r.month;
            if (rYear !== year || rMonth !== monthId) return false;

            const rUnitId = r.unit_id ? String(r.unit_id) : null;
            const targetUnitId = unitId ? String(unitId) : null;
            if (rUnitId && targetUnitId && rUnitId === targetUnitId) return true;

            const rTenantId = (r as any).tenant_id ? String((r as any).tenant_id) : null;
            const rUserId = (r as any).user_id ? String((r as any).user_id) : null;
            const tId = tenant?.id ? String(tenant.id) : null;
            const tUserId = tenant?.user_id ? String(tenant.user_id) : null;

            if (tId && (rTenantId === tId || rUserId === tId)) return true;
            if (tUserId && (rTenantId === tUserId || rUserId === tUserId)) return true;

            return false;
        });
    };

    const handleExport = () => {
        const headers = ["Locataire", "Bien", "Unité", ...months.map(m => m.label), "Total Annuel"];
        const rows: string[][] = [];

        const collectRows = (nodes: any[], groupName = "") => {
            if (!nodes) return;
            nodes.forEach(node => {
                const currentPath = groupName ? `${groupName} > ${node.name}` : node.name;

                if (node.type === 'property') {
                    (node.units || []).forEach(({ unit, tenant }: any) => {
                        let annualTotal = 0;
                        const monthlyAmounts = months.map(month => {
                            const receipt = getReceiptForNode(unit?.id, tenant, month.id);
                            const amount = receipt ? (typeof receipt.amount === 'number' ? receipt.amount : parseFloat(receipt.amount) || 0) : 0;
                            annualTotal += amount;
                            return amount.toString();
                        });
                        rows.push([
                            tenant ? tenant.full_name : "VACANT",
                            currentPath,
                            unit?.unit_number || "N/A",
                            ...monthlyAmounts,
                            annualTotal.toString()
                        ]);
                    });
                } else if (node.children) {
                    collectRows(node.children, currentPath);
                }
            });
        };

        collectRows(groupedData);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Gerance_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    return (
        <Card className="shadow-soft overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle className="text-xl font-bold">Gérance Financière</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Suivi des paiements mensuels pour l'année {selectedYear}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Dialog open={isManageGroupsOpen} onOpenChange={setIsManageGroupsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                    <Users className="mr-2 h-4 w-4" />
                                    Gérer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Organisation</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                                    <div className="space-y-4">
                                        <Label>Nouveau Groupe</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Input
                                                placeholder="ex: Immeuble A"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                                            />
                                            <Select value={newGroupParentId} onValueChange={setNewGroupParentId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Groupe Parent" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="root">Aucun (Racine)</SelectItem>
                                                    {customGroups.map(g => (
                                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button className="w-full" onClick={handleCreateGroup}>Créer le groupe</Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-sm">Hiérarchie des dossiers</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                                onClick={handleDeleteAllGroups}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Tout supprimer
                                            </Button>
                                        </div>
                                        {customGroups.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Aucun groupe créé.</p>
                                        ) : (
                                            customGroups.map(group => (
                                                <Card key={group.id} className="p-4 bg-muted/30">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h3 className="font-bold">{group.name}</h3>
                                                            {group.parentId && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    Parent: {customGroups.find(g => g.id === group.parentId)?.name || 'Inconnu'}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {tenants.map(tenant => (
                                                            <div key={tenant.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`${group.id}-${tenant.id}`}
                                                                    checked={group.tenantIds.includes(tenant.id)}
                                                                    onCheckedChange={() => toggleTenantInGroup(group.id, tenant.id)}
                                                                />
                                                                <label
                                                                    htmlFor={`${group.id}-${tenant.id}`}
                                                                    className="text-sm font-medium leading-none cursor-pointer truncate"
                                                                >
                                                                    {tenant.full_name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => setIsManageGroupsOpen(false)}>Fermer</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={!canExport}
                            className={`flex-1 sm:flex-none ${!canExport ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            title={!canExport ? "L'export Excel est réservé aux comptes Entreprise (Professionnel)" : "Exporter les données en CSV"}
                        >
                            {canExport ? <Download className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                            Export
                        </Button>
                    </div>
                    <Select value={selectedYear} onValueChange={onYearChange}>
                        <SelectTrigger className="w-full sm:w-[120px]">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Guide d'utilisation visible directement */}
                <div className="px-6 py-4 bg-primary/5 border-y border-primary/10 flex flex-col md:flex-row md:items-center gap-4 animate-in fade-in duration-500">
                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                        <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">Astuce d'organisation :</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Regroupez vos locataires par bâtiment ou appartement pour une meilleure visibilité.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] bg-white/50 px-3 py-2 rounded border border-primary/5 shrink-0">
                        <div className="flex items-center gap-1">
                            <Folder className="h-3 w-3 text-amber-500 fill-amber-100" />
                            <span className="font-bold">Maison Dakar 2</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <div className="flex items-center gap-1">
                            <Folder className="h-3 w-3 text-amber-400 fill-amber-50" />
                            <span className="font-bold">Appartement A</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <div className="flex items-center gap-1 text-slate-500">
                            <Users className="h-3 w-3" />
                            <span>Locataires</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col h-[600px]">
                    {/* Navigation Bar / Breadcrumbs */}
                    <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 gap-1.5 px-2 ${navigationPath.length === 0 ? 'text-primary font-bold bg-primary/10' : ''}`}
                                onClick={resetNavigation}
                            >
                                <Home className="h-4 w-4" />
                                <span className="text-xs">Ma Gérance</span>
                            </Button>

                            {navigationPath.map((groupId, index) => {
                                const group = customGroups.find(g => g.id === groupId);
                                return (
                                    <div key={`nav-${groupId}-${index}`} className="flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 gap-1.5 px-2 ${index === navigationPath.length - 1 ? 'text-primary font-bold bg-primary/10' : ''}`}
                                            onClick={() => goToLevel(index)}
                                        >
                                            <Folder className="h-4 w-4" />
                                            <span className="text-xs">{group?.name || 'Groupe'}</span>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                        {navigationPath.length > 0 && (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={goBack}>
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Retour
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="min-w-max">
                            <Table className="relative">
                                <TableHeader className="bg-muted sticky top-0 z-20">
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-muted z-30 w-[200px] font-bold border-r">
                                            {navigationPath.length === 0 ? "ÉLÉMENTS" : (customGroups.find(g => g.id === navigationPath[navigationPath.length - 1])?.name.toUpperCase())}
                                        </TableHead>
                                        {months.map((month) => (
                                            <TableHead key={month.id} className="text-center w-[60px] p-1">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{month.label}</span>
                                                    <span className="text-[9px] text-muted-foreground/60">{selectedYear}</span>
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right w-[100px] font-bold text-primary">TOTAL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const currentNodes = getCurrentNodes();
                                        if (currentNodes.length === 0) {
                                            return (
                                                <TableRow>
                                                    <TableCell colSpan={months.length + 2} className="h-24 text-center text-muted-foreground italic">
                                                        Ce dossier est vide.
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }

                                        const calculateNodeStats = (n: any): { total: number, monthly: Record<number, number> } => {
                                            let total = 0;
                                            const monthly: Record<number, number> = {};
                                            months.forEach(m => monthly[m.id] = 0);

                                            if (n.type === 'property') {
                                                (n.units || []).forEach(({ unit, tenant }: any) => {
                                                    months.forEach(m => {
                                                        const r = getReceiptForNode(unit?.id, tenant, m.id);
                                                        if (r) {
                                                            const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                                                            total += amount;
                                                            monthly[m.id] += amount;
                                                        }
                                                    });
                                                });
                                            } else {
                                                (n.children || []).forEach((child: any) => {
                                                    const sub = calculateNodeStats(child);
                                                    total += sub.total;
                                                    Object.keys(sub.monthly).forEach(mId => {
                                                        monthly[parseInt(mId)] += sub.monthly[parseInt(mId)];
                                                    });
                                                });
                                            }
                                            return { total, monthly };
                                        };

                                        return currentNodes.map((node: any) => {
                                            const stats = calculateNodeStats(node);
                                            const isExpanded = expandedGroups[node.id] === true;

                                            if (node.type === 'group') {
                                                return (
                                                    <TableRow
                                                        key={`group-${node.id}`}
                                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                                        onClick={() => enterGroup(node.id)}
                                                    >
                                                        <TableCell colSpan={months.length + 2} className="py-4 border-b">
                                                            <div className="flex items-center justify-between px-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                                        <Folder className="h-6 w-6 text-primary" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-primary uppercase tracking-wide">
                                                                            {node.name}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                            <Building2 className="h-3 w-3" />
                                                                            {node.children?.length || 0} élément{(node.children?.length || 0) > 1 ? 's' : ''} à l'intérieur
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-sm font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                                                        {formatCurrency(stats.total)}
                                                                    </div>
                                                                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            } else {
                                                return (
                                                    <React.Fragment key={`prop-wrapper-${node.id}`}>
                                                        <TableRow
                                                            className="bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                                            onClick={() => toggleGroup(node.id)}
                                                        >
                                                            <TableCell colSpan={months.length + 2} className="py-2.5 px-4 font-bold border-b">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                        <div className="p-1 bg-white rounded shadow-sm border border-primary/10">
                                                                            <Building2 className="h-3.5 w-3.5 text-primary" />
                                                                        </div>
                                                                        <span className="text-xs uppercase tracking-tight">{node.name}</span>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-muted-foreground">
                                                                        {formatCurrency(stats.total)}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>

                                                        {isExpanded && (node.units || []).map((u: any, unitIdx: number) => {
                                                            let tenantYearTotal = 0;
                                                            return (
                                                                <TableRow key={`row-${node.id}-${u.unit?.id || unitIdx}`} className="hover:bg-muted/30">
                                                                    <TableCell className="sticky left-0 bg-white dark:bg-card z-10 border-r pl-8">
                                                                        <div className="flex items-center justify-between group/tenant">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold text-primary uppercase">Unité {u.unit?.unit_number || 'N/A'}</span>
                                                                                <div className={`text-[10px] truncate ${u.tenant ? 'text-muted-foreground' : 'text-orange-500 italic'}`}>
                                                                                    {u.tenant ? u.tenant.full_name : 'DISPONIBLE'}
                                                                                </div>
                                                                            </div>
                                                                            {u.tenant && onDeleteTenant && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 opacity-0 group-hover/tenant:opacity-100 transition-all border border-red-200"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (confirm(`⚠️ ATTENTION : Voulez-vous vraiment supprimer le locataire ${u.tenant.full_name} ?\n\nCette action retirera le locataire de cette unité et supprimera ses accès.`)) {
                                                                                            onDeleteTenant(u.tenant.id);
                                                                                        }
                                                                                    }}
                                                                                    title="Supprimer le locataire"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    {months.map((month) => {
                                                                        const receipt = getReceiptForNode(u.unit?.id, u.tenant, month.id);
                                                                        if (receipt) {
                                                                            const amount = typeof receipt.amount === 'number' ? receipt.amount : parseFloat(receipt.amount) || 0;
                                                                            tenantYearTotal += amount;
                                                                        }

                                                                        return (
                                                                            <TableCell key={month.id} className="text-center p-2">
                                                                                {receipt ? (
                                                                                    <div className="flex flex-col items-center gap-0.5 group relative">
                                                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                                        <span className="text-[9px] font-semibold text-green-700">
                                                                                            {(receipt.amount / 1000).toFixed(1).replace(/\.0$/, '')}k
                                                                                        </span>
                                                                                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg border border-white/20">
                                                                                            {formatCurrency(receipt.amount)}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center gap-0.5 opacity-30">
                                                                                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                        <span className="text-[9px]">---</span>
                                                                                    </div>
                                                                                )}
                                                                            </TableCell>
                                                                        );
                                                                    })}
                                                                    <TableCell className="text-right font-bold text-primary/80 text-xs">
                                                                        {formatCurrency(tenantYearTotal)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            }
                                        });
                                    })()}
                                </TableBody>
                                <TableHeader className="bg-primary shadow-[0_-2px_10px_rgba(0,0,0,0.1)] sticky bottom-0 z-30">
                                    <TableRow className="hover:bg-primary">
                                        <TableHead className="sticky left-0 bg-primary z-40 font-bold text-white border-r border-white/10 py-3">
                                            TOTAL DU DOSSIER
                                        </TableHead>
                                        {months.map((month) => {
                                            const currentNodes = getCurrentNodes();
                                            const calculateMonthlyTotal = (nodes: any[]): number => {
                                                let total = 0;
                                                nodes.forEach(n => {
                                                    if (n.type === 'property') {
                                                        (n.units || []).forEach(({ unit, tenant }: any) => {
                                                            const r = getReceiptForNode(unit?.id, tenant, month.id);
                                                            if (r) total += (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0);
                                                        });
                                                    } else {
                                                        total += calculateMonthlyTotal(n.children || []);
                                                    }
                                                });
                                                return total;
                                            };
                                            const folderMonthlyTotal = calculateMonthlyTotal(currentNodes);

                                            return (
                                                <TableHead key={month.id} className="text-center font-bold text-xs text-white/90">
                                                    {folderMonthlyTotal > 0 ? (
                                                        <div>
                                                            {(folderMonthlyTotal / 1000).toFixed(1).replace(/\.0$/, '')}k
                                                        </div>
                                                    ) : (
                                                        "0"
                                                    )}
                                                </TableHead>
                                            );
                                        })}
                                        <TableHead className="text-right font-black text-white py-3">
                                            {(() => {
                                                const currentNodes = getCurrentNodes();
                                                const calculateGrandTotal = (nodes: any[]): number => {
                                                    let total = 0;
                                                    nodes.forEach(n => {
                                                        if (n.type === 'property') {
                                                            (n.units || []).forEach(({ unit, tenant }: any) => {
                                                                months.forEach(m => {
                                                                    const r = getReceiptForNode(unit?.id, tenant, m.id);
                                                                    if (r) total += (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0);
                                                                });
                                                            });
                                                        } else {
                                                            total += calculateGrandTotal(n.children || []);
                                                        }
                                                    });
                                                    return total;
                                                };
                                                return formatCurrency(calculateGrandTotal(currentNodes));
                                            })()}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
};
