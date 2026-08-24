import React, { useState, useMemo, useEffect } from "react";
import XLSX from "xlsx-js-style";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { CheckCircle2, XCircle, Clock, Download, Building2, Plus, Trash2, Users, Save, X, ChevronDown, ChevronRight, Folder, FolderOpen, ArrowLeft, Home, Info, HelpCircle, Lightbulb, Lock, Send, Share2, Check, Edit } from "lucide-react";
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
import { syncPropertyGroups } from "@/lib/api";
import { logFrontendActivity } from "@/api/owner";

interface ManagementTableProps {
    tenants: Tenant[];
    receipts: Receipt[];
    properties: Property[];
    onDeleteTenant?: (tenantId: string) => void;
    selectedYear: string;
    onYearChange: (year: string) => void;
    navigationPath: string[];
    onNavigationChange: (path: string[] | ((prev: string[]) => string[])) => void;
    customGroups: { id: string; name: string; propertyIds: string[]; parentId?: string }[];
    onGroupsChange: (groups: any[] | ((prev: any[]) => any[])) => void;
    groupedData: any[];
    years: number[];
    currency?: string;
    userGroupsKey?: string;
    canSeeRevenue?: boolean;
}

const HierarchicalGroupSelector = ({
    groups,
    value,
    onSelect,
    excludeGroupId,
    isDescendantFn,
    rootLabel = "Aucun (Racine)"
}: {
    groups: { id: string; name: string; propertyIds: string[]; parentId?: string }[];
    value: string;
    onSelect: (groupId: string) => void;
    excludeGroupId?: string;
    isDescendantFn?: (parentId: string, childId: string) => boolean;
    rootLabel?: string;
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
    const displayLabel = value === "root" || value === "none" || !selectedGroup
        ? rootLabel
        : selectedGroup.name;

    const renderTreeNodes = (parentId?: string, depth = 0) => {
        let children = groups.filter(g => (parentId ? g.parentId === parentId : !g.parentId));
        if (excludeGroupId && isDescendantFn) {
            children = children.filter(g => g.id !== excludeGroupId && !isDescendantFn(excludeGroupId, g.id));
        }
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

                            {/* Render sub-folders only when NOT collapsed */}
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
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-9 px-3 text-xs bg-background"
                >
                    <span className="truncate flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5 text-amber-500 fill-amber-100 shrink-0" />
                        <span>{displayLabel}</span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2 bg-popover shadow-lg border rounded-md" align="start">
                <div
                    className="space-y-1 max-h-60 overflow-y-auto overscroll-contain touch-pan-y"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <div
                        onClick={() => {
                            onSelect("root");
                            setOpen(false);
                        }}
                        className={`p-1.5 rounded cursor-pointer text-xs transition-colors ${
                            value === "root" || value === "none"
                                ? "bg-primary/10 font-bold text-primary border border-primary/30"
                                : "hover:bg-muted/80 bg-background border border-transparent"
                        }`}
                    >
                        {rootLabel}
                    </div>

                    {renderTreeNodes(undefined, 0)}
                </div>
            </PopoverContent>
        </Popover>
    );
};

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
    years,
    currency = 'XOF',
    userGroupsKey: propUserGroupsKey,
    canSeeRevenue = true
}: ManagementTableProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { hasFeature, subscription } = useSubscription();
    const isAgent = !!user?.parentId;
    const canExport = hasFeature('excel') && !isAgent; // Export réservé au patron uniquement
    const defaultGroupsKey = useMemo(() => user?.id ? `owner_property_groups_v1_${user.id}` : "owner_property_groups_v1_guest", [user?.id]);
    const userGroupsKey = propUserGroupsKey || defaultGroupsKey;

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [openGroupsInModal, setOpenGroupsInModal] = useState<Record<string, boolean>>({});
    const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupParentId, setNewGroupParentId] = useState<string>("root");
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        title: "",
        description: "",
        onConfirm: () => {},
    });

    const toggleModalGroupExpand = (groupId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setOpenGroupsInModal(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const getFormattedGroupOptions = (
        groups: { id: string; name: string; propertyIds: string[]; parentId?: string }[],
        excludeGroupId?: string
    ) => {
        const result: { id: string; name: string; label: string; depth: number }[] = [];

        const addNodes = (parentId?: string, depth = 0) => {
            let children = groups.filter(g => (parentId ? g.parentId === parentId : !g.parentId));
            if (excludeGroupId) {
                children = children.filter(g => g.id !== excludeGroupId && !isDescendant(excludeGroupId, g.id));
            }
            children.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));

            children.forEach(group => {
                const prefix = depth > 0 ? `${'\u00A0'.repeat(depth * 3)}↳ ` : '';
                result.push({
                    id: group.id,
                    name: group.name,
                    label: `${prefix}📁 ${group.name}`,
                    depth
                });
                addNodes(group.id, depth + 1);
            });
        };

        addNodes(undefined, 0);
        return result;
    };

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

    const saveGroups = async (newGroups: any) => {
        onGroupsChange(newGroups);
        localStorage.setItem(userGroupsKey, JSON.stringify(newGroups));
        try {
            await syncPropertyGroups(newGroups);
        } catch (error) {
            console.error("Failed to synchronize groups with backend:", error);
            toast({
                title: "Erreur de synchronisation",
                description: "Impossible de synchroniser vos dossiers avec le serveur. Les modifications sont enregistrées localement.",
                variant: "destructive",
            });
        }
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now().toString(),
            name: newGroupName.trim(),
            propertyIds: [],
            parentId: newGroupParentId === "root" ? undefined : newGroupParentId,
        };
        saveGroups([...customGroups, newGroup]);

        // Journal d'activité — Création de groupe
        logFrontendActivity({
            action: 'CREATE',
            entityType: 'gerance',
            entityLabel: `Groupe "${newGroupName.trim()}" créé dans Gérance`,
            metadata: { group_name: newGroupName.trim() }
        });

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

    const handleRenameGroup = (groupId: string, newName: string) => {
        if (!newName.trim()) return;
        saveGroups(customGroups.map(g => g.id === groupId ? { ...g, name: newName.trim() } : g));
    };

    const isDescendant = (parentGroupId: string, childGroupId: string): boolean => {
        let current = customGroups.find(g => g.id === childGroupId);
        while (current) {
            if (current.parentId === parentGroupId) return true;
            current = current.parentId ? customGroups.find(g => g.id === current.parentId) : undefined;
        }
        return false;
    };

    const handleMoveGroup = (groupId: string, parentId: string) => {
        saveGroups(customGroups.map(g => 
            g.id === groupId 
                ? { ...g, parentId: parentId === "root" ? undefined : parentId } 
                : g
        ));
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
        setConfirmConfig({
            title: "Supprimer tous les dossiers",
            description: "Êtes-vous sûr de vouloir supprimer TOUS les groupes ? Cette action est irréversible.",
            onConfirm: () => {
                saveGroups([]);
                onNavigationChange([]);
                toast({
                    title: "Dossiers supprimés",
                    description: "Tous les dossiers personnalisés ont été effacés.",
                });
            },
        });
        setConfirmOpen(true);
    };

    const togglePropertyInGroup = (groupId: string, propertyId: string) => {
        saveGroups(customGroups.map(g => {
            if (g.id === groupId) {
                const isIncluded = (g.propertyIds || []).includes(propertyId);
                return {
                    ...g,
                    propertyIds: isIncluded
                        ? (g.propertyIds || []).filter(id => id !== propertyId)
                        : [...(g.propertyIds || []), propertyId]
                };
            }
            // Ensure unique assignment
            return {
                ...g,
                propertyIds: (g.propertyIds || []).filter(id => id !== propertyId)
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


    const shareReceipt = async (tenant: Tenant, receipt: Receipt) => {
        const monthLabel = months.find(m => m.id === Number(receipt.month))?.label || receipt.month;
        const amount = formatCurrency(Number(receipt.amount), currency);
        
        // Texte du message
        const text = `Bonjour ${tenant.full_name}, votre quittance de loyer pour le mois de ${monthLabel} ${receipt.year} (${amount}) est maintenant disponible sur votre compte Samalocation. Vous pouvez la consulter et la télécharger dès maintenant sur https://samalocation.com. Merci pour votre confiance !`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Quittance Samalocation',
                    text: text,
                });
                return;
            } catch (err) {
                console.error("Error sharing:", err);
            }
        }

        // Fallback WhatsApp
        if (!tenant.phone) {
            toast({
                title: "Numéro manquant",
                description: "Le locataire n'a pas de numéro de téléphone renseigné (nécessaire pour WhatsApp).",
                variant: "destructive"
            });
            return;
        }

        const cleanPhone = tenant.phone.replace(/\D/g, '');
        const finalPhone = cleanPhone; // Use the phone as entered, assuming it has a country code or is local to the user's region
        const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };


    const getReceiptsForMonth = (unitId: string, tenant: Tenant | null | undefined, monthId: number) => {
        if (!receipts) return [];
        const year = parseInt(selectedYear);
        
        return receipts.filter(r => {
            const rYear = typeof r.year === 'string' ? parseInt(r.year) : r.year;
            const rMonth = typeof r.month === 'string' ? parseInt(r.month) : r.month;
            
            // Check by year/month first (legacy and standard monthly)
            const matchesMonth = rYear === year && rMonth === monthId;
            
            // Check if receipt period overlaps with this month (for day/week receipts)
            let overlaps = false;
            if (r.start_date && r.end_date) {
                const startDate = new Date(r.start_date);
                const endDate = new Date(r.end_date);
                const monthStart = new Date(year, monthId - 1, 1);
                const monthEnd = new Date(year, monthId, 0);
                
                overlaps = (startDate <= monthEnd && endDate >= monthStart);
            }

            if (!matchesMonth && !overlaps) return false;

            const rUnitId = r.unit_id ? String(r.unit_id) : null;
            const targetUnitId = unitId ? String(unitId) : null;
            
            // Priority 1: Strict unit match if unit_id exists in receipt
            if (rUnitId && targetUnitId) {
                return rUnitId === targetUnitId;
            }

            // Priority 2: Fallback to tenant match only if receipt has no unit_id (legacy)
            if (!rUnitId) {
                const rTenantId = (r as any).tenant_id ? String((r as any).tenant_id) : null;
                const rUserId = (r as any).user_id ? String((r as any).user_id) : null;
                const tId = tenant?.id ? String(tenant.id) : null;
                const tUserId = tenant?.user_id ? String(tenant.user_id) : null;

                if (tId && (rTenantId === tId || rUserId === tId)) return true;
                if (tUserId && (rTenantId === tUserId || rUserId === tUserId)) return true;
            }

            return false;
        });
    };

    const handleExport = () => {
        const monthNames = [
            "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
            "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
        ];

        const grandMonthlyTotals = Array(12).fill(0);
        let grandAnnualTotal = 0;

        const ws_data: any[][] = [];

        // Helper style definitions
        const borderThin = {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
        };

        const createCell = (val: any, style: any) => ({ v: val, s: style });

        // Title Row
        ws_data.push([
            createCell(`RAPPORT DE GÉRANCE FINANCIÈRE - ${selectedYear}`, {
                font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "0B1B3D" } },
                alignment: { horizontal: "left", vertical: "center" }
            })
        ]);

        ws_data.push([
            createCell(`Généré le ${new Date().toLocaleDateString('fr-FR')} | Devise : ${currency}`, {
                font: { italic: true, sz: 10, color: { rgb: "4B5563" } }
            })
        ]);

        ws_data.push([]); // Empty separator

        const processNode = (node: any, pathPrefix = "") => {
            const propertyName = pathPrefix ? `${pathPrefix} > ${node.name}` : node.name;
            const unitsList = node.units || [];

            if (unitsList.length > 0) {
                // Property Group Section Header Row (Blue banner)
                ws_data.push([
                    createCell(`PROPRIÉTÉ / DOSSIER : ${propertyName.toUpperCase()}`, {
                        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "1E3A8A" } },
                        alignment: { horizontal: "left", vertical: "center" }
                    })
                ]);

                // Table Header Row
                const headerRow: any[] = [
                    "UNITÉ / LOCALISATION",
                    "PRÉNOMS & NOMS",
                    "TÉLÉPHONE",
                    ...monthNames,
                    "TOTAL ANNUEL"
                ].map(h => createCell(h, {
                    font: { bold: true, sz: 10, color: { rgb: "1F2937" } },
                    fill: { fgColor: { rgb: "E5E7EB" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: borderThin
                }));
                ws_data.push(headerRow);

                const propertyMonthlyTotals = Array(12).fill(0);
                let propertyAnnualTotal = 0;

                unitsList.forEach(({ unit, tenant }: any) => {
                    let tenantAnnualTotal = 0;
                    const unitName = unit?.unit_number ? `Unité ${unit.unit_number}` : (unit?.name || node.name);
                    const tenantName = tenant ? tenant.full_name : "VACANT / DISPONIBLE";
                    const phone = tenant?.phone || tenant?.contact_phone || "---";

                    const row: any[] = [
                        createCell(unitName, {
                            font: { bold: true, sz: 10, color: { rgb: "111827" } },
                            fill: { fgColor: { rgb: "F9FAFB" } },
                            border: borderThin
                        }),
                        createCell(tenantName, {
                            font: { bold: tenant ? true : false, sz: 10, color: tenant ? { rgb: "111827" } : { rgb: "9CA3AF" } },
                            border: borderThin
                        }),
                        createCell(phone, {
                            font: { sz: 10, color: { rgb: "4B5563" } },
                            alignment: { horizontal: "center" },
                            border: borderThin
                        })
                    ];

                    months.forEach((month, idx) => {
                        const nodeReceipts = getReceiptsForMonth(unit?.id, tenant, month.id);
                        const amount = nodeReceipts.reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0), 0);

                        tenantAnnualTotal += amount;
                        propertyMonthlyTotals[idx] += amount;
                        grandMonthlyTotals[idx] += amount;

                        if (amount > 0) {
                            row.push(createCell(amount, {
                                font: { bold: true, sz: 10, color: { rgb: "065F46" } },
                                fill: { fgColor: { rgb: "ECFDF5" } },
                                alignment: { horizontal: "right" },
                                border: borderThin,
                                z: "#,##0"
                            }));
                        } else {
                            row.push(createCell(0, {
                                font: { sz: 10, color: { rgb: "991B1B" } },
                                fill: { fgColor: { rgb: "FEF2F2" } },
                                alignment: { horizontal: "right" },
                                border: borderThin
                            }));
                        }
                    });

                    propertyAnnualTotal += tenantAnnualTotal;
                    grandAnnualTotal += tenantAnnualTotal;

                    // Tenant Annual Total
                    row.push(createCell(tenantAnnualTotal, {
                        font: { bold: true, sz: 10, color: { rgb: "1F2937" } },
                        fill: { fgColor: { rgb: "F3F4F6" } },
                        alignment: { horizontal: "right" },
                        border: borderThin,
                        z: "#,##0"
                    }));

                    ws_data.push(row);
                });

                // Property TOTAL Row
                const propertyTotalRow: any[] = [
                    createCell(`TOTAL ${node.name.toUpperCase()}`, {
                        font: { bold: true, sz: 10, color: { rgb: "111827" } },
                        fill: { fgColor: { rgb: "D1D5DB" } },
                        border: borderThin
                    }),
                    createCell("", { fill: { fgColor: { rgb: "D1D5DB" } }, border: borderThin }),
                    createCell("", { fill: { fgColor: { rgb: "D1D5DB" } }, border: borderThin })
                ];

                propertyMonthlyTotals.forEach(amt => {
                    propertyTotalRow.push(createCell(amt, {
                        font: { bold: true, sz: 10, color: { rgb: "111827" } },
                        fill: { fgColor: { rgb: "D1D5DB" } },
                        alignment: { horizontal: "right" },
                        border: borderThin,
                        z: "#,##0"
                    }));
                });

                propertyTotalRow.push(createCell(propertyAnnualTotal, {
                    font: { bold: true, sz: 11, color: { rgb: "1E3A8A" } },
                    fill: { fgColor: { rgb: "D1D5DB" } },
                    alignment: { horizontal: "right" },
                    border: borderThin,
                    z: "#,##0"
                }));

                ws_data.push(propertyTotalRow);
                ws_data.push([]); // Separator between properties
            }

            if (node.children) {
                node.children.forEach((child: any) => processNode(child, propertyName));
            }
        };

        (groupedData || []).forEach((node: any) => processNode(node));

        // Grand Total Row (Navy Blue Banner)
        const grandTotalRow: any[] = [
            createCell(`TOTAL MENSUEL PORTAFEUILLE (${selectedYear})`, {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "0B1B3D" } },
                border: borderThin
            }),
            createCell("", { fill: { fgColor: { rgb: "0B1B3D" } }, border: borderThin }),
            createCell("", { fill: { fgColor: { rgb: "0B1B3D" } }, border: borderThin })
        ];

        grandMonthlyTotals.forEach(amt => {
            grandTotalRow.push(createCell(amt, {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "0B1B3D" } },
                alignment: { horizontal: "right" },
                border: borderThin,
                z: "#,##0"
            }));
        });

        grandTotalRow.push(createCell(grandAnnualTotal, {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "0B1B3D" } },
            alignment: { horizontal: "right" },
            border: borderThin,
            z: "#,##0"
        }));

        ws_data.push(grandTotalRow);

        // Create Workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Column widths
        ws["!cols"] = [
            { wch: 24 }, // UNITÉ
            { wch: 28 }, // NOM LOCATAIRE
            { wch: 16 }, // TÉLÉPHONE
            { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
            { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
            { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, // 12 MOIS
            { wch: 18 }  // TOTAL ANNUEL
        ];

        XLSX.utils.book_append_sheet(wb, ws, `Gérance ${selectedYear}`);

        // Write native .xlsx file with styles
        XLSX.writeFile(wb, `Gerance_Samalocation_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);

        // Activity Log
        logFrontendActivity({
            action: "EXPORT",
            entityType: "gerance",
            entityLabel: `Export Excel Gérance ${selectedYear} téléchargé avec styles`,
            metadata: { year: selectedYear, annualTotal: grandAnnualTotal }
        });
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
                                            <HierarchicalGroupSelector
                                                groups={customGroups}
                                                value={newGroupParentId}
                                                onSelect={setNewGroupParentId}
                                                rootLabel="Aucun (Racine)"
                                            />
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
                                            (() => {
                                                const renderGroupCard = (group: any, depth = 0) => {
                                                    const subGroups = customGroups.filter(g => g.parentId === group.id);
                                                    subGroups.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));
                                                    const hasSub = subGroups.length > 0;
                                                    const isCollapsed = !openGroupsInModal[group.id];

                                                    const filteredProperties = properties.filter(property => {
                                                        const isInCurrentGroup = (group.propertyIds || []).includes(property.id);
                                                        const isInOtherGroup = customGroups.some(g => g.id !== group.id && (g.propertyIds || []).includes(property.id));
                                                        return isInCurrentGroup || !isInOtherGroup;
                                                    });

                                                    return (
                                                        <div key={group.id} className={`space-y-2 ${depth > 0 ? "ml-4 border-l-2 border-primary/20 pl-3 mt-2" : ""}`}>
                                                            <Card className={`p-4 transition-all ${depth > 0 ? "bg-background/80 border-primary/20" : "bg-muted/30"}`}>
                                                                <div className="flex items-center justify-between mb-4">
                                                                    {editingGroupId === group.id ? (
                                                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                                                            <Input
                                                                                className="h-8 py-1 text-sm font-medium"
                                                                                value={editingGroupName}
                                                                                onChange={(e) => setEditingGroupName(e.target.value)}
                                                                                onBlur={() => {
                                                                                    handleRenameGroup(group.id, editingGroupName);
                                                                                    setEditingGroupId(null);
                                                                                }}
                                                                                onKeyPress={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        handleRenameGroup(group.id, editingGroupName);
                                                                                        setEditingGroupId(null);
                                                                                    }
                                                                                }}
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex-1 mr-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {hasSub ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => toggleModalGroupExpand(group.id, e)}
                                                                                        className="p-1 hover:bg-muted rounded transition-colors text-primary"
                                                                                        title={isCollapsed ? "Afficher les sous-dossiers" : "Masquer les sous-dossiers"}
                                                                                    >
                                                                                        {isCollapsed ? (
                                                                                            <ChevronRight className="h-4 w-4 text-primary font-bold" />
                                                                                        ) : (
                                                                                            <ChevronDown className="h-4 w-4 text-primary font-bold" />
                                                                                        )}
                                                                                    </button>
                                                                                ) : depth > 0 ? (
                                                                                    <span className="text-xs text-muted-foreground font-mono">↳</span>
                                                                                ) : null}

                                                                                <h3 className="font-bold flex items-center gap-1.5">
                                                                                    <span>{group.name}</span>
                                                                                    {hasSub && (
                                                                                        <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                                                                                            {subGroups.length} sous-dossier{subGroups.length > 1 ? 's' : ''}
                                                                                        </span>
                                                                                    )}
                                                                                </h3>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6 text-muted-foreground hover:text-primary ml-1"
                                                                                    onClick={() => {
                                                                                        setEditingGroupId(group.id);
                                                                                        setEditingGroupName(group.name);
                                                                                    }}
                                                                                >
                                                                                    <Edit className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 mt-1.5 max-w-[200px]">
                                                                                 <span className="text-[10px] text-muted-foreground font-medium shrink-0">Déplacer dans :</span>
                                                                                 <HierarchicalGroupSelector
                                                                                     groups={customGroups}
                                                                                     value={group.parentId || "root"}
                                                                                     onSelect={(val) => handleMoveGroup(group.id, val)}
                                                                                     excludeGroupId={group.id}
                                                                                     isDescendantFn={isDescendant}
                                                                                     rootLabel="Aucun (Racine)"
                                                                                 />
                                                                             </div>
                                                                        </div>
                                                                    )}
                                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {filteredProperties.length === 0 ? (
                                                                        <p className="text-xs text-muted-foreground italic col-span-2">
                                                                            Aucun bien disponible à ajouter.
                                                                        </p>
                                                                    ) : (
                                                                        filteredProperties.map(property => (
                                                                            <div key={property.id} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={`${group.id}-${property.id}`}
                                                                                    checked={(group.propertyIds || []).includes(property.id)}
                                                                                    onCheckedChange={() => togglePropertyInGroup(group.id, property.id)}
                                                                                />
                                                                                <label
                                                                                    htmlFor={`${group.id}-${property.id}`}
                                                                                    className="text-sm font-medium leading-none cursor-pointer truncate"
                                                                                    title={property.name}
                                                                                >
                                                                                    {property.name}
                                                                                </label>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </Card>

                                                            {/* Render sub-groups if expanded */}
                                                            {hasSub && !isCollapsed && (
                                                                <div className="space-y-2">
                                                                    {subGroups.map(subGroup => renderGroupCard(subGroup, depth + 1))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                const rootGroups = customGroups.filter(g => !g.parentId);
                                                rootGroups.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }));
                                                return rootGroups.map(group => renderGroupCard(group, 0));
                                            })()
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
                            title={
                                isAgent
                                    ? "L'export Excel est réservé au patron de l'agence"
                                    : !canExport
                                        ? "L'export Excel est réservé aux comptes Professionnel (Entreprise)"
                                        : "Exporter les données en CSV"
                            }
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
                            Regroupez vos logements par bâtiment ou par zone géographique pour une meilleure visibilité.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] bg-white/50 px-3 py-2 rounded border border-primary/5 shrink-0">
                        <div className="flex items-center gap-1">
                            <Folder className="h-3 w-3 text-amber-500 fill-amber-100" />
                            <span className="font-bold">Immeuble Horizon</span>
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
                                                        const nodeReceipts = getReceiptsForMonth(unit?.id, tenant, m.id);
                                                         nodeReceipts.forEach(r => {
                                                             const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                                                             total += amount;
                                                             monthly[m.id] += amount;
                                                         });
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
                                                                        {canSeeRevenue ? formatCurrency(stats.total, currency) : "🔒"}
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
                                                                        {node.listing_type === 'vente' && (
                                                                            <Badge variant="destructive" className="ml-2 text-[8px] h-3.5 px-1.5 uppercase font-black">Vente</Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-muted-foreground">
                                                                        {canSeeRevenue ? formatCurrency(stats.total, currency) : "🔒"}
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
                                                                                        setConfirmConfig({
                                                                                            title: "Supprimer le locataire",
                                                                                            description: `⚠️ ATTENTION : Voulez-vous vraiment supprimer le locataire ${u.tenant.full_name} ?\n\nCette action retirera le locataire de cette unité et supprimera ses accès.`,
                                                                                            onConfirm: () => {
                                                                                                onDeleteTenant(u.tenant.id);
                                                                                            }
                                                                                        });
                                                                                        setConfirmOpen(true);
                                                                                    }}
                                                                                    title="Supprimer le locataire"
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    {months.map((month) => {
                                                                        const nodeReceipts = getReceiptsForMonth(u.unit?.id, u.tenant, month.id);
                                                                         const monthAmount = nodeReceipts.reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0), 0);
                                                                         tenantYearTotal += monthAmount;

                                                                        return (
                                                                            <TableCell key={month.id} className="text-center p-2">
                                                                                {nodeReceipts.length > 0 ? (
                                                                                    <div className="flex flex-col items-center gap-0.5 group relative">
                                                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                                        <span className="text-[9px] font-semibold text-green-700">
                                                                                            {canSeeRevenue ? `${(monthAmount / 1000).toFixed(1).replace(/\.0$/, '')}k` : "🔒"}
                                                                                        </span>
                                                                                        
                                                                                        {/* Action Buttons */}
                                                                                        <div className="hidden group-hover:flex absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-border shadow-strong rounded-lg p-1.5 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                                                                            <button 
                                                                                                onClick={() => shareReceipt(u.tenant, nodeReceipts[0])}
                                                                                                className="p-1 px-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-md flex items-center gap-1.5 transition-all border border-primary/10 shadow-sm"
                                                                                                title="Partager la quittance"
                                                                                            >
                                                                                                <Share2 className="h-3.5 w-3.5" />
                                                                                                <span className="text-[10px] font-black uppercase tracking-wider">Partager</span>
                                                                                            </button>
                                                                                            <div className="w-[1px] h-3 bg-border mx-1"></div>
                                                                                            <span className="text-[10px] font-bold text-primary px-1">
                                                                                                {canSeeRevenue ? formatCurrency(monthAmount, currency) : "🔒"}
                                                                                            </span>
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
                                                                        {canSeeRevenue ? formatCurrency(tenantYearTotal, currency) : "🔒"}
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
                                                            const nodeReceipts = getReceiptsForMonth(unit?.id, tenant, month.id);
                                                            nodeReceipts.forEach(r => total += (typeof r.amount === "number" ? r.amount : parseFloat(r.amount) || 0));
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
                                                    {canSeeRevenue ? (
                                                        folderMonthlyTotal > 0 ? (
                                                            <div>
                                                                {(folderMonthlyTotal / 1000).toFixed(1).replace(/\.0$/, '')}k
                                                            </div>
                                                        ) : (
                                                            "0"
                                                        )
                                                    ) : (
                                                        "🔒"
                                                    )}
                                                </TableHead>
                                            );
                                        })}
                                        <TableHead className="text-right font-black text-white py-3">
                                            {(() => {
                                                if (!canSeeRevenue) return "🔒";
                                                const currentNodes = getCurrentNodes();
                                                const calculateGrandTotal = (nodes: any[]): number => {
                                                    let total = 0;
                                                    nodes.forEach(n => {
                                                        if (n.type === 'property') {
                                                            (n.units || []).forEach(({ unit, tenant }: any) => {
                                                                months.forEach(m => {
                                                                    const nodeReceipts = getReceiptsForMonth(unit?.id, tenant, m.id);
                                                                    nodeReceipts.forEach(r => {
                                                                        total += (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0);
                                                                    });
                                                                });
                                                            });
                                                        } else {
                                                            total += calculateGrandTotal(n.children || []);
                                                        }
                                                    });
                                                    return total;
                                                };
                                                return formatCurrency(calculateGrandTotal(currentNodes), currency);
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
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={confirmConfig.title}
                description={confirmConfig.description}
                onConfirm={confirmConfig.onConfirm}
            />
        </Card>
    );
};
