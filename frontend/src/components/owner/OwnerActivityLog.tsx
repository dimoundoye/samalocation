import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
    History, FileText, Home, Users, Receipt, Wrench,
    MessageSquare, FolderOpen, Settings, UserCheck,
    Loader2, ChevronLeft, ChevronRight, Filter,
    Download, Plus, Trash2, Eye, Send, UserPlus,
    UserMinus, Star, RefreshCw, Building2
} from "lucide-react";
import { getActivityLog, getCollaborators } from "@/api/owner";

// ─── Config des types d'entités ─────────────────────────────────────────────
const ENTITY_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    tenant:      { label: "Locataire",         icon: Users,        color: "text-violet-600",  bg: "bg-violet-100 dark:bg-violet-900/30" },
    receipt:     { label: "Reçus & Loyers",    icon: Receipt,      color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    contract:    { label: "Document",          icon: FileText,     color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/30" },
    property:    { label: "Mes Biens",         icon: Home,         color: "text-orange-600",  bg: "bg-orange-100 dark:bg-orange-900/30" },
    maintenance: { label: "Maintenance",       icon: Wrench,       color: "text-amber-600",   bg: "bg-amber-100 dark:bg-amber-900/30" },
    message:     { label: "Messages",          icon: MessageSquare,color: "text-sky-600",     bg: "bg-sky-100 dark:bg-sky-900/30" },
    dossier:     { label: "Dossiers Partagés", icon: FolderOpen,   color: "text-pink-600",    bg: "bg-pink-100 dark:bg-pink-900/30" },
    gerance:     { label: "Gérance",           icon: Building2,    color: "text-teal-600",    bg: "bg-teal-100 dark:bg-teal-900/30" },
    settings:    { label: "Paramètres",        icon: Settings,     color: "text-slate-600",   bg: "bg-slate-100 dark:bg-slate-900/30" },
    team:        { label: "Équipe",            icon: UserCheck,    color: "text-indigo-600",  bg: "bg-indigo-100 dark:bg-indigo-900/30" },
    profile:     { label: "Profil Public",     icon: Star,         color: "text-yellow-600",  bg: "bg-yellow-100 dark:bg-yellow-900/30" },
};

// ─── Config des actions ──────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    CREATE:   { label: "Ajout",          icon: Plus,      color: "text-emerald-500" },
    UPDATE:   { label: "Modification",   icon: Settings,  color: "text-blue-500" },
    DELETE:   { label: "Suppression",    icon: Trash2,    color: "text-red-500" },
    GENERATE: { label: "Émission",       icon: Receipt,   color: "text-purple-500" },
    EXPORT:   { label: "Export",         icon: Download,  color: "text-teal-500" },
    VIEW:     { label: "Consultation",   icon: Eye,       color: "text-slate-500" },
    SEND:     { label: "Envoi",          icon: Send,      color: "text-sky-500" },
    INVITE:   { label: "Invitation",     icon: UserPlus,  color: "text-indigo-500" },
    REMOVE:   { label: "Retrait",        icon: UserMinus, color: "text-red-500" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const getInitials = (name: string) => name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const AVATAR_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
    "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-amber-500",
];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ─── Composant LogItem ────────────────────────────────────────────────────────
const LogItem = ({ log, index }: { log: any; index: number }) => {
    const entity = ENTITY_CONFIG[log.entity_type] || ENTITY_CONFIG.settings;
    const action = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
    const EntityIcon = entity.icon;
    const ActionIcon = action.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group"
        >
            {/* Avatar acteur */}
            <Avatar className={`h-9 w-9 shrink-0 ${getAvatarColor(log.actor_name)}`}>
                <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                    {getInitials(log.actor_name)}
                </AvatarFallback>
            </Avatar>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Nom de l'acteur */}
                        <span className="text-sm font-semibold text-foreground">{log.actor_name}</span>
                        {/* Badge rôle */}
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${log.actor_role === 'agent' ? 'border-indigo-300 text-indigo-600' : 'border-slate-300 text-slate-600'}`}>
                            {log.actor_role === 'agent' ? 'Agent' : 'Patron'}
                        </Badge>
                    </div>
                    {/* Date */}
                    <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(log.created_at)}</span>
                </div>

                {/* Description de l'action */}
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {log.entity_label}
                </p>

                {/* Badges type et action */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Onglet concerné */}
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${entity.bg} ${entity.color}`}>
                        <EntityIcon className="h-3 w-3" />
                        {entity.label}
                    </span>
                    {/* Type d'action */}
                    <span className={`inline-flex items-center gap-1 text-[11px] ${action.color}`}>
                        <ActionIcon className="h-3 w-3" />
                        {action.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Vue Détaillée Complète ───────────────────────────────────────────────────
export const FullActivityLogView = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, current_page: 1 });
    const [filters, setFilters] = useState({
        actor_id: 'all',
        entity_type: 'all',
        page: 1
    });

    useEffect(() => {
        const loadCollaborators = async () => {
            try {
                const data = await getCollaborators();
                setCollaborators(data || []);
            } catch (err) {
                console.error('Erreur chargement collaborateurs:', err);
            }
        };
        loadCollaborators();
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page: filters.page, limit: 20 };
            if (filters.actor_id !== 'all') params.actor_id = filters.actor_id;
            if (filters.entity_type !== 'all') params.entity_type = filters.entity_type;

            const result = await getActivityLog(params);
            if (result) {
                setLogs(result.logs || []);
                setPagination(result.pagination || { total: 0, pages: 1, current_page: 1 });
            }
        } catch (error) {
            console.error('Erreur chargement journal:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="flex items-center gap-3 flex-wrap bg-muted/30 p-3 rounded-xl border">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Filtre par agent */}
                <Select value={filters.actor_id} onValueChange={(v) => handleFilterChange('actor_id', v)}>
                    <SelectTrigger className="w-44 h-9 text-xs rounded-xl bg-background">
                        <SelectValue placeholder="Tous les agents" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les membres</SelectItem>
                        {collaborators.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filtre par onglet */}
                <Select value={filters.entity_type} onValueChange={(v) => handleFilterChange('entity_type', v)}>
                    <SelectTrigger className="w-44 h-9 text-xs rounded-xl bg-background">
                        <SelectValue placeholder="Tous les onglets" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les onglets</SelectItem>
                        {Array.from(new Set(Object.values(ENTITY_CONFIG).map(cfg => cfg.label))).map((label) => {
                            const key = Object.keys(ENTITY_CONFIG).find(k => ENTITY_CONFIG[k].label === label);
                            return (
                                <SelectItem key={key} value={key || "all"}>{label}</SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5 h-9 rounded-xl ml-auto text-xs">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* Logs List */}
            <div className="border rounded-2xl bg-card p-2 min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-bold text-foreground">Aucune action trouvée</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Modifiez vos filtres ou actualisez la page.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto pr-1">
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <LogItem key={log.id} log={log} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && !loading && (
                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                        Page {pagination.current_page} sur {pagination.pages} ({pagination.total} actions au total)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline" size="sm"
                            className="rounded-xl h-8 text-xs"
                            disabled={filters.page <= 1}
                            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="rounded-xl h-8 text-xs"
                            disabled={filters.page >= pagination.pages}
                            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Composant Principal (Aperçu + Redirection) ────────────────────────────────
export const OwnerActivityLog = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const navigate = useNavigate();

    const fetchPreviewLogs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getActivityLog({ page: 1, limit: 5 });
            if (result) {
                setLogs(result.logs || []);
                setTotalCount(result.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Erreur chargement aperçu journal:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreviewLogs();
    }, [fetchPreviewLogs]);

    return (
        <Card className="border shadow-soft rounded-2xl">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                        <History className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold">Dernières activités de l'équipe</CardTitle>
                        <CardDescription className="text-[11px] mt-0.5">
                            Les 5 dernières actions effectuées par vos collaborateurs
                        </CardDescription>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchPreviewLogs} 
                    disabled={loading} 
                    className="gap-1.5 h-8 text-[11px] rounded-xl"
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground p-4">
                        <History className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-semibold">Aucune activité récente</p>
                    </div>
                ) : (
                    <div>
                        <div className="divide-y divide-border/50">
                            <AnimatePresence>
                                {logs.map((log, i) => (
                                    <LogItem key={log.id} log={log} index={i} />
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <div className="p-4 border-t flex justify-center bg-muted/10">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full sm:w-auto text-xs font-bold gap-1 rounded-xl shadow-sm h-9 px-4"
                                onClick={() => navigate("/owner-dashboard/team/history")}
                            >
                                Voir tout l'historique ({totalCount})
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
