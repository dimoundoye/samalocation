import { useState, useMemo } from "react";
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
import { CheckCircle2, XCircle, Clock, Download, Building2, Plus, Trash2, Users, Save, X } from "lucide-react";
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
import { Tenant, Receipt } from "@/types";

interface ManagementTableProps {
    tenants: Tenant[];
    receipts: Receipt[];
}

export const ManagementTable = ({ tenants, receipts }: ManagementTableProps) => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [customGroups, setCustomGroups] = useState<{ id: string; name: string; tenantIds: string[] }[]>(() => {
        const saved = localStorage.getItem("owner_tenant_groups");
        return saved ? JSON.parse(saved) : [];
    });
    const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    const saveGroups = (newGroups: any) => {
        setCustomGroups(newGroups);
        localStorage.setItem("owner_tenant_groups", JSON.stringify(newGroups));
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now().toString(),
            name: newGroupName.trim(),
            tenantIds: [],
        };
        saveGroups([...customGroups, newGroup]);
        setNewGroupName("");
    };

    const handleDeleteGroup = (groupId: string) => {
        saveGroups(customGroups.filter(g => g.id !== groupId));
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
            return {
                ...g,
                tenantIds: g.tenantIds.filter(id => id !== tenantId)
            };
        }));
    };

    const years = useMemo(() => {
        const yearsSet = new Set<number>([currentYear]);
        receipts.forEach((r) => yearsSet.add(r.year));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [receipts, currentYear]);

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

    const paymentData = useMemo(() => {
        const year = parseInt(selectedYear);
        const data: Record<string, Record<number, Receipt | undefined>> = {};

        tenants.forEach((tenant) => {
            data[tenant.id] = {};
            months.forEach((month) => {
                const receipt = receipts.find(
                    (r) =>
                        (r.tenant_id === tenant.user_id || r.tenant_id === tenant.id) &&
                        r.year === year &&
                        r.month === month.id
                );
                data[tenant.id][month.id] = receipt;
            });
        });

        return data;
    }, [tenants, receipts, selectedYear]);

    const monthlyTotals = useMemo(() => {
        const totals: Record<number, number> = {};
        months.forEach((month) => {
            let total = 0;
            tenants.forEach((tenant) => {
                const receipt = paymentData[tenant.id][month.id];
                if (receipt && typeof receipt.amount === 'number') {
                    total += receipt.amount;
                } else if (receipt && typeof receipt.amount === 'string') {
                    total += parseFloat(receipt.amount) || 0;
                }
            });
            totals[month.id] = total || 0;
        });
        return totals;
    }, [tenants, paymentData]);

    const groupedTenants = useMemo(() => {
        const groups: Record<string, { propertyName: string; tenants: Tenant[]; isCustom?: boolean }> = {};

        // Unassigned group
        groups["default"] = {
            propertyName: "Locataires non classés",
            tenants: [],
        };

        // Initialize custom groups
        customGroups.forEach(cg => {
            groups[cg.id] = {
                propertyName: cg.name,
                tenants: [],
                isCustom: true,
            };
        });

        // Assign tenants
        tenants.forEach((tenant) => {
            const customGroup = customGroups.find(cg => cg.tenantIds.includes(tenant.id));
            if (customGroup) {
                groups[customGroup.id].tenants.push(tenant);
            } else {
                groups["default"].tenants.push(tenant);
            }
        });

        // Remove empty custom groups but keep default if it has tenants
        const filteredGroups: typeof groups = {};
        Object.keys(groups).forEach(key => {
            if (groups[key].tenants.length > 0) {
                filteredGroups[key] = groups[key];
            }
        });

        return filteredGroups;
    }, [tenants, customGroups]);

    const handleExport = () => {
        const headers = ["Locataire", "Bien", "Unité", ...months.map(m => m.label), "Total Annuel"];
        const rows = tenants.map(tenant => {
            let annualTotal = 0;
            const monthlyAmounts = months.map(month => {
                const receipt = paymentData[tenant.id][month.id];
                const amount = receipt ? (typeof receipt.amount === 'number' ? receipt.amount : parseFloat(receipt.amount) || 0) : 0;
                annualTotal += amount;
                return amount > 0 ? amount.toString() : "0";
            });
            return [
                tenant.full_name,
                tenant.property_name || "N/A",
                tenant.unit_number || "N/A",
                ...monthlyAmounts,
                annualTotal.toString()
            ];
        });

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Gerance_${selectedYear}.csv`);
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
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="ex: Immeuble A"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                                            />
                                            <Button onClick={handleCreateGroup}>Créer</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Groupes Existants</Label>
                                        {customGroups.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Aucun groupe créé.</p>
                                        ) : (
                                            customGroups.map(group => (
                                                <Card key={group.id} className="p-4 bg-muted/30">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-bold">{group.name}</h3>
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
                            className="flex-1 sm:flex-none"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
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
                {/* Mobile Simplified View */}
                <div className="md:hidden space-y-4 p-4">
                    {Object.entries(groupedTenants).map(([propId, group]) => {
                        const groupTotal = group.tenants.reduce((acc, t) => {
                            let tenantTotal = 0;
                            months.forEach(m => {
                                const r = paymentData[t.id][m.id];
                                if (r) tenantTotal += typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                            });
                            return acc + tenantTotal;
                        }, 0);

                        return (
                            <Card key={`mobile-group-${propId}`} className="p-4 border-l-4 border-l-primary">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            {group.propertyName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {group.tenants.length} Locataire{group.tenants.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs uppercase text-muted-foreground font-semibold">Total Annuel</div>
                                        <div className="font-bold text-primary">{formatCurrency(groupTotal)}</div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Dernière activité</span>
                                        <span className="text-foreground">Ce mois</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">TOTAL GLOBAL {selectedYear}</span>
                            <span className="font-black text-primary text-lg">
                                {formatCurrency(Object.values(monthlyTotals).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Desktop Full View */}
                <ScrollArea className="w-full hidden md:block">
                    <div className="min-w-[1000px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="sticky left-0 bg-muted/50 z-20 w-[200px] border-r">
                                        Locataire
                                    </TableHead>
                                    {months.map((month) => (
                                        <TableHead key={month.id} className="text-center min-w-[80px]">
                                            {month.label}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right font-bold w-[120px]">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(groupedTenants).map(([propId, group]) => (
                                    <>
                                        {/* Property Group Header */}
                                        <TableRow key={`prop-${propId}`} className="bg-muted/20">
                                            <TableCell colSpan={months.length + 2} className="py-2 px-4 font-bold text-primary flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                {group.propertyName}
                                                <Badge variant="outline" className="ml-2 font-normal">
                                                    {group.tenants.length} Locataire{group.tenants.length > 1 ? 's' : ''}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>

                                        {/* Property Tenants */}
                                        {group.tenants.map((tenant) => {
                                            let tenantYearTotal = 0;
                                            return (
                                                <TableRow key={tenant.id} className="hover:bg-muted/30">
                                                    <TableCell className="sticky left-0 bg-white dark:bg-card z-10 font-medium border-r">
                                                        <div className="truncate w-[180px]" title={tenant.full_name}>
                                                            {tenant.full_name}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {tenant.unit_number || 'Unité'}
                                                        </div>
                                                    </TableCell>
                                                    {months.map((month) => {
                                                        const receipt = paymentData[tenant.id][month.id];
                                                        if (receipt) {
                                                            const amount = typeof receipt.amount === 'number' ? receipt.amount : parseFloat(receipt.amount) || 0;
                                                            tenantYearTotal += amount;
                                                        }

                                                        return (
                                                            <TableCell key={month.id} className="text-center p-2">
                                                                {receipt ? (
                                                                    <div className="flex flex-col items-center gap-1 group relative">
                                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                        <span className="text-[10px] font-semibold text-green-700">
                                                                            {(receipt.amount / 1000).toFixed(1).replace(/\.0$/, '')}k
                                                                        </span>
                                                                        {/* Tooltip simple via title */}
                                                                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 shadow-lg border border-white/20">
                                                                            {formatCurrency(receipt.amount)} le {new Date(receipt.payment_date).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-1 opacity-40">
                                                                        <XCircle className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-[10px]">---</span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell className="text-right font-bold text-primary">
                                                        {formatCurrency(tenantYearTotal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {/* Property Subtotal Row */}
                                        <TableRow key={`subtotal-${propId}`} className="bg-primary/5 font-semibold">
                                            <TableCell className="sticky left-0 bg-primary/5 z-10 border-r text-primary">
                                                TOTAL {group.propertyName.toUpperCase()}
                                            </TableCell>
                                            {months.map((month) => {
                                                let groupMonthlyTotal = 0;
                                                group.tenants.forEach(t => {
                                                    const receipt = paymentData[t.id][month.id];
                                                    if (receipt) {
                                                        groupMonthlyTotal += typeof receipt.amount === 'number' ? receipt.amount : parseFloat(receipt.amount) || 0;
                                                    }
                                                });
                                                return (
                                                    <TableCell key={month.id} className="text-center text-primary text-xs">
                                                        {groupMonthlyTotal > 0 ? `${(groupMonthlyTotal / 1000).toFixed(1).replace(/\.0$/, '')}k` : '0'}
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-right text-primary">
                                                {formatCurrency(group.tenants.reduce((acc, t) => {
                                                    let tenantTotal = 0;
                                                    months.forEach(m => {
                                                        const r = paymentData[t.id][m.id];
                                                        if (r) tenantTotal += typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                                                    });
                                                    return acc + tenantTotal;
                                                }, 0))}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                            </TableBody>
                            <TableHeader className="bg-primary/5">
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-primary/5 z-20 font-bold border-r">
                                        TOTAL MENSUEL
                                    </TableHead>
                                    {months.map((month) => (
                                        <TableHead key={month.id} className="text-center font-bold text-xs">
                                            {monthlyTotals[month.id] > 0 ? (
                                                <div className="text-primary">
                                                    {(monthlyTotals[month.id] / 1000).toFixed(1).replace(/\.0$/, '')}k
                                                </div>
                                            ) : (
                                                "0"
                                            )}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right font-black text-primary">
                                        {formatCurrency(Object.values(monthlyTotals).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0))}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card >
    );
};
