import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, CreditCard, ExternalLink, History, Loader2, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAdminSubscriptions, updateUserSubscription } from "@/lib/api";

interface SubscriberBase {
  id: string;
  user_id: string;
  plan_name: string;
  price: string | number | null;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  user_role: string;
  company_name: string | null;
}
interface ActiveSub extends SubscriberBase { payment_method: string | null; created_at: string; expires_at: string | null }
interface PendingSub extends SubscriberBase { payment_method: string | null; transaction_id: string | null; sender_phone: string | null; receipt_url: string | null; created_at: string }
interface ExpiredSub extends SubscriberBase { expires_at: string }
interface Overview { active: ActiveSub[]; pending: PendingSub[]; recently_expired: ExpiredSub[] }

type PlanKey = "PREMIUM" | "PROFESSIONAL";
type StateFilter = "all" | "soon" | "grace";

const DAY = 24 * 3600 * 1000;
const SOON_DAYS = 7;
// Mêmes tarifs que backend/src/config/plans.js
const PLAN_PRICES: Record<PlanKey, { monthly: number; annual: number }> = {
  PREMIUM: { monthly: 5000, annual: 54000 },
  PROFESSIONAL: { monthly: 15000, annual: 162000 },
};

const planKey = (name: string): PlanKey => (/^PROF/i.test(name || "") ? "PROFESSIONAL" : "PREMIUM");
const planLabel = (name: string) => (planKey(name) === "PROFESSIONAL" ? "Professionnel" : "Premium");
const defaultPrice = (plan: PlanKey, days: number) =>
  days >= 365 ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly * Math.round(days / 30);
const fmtMoney = (v: string | number | null) => {
  const n = Number(v || 0);
  return n === 0 ? "Offert" : `${new Intl.NumberFormat("fr-FR").format(n)} F CFA`;
};
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
const daysLeft = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / DAY) : null);

const PlanBadge = ({ name }: { name: string }) =>
  planKey(name) === "PROFESSIONAL" ? (
    <Badge className="bg-primary text-primary-foreground hover:bg-primary">Professionnel</Badge>
  ) : (
    <Badge variant="secondary">Premium</Badge>
  );

const Who = ({ s }: { s: SubscriberBase }) => (
  <div className="min-w-0">
    <p className="font-semibold truncate">{s.user_name || "—"}</p>
    {s.company_name && s.company_name !== s.user_name && <p className="text-xs text-muted-foreground truncate">{s.company_name}</p>}
    <p className="text-xs text-muted-foreground truncate">{s.user_email}{s.user_phone ? ` · ${s.user_phone}` : ""}</p>
  </div>
);

const Expiry = ({ date }: { date: string | null }) => {
  const left = daysLeft(date);
  if (left === null) return <span className="text-muted-foreground">Sans échéance</span>;
  return (
    <div>
      <p className="font-medium">{fmtDate(date)}</p>
      {left < 0 ? (
        <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Échu depuis {Math.abs(left)} j · délai de grâce
        </p>
      ) : left <= SOON_DAYS ? (
        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {left === 0 ? "Expire aujourd'hui" : `Expire dans ${left} j`}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">dans {left} jours</p>
      )}
    </div>
  );
};

const AdminSubscriptionsTab = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | PlanKey>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  // Prolonger / modifier
  const [editing, setEditing] = useState<ActiveSub | ExpiredSub | null>(null);
  const [form, setForm] = useState({ plan: "PREMIUM" as PlanKey, days: 30, price: 5000, offered: false });
  // Mettre fin / refuser
  const [ending, setEnding] = useState<ActiveSub | null>(null);
  const [rejecting, setRejecting] = useState<PendingSub | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getAdminSubscriptions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les abonnements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => data?.active || [], [data]);
  const stats = useMemo(() => ({
    total: active.length,
    premium: active.filter(s => planKey(s.plan_name) === "PREMIUM").length,
    pro: active.filter(s => planKey(s.plan_name) === "PROFESSIONAL").length,
    soon: active.filter(s => { const l = daysLeft(s.expires_at); return l !== null && l >= 0 && l <= SOON_DAYS; }).length,
    grace: active.filter(s => { const l = daysLeft(s.expires_at); return l !== null && l < 0; }).length,
  }), [active]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter(s => {
      if (planFilter !== "all" && planKey(s.plan_name) !== planFilter) return false;
      const l = daysLeft(s.expires_at);
      if (stateFilter === "soon" && !(l !== null && l >= 0 && l <= SOON_DAYS)) return false;
      if (stateFilter === "grace" && !(l !== null && l < 0)) return false;
      if (!q) return true;
      return [s.user_name, s.user_email, s.user_phone, s.company_name].some(v => v?.toLowerCase().includes(q));
    });
  }, [active, search, planFilter, stateFilter]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true);
    try {
      await action();
      toast({ title: success });
      setEditing(null);
      setEnding(null);
      setRejecting(null);
      setReason("");
      await load();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Action impossible.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: ActiveSub | ExpiredSub) => {
    const plan = planKey(s.plan_name);
    setForm({ plan, days: 30, price: defaultPrice(plan, 30), offered: false });
    setEditing(s);
  };

  const setFormPlanOrDays = (plan: PlanKey, days: number) =>
    setForm(f => ({ ...f, plan, days, price: f.offered ? 0 : defaultPrice(plan, days) }));

  const approve = (p: PendingSub) => {
    // Même règle que l'onglet Finances : un montant annuel donne 365 jours
    const days = Number(p.price) >= 50000 ? 365 : 30;
    return run(
      () => updateUserSubscription(p.user_id, { planName: p.plan_name, status: "active", durationDays: days, price: Number(p.price), subscriptionId: p.id }),
      `Abonnement de ${p.user_name} activé`
    );
  };

  const selectClass = "h-9 rounded-md border bg-background px-2 text-sm";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-primary" />
            Abonnements
          </h1>
          <p className="text-sm text-muted-foreground">Abonnés actifs, échéances, demandes à valider et abonnements à relancer.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2 self-start md:self-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {!data && !error ? (
        <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : data && (
        <>
          {/* Chiffres clés */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { label: "Abonnés actifs", value: stats.total, hint: `${stats.premium} Premium · ${stats.pro} Professionnel` },
              { label: "Premium", value: stats.premium, hint: "en cours" },
              { label: "Professionnel", value: stats.pro, hint: "en cours" },
              { label: `Expirent sous ${SOON_DAYS} jours`, value: stats.soon, hint: stats.grace ? `+ ${stats.grace} en délai de grâce` : "à surveiller", tone: stats.soon || stats.grace ? "warn" : undefined },
              { label: "Demandes à valider", value: data.pending.length, hint: "paiements déclarés", tone: data.pending.length ? "warn" : undefined },
            ].map(k => (
              <Card key={k.label} className={`shadow-soft ${k.tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
                <CardContent className="p-4 md:p-5">
                  <p className="text-xs font-semibold text-muted-foreground">{k.label}</p>
                  <p className="text-2xl md:text-3xl font-black mt-2 tabular-nums">{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{k.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demandes en attente */}
          {data.pending.length > 0 && (
            <Card className="shadow-soft border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Demandes à valider ({data.pending.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Reçue le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pending.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-[240px]"><Who s={p} /></TableCell>
                        <TableCell><PlanBadge name={p.plan_name} /></TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">{fmtMoney(p.price)}</TableCell>
                        <TableCell className="text-xs">
                          <p>{p.payment_method || "Wave"}{p.sender_phone ? ` · ${p.sender_phone}` : ""}</p>
                          {p.transaction_id && <p className="font-mono text-muted-foreground">{p.transaction_id}</p>}
                          {p.receipt_url && (
                            <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                              Justificatif <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(p.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="gap-1" disabled={saving} onClick={() => approve(p)}>
                              <CheckCircle2 className="h-4 w-4" /> Valider
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-destructive" disabled={saving} onClick={() => { setReason(""); setRejecting(p); }}>
                              <XCircle className="h-4 w-4" /> Refuser
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Abonnés actifs */}
          <Card className="shadow-soft">
            <CardHeader className="pb-3 space-y-3">
              <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Abonnés actifs ({filtered.length})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, e-mail, téléphone, agence…" className="pl-8 h-9" />
                </div>
                <select className={selectClass} value={planFilter} onChange={e => setPlanFilter(e.target.value as "all" | PlanKey)} aria-label="Filtrer par plan">
                  <option value="all">Tous les plans</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PROFESSIONAL">Professionnel</option>
                </select>
                <select className={selectClass} value={stateFilter} onChange={e => setStateFilter(e.target.value as StateFilter)} aria-label="Filtrer par échéance">
                  <option value="all">Toutes les échéances</option>
                  <option value="soon">Expirent sous {SOON_DAYS} jours</option>
                  <option value="grace">En délai de grâce</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Abonné</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden xl:table-cell">Depuis</TableHead>
                    <TableHead>Expire le</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                        {active.length === 0 ? "Aucun abonnement actif pour le moment." : "Aucun abonné ne correspond à ces filtres."}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-[220px]"><Who s={s} /></TableCell>
                      <TableCell><PlanBadge name={s.plan_name} /></TableCell>
                      <TableCell className="hidden xl:table-cell whitespace-nowrap text-sm">{fmtDate(s.created_at)}</TableCell>
                      <TableCell className="whitespace-nowrap"><Expiry date={s.expires_at} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtMoney(s.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={saving} onClick={() => openEdit(s)}>Prolonger</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" disabled={saving} onClick={() => { setReason(""); setEnding(s); }}>Mettre fin</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* À relancer */}
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">À relancer ({data.recently_expired.length})</CardTitle>
              <p className="text-xs text-muted-foreground">Abonnements échus ces 60 derniers jours, non renouvelés.</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Ancien plan</TableHead>
                    <TableHead>Échu le</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recently_expired.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">Aucun abonnement échu récemment.</TableCell>
                    </TableRow>
                  ) : data.recently_expired.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-[260px]"><Who s={s} /></TableCell>
                      <TableCell><PlanBadge name={s.plan_name} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(s.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => openEdit(s)}>Réactiver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Prolonger / réactiver */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing && "created_at" in editing ? "Prolonger l'abonnement" : "Réactiver l'abonnement"}</DialogTitle>
            <DialogDescription>{editing?.user_name} · {editing?.user_email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={v => setFormPlanOrDays(v as PlanKey, form.days)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professionnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Durée</Label>
                <Select value={String(form.days)} onValueChange={v => setFormPlanOrDays(form.plan, Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">1 mois</SelectItem>
                    <SelectItem value="90">3 mois</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-price">Montant payé (F CFA)</Label>
              <Input id="sub-price" type="number" min={0} value={form.price} disabled={form.offered}
                onChange={e => setForm(f => ({ ...f, price: Math.max(0, Number(e.target.value) || 0) }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.offered}
                  onChange={e => setForm(f => ({ ...f, offered: e.target.checked, price: e.target.checked ? 0 : defaultPrice(f.plan, f.days) }))} />
                Offert (aucun paiement)
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Même plan : la durée s'ajoute à l'échéance actuelle. Plan supérieur : il démarre aujourd'hui. Un plan inférieur ne peut pas remplacer un abonnement encore en cours.
              {editing && planLabel(editing.plan_name) !== (form.plan === "PROFESSIONAL" ? "Professionnel" : "Premium") && " Le plan va changer."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Annuler</Button>
            <Button disabled={saving} onClick={() => editing && run(
              () => updateUserSubscription(editing.user_id, { planName: form.plan, status: "active", durationDays: form.days, price: form.offered ? 0 : form.price }),
              `Abonnement de ${editing.user_name} mis à jour`
            )}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mettre fin */}
      <Dialog open={!!ending} onOpenChange={open => !open && setEnding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mettre fin à l'abonnement ?</DialogTitle>
            <DialogDescription>
              {ending?.user_name} repassera immédiatement au plan Gratuit et sera prévenu dans sa cloche. Cette action ne rembourse rien.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="end-reason">Motif (facultatif)</Label>
            <Textarea id="end-reason" value={reason} onChange={e => setReason(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnding(null)} disabled={saving}>Annuler</Button>
            <Button variant="destructive" disabled={saving} onClick={() => ending && run(
              () => updateUserSubscription(ending.user_id, { planName: ending.plan_name, status: "expired", subscriptionId: ending.id, reason: reason.trim() || undefined }),
              `Abonnement de ${ending.user_name} arrêté`
            )}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Mettre fin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refuser une demande */}
      <Dialog open={!!rejecting} onOpenChange={open => !open && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>{rejecting?.user_name} recevra le motif dans sa cloche.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Motif</Label>
            <Textarea id="reject-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Ex. : transaction introuvable, montant incorrect…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={saving}>Annuler</Button>
            <Button variant="destructive" disabled={saving || !reason.trim()} onClick={() => rejecting && run(
              () => updateUserSubscription(rejecting.user_id, { planName: rejecting.plan_name, status: "rejected", subscriptionId: rejecting.id, reason: reason.trim() }),
              "Demande refusée"
            )}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionsTab;

