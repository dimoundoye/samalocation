import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Loader2, ScrollText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminAuditLogs } from "@/lib/api";

interface AuditEntry {
  id: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTIONS: Record<string, { label: string; tone?: "danger" | "warn" }> = {
  force_withdrawal: { label: "Virement forcé du solde", tone: "danger" },
  force_withdrawal_denied: { label: "Virement forcé refusé (mot de passe incorrect)", tone: "warn" },
  user_block: { label: "Blocage d'un utilisateur", tone: "warn" },
  user_unblock: { label: "Déblocage d'un utilisateur" },
  user_delete: { label: "Suppression d'un utilisateur", tone: "danger" },
  subscription_active: { label: "Abonnement activé ou prolongé" },
  subscription_expired: { label: "Abonnement arrêté", tone: "warn" },
  subscription_rejected: { label: "Demande d'abonnement refusée" },
  verification_approve: { label: "Identité vérifiée" },
  verification_reject: { label: "Vérification d'identité rejetée", tone: "warn" },
  setting_update: { label: "Paramètre modifié" },
};

// Regroupement des actions pour le filtre
const CATEGORIES: { key: string; label: string; match: (action: string) => boolean }[] = [
  { key: "all", label: "Toutes les actions", match: () => true },
  { key: "money", label: "Virements forcés", match: a => a.startsWith("force_withdrawal") },
  { key: "users", label: "Comptes (blocage, suppression)", match: a => a.startsWith("user_") },
  { key: "subscriptions", label: "Abonnements", match: a => a.startsWith("subscription_") },
  { key: "verifications", label: "Vérifications d'identité", match: a => a.startsWith("verification_") },
  { key: "settings", label: "Paramètres", match: a => a === "setting_update" },
  { key: "sensitive", label: "Actions sensibles uniquement", match: a => ["danger", "warn"].includes(ACTIONS[a]?.tone || "") },
];

const PAGE_SIZE = 100;
const MAX_ENTRIES = 500;

const describe = (e: AuditEntry) => {
  const d = e.details || {};
  const parts: string[] = [];
  if (typeof d.amount === "number") parts.push(`${new Intl.NumberFormat("fr-FR").format(d.amount)} F CFA`);
  if (d.phone) parts.push(`vers ${d.phone}${d.custom_phone ? " (numéro saisi)" : ""}`);
  if (d.plan) parts.push(String(d.plan));
  if (d.duration_days) parts.push(`${d.duration_days} jours`);
  if (d.reason) parts.push(`motif : ${d.reason}`);
  if (e.action === "setting_update" && e.target_label) parts.push(e.target_label);
  return parts.join(" · ");
};

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await getAdminAuditLogs(limit));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger le journal.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const match = CATEGORIES.find(c => c.key === category)?.match || (() => true);
    const q = search.trim().toLowerCase();
    return (entries || []).filter(e => {
      if (!match(e.action)) return false;
      if (!q) return true;
      return [e.admin_name, e.target_label, ACTIONS[e.action]?.label || e.action, describe(e)].some(v => v?.toLowerCase().includes(q));
    });
  }, [entries, category, search]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <ScrollText className="h-7 w-7 text-primary" />
            Journal des actions
          </h1>
          <p className="text-sm text-muted-foreground">
            Qui a fait quoi dans l'administration : virements forcés, abonnements, blocages, suppressions, vérifications d'identité et paramètres.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start md:self-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <Card className="shadow-soft">
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-base">
          {entries ? `${filtered.length} action(s)` : "Actions"}
          {entries && entries.length >= limit ? ` parmi les ${limit} plus récentes` : ""}
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Admin, personne concernée, montant, motif…" className="pl-8 h-9" />
          </div>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filtrer par type d'action">
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : !entries ? (
          <div className="py-8 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Concerne</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                    {entries.length === 0 ? "Aucune action enregistrée pour le moment." : "Aucune action ne correspond à ces filtres."}
                  </TableCell>
                </TableRow>
              ) : filtered.map(e => {
                const meta = ACTIONS[e.action] || { label: e.action };
                return (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(e.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm">{e.admin_name || "—"}</TableCell>
                    <TableCell className={`text-sm font-medium ${meta.tone === "danger" ? "text-red-600" : meta.tone === "warn" ? "text-amber-600" : ""}`}>{meta.label}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{e.action === "setting_update" ? "Plateforme" : e.target_label || e.target_id || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[320px]">{describe(e)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {entries && entries.length >= limit && limit < MAX_ENTRIES && (
          <div className="p-4 border-t flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setLimit(l => Math.min(l + PAGE_SIZE * 2, MAX_ENTRIES))} disabled={loading}>
              Afficher plus d'actions
            </Button>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
