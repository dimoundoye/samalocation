import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Ban, CheckCircle, Clock, Shield } from "lucide-react";
import { getAllReports, getReportStatistics, updateReport, blockUser, unblockUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Report } from "@/types";

export const ReportsManagement = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const [reportsData, statsData] = await Promise.all([
        getAllReports(filters),
        getReportStatistics()
      ]);

      setReports(reportsData);
      setStatistics(statsData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les signalements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateReport(reportId, newStatus);
      toast({
        title: "Statut mis à jour",
        description: "Le statut du signalement a été modifié",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async () => {
    if (!selectedReport || blockReason.trim().length < 5) {
      toast({
        title: "Erreur",
        description: "La raison du blocage doit contenir au moins 5 caractères",
        variant: "destructive",
      });
      return;
    }

    setBlocking(true);
    try {
      await blockUser(selectedReport.reported_id, blockReason.trim());
      await updateReport(selectedReport.id, 'resolved', 'Compte bloqué');

      toast({
        title: "Compte bloqué",
        description: `${selectedReport.reported_name} a été bloqué`,
      });

      setBlockDialogOpen(false);
      setBlockReason("");
      setSelectedReport(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    try {
      await unblockUser(userId);
      toast({
        title: "Compte débloqué",
        description: `${userName} peut maintenant se connecter`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "destructive", icon: Clock, label: "En attente" },
      reviewed: { variant: "default", icon: Shield, label: "Examiné" },
      resolved: { variant: "secondary", icon: CheckCircle, label: "Résolu" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total signalements</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En attente</p>
                  <p className="text-2xl font-bold">{statistics.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Propriétaires les plus signalés</p>
                <div className="space-y-2">
                  {statistics.topReported.slice(0, 3).map((reported: any, index: number) => (
                    <div key={reported.reported_id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                        <span>{reported.full_name}</span>
                        {reported.is_blocked && (
                          <Badge variant="destructive" className="text-xs">Bloqué</Badge>
                        )}
                      </span>
                      <Badge variant="secondary">{reported.report_count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des signalements</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="reviewed">Examiné</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun signalement trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Propriétaire signalé: {report.reported_name}</h3>
                            {report.reported_is_blocked && (
                              <Badge variant="destructive">Compte bloqué</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Signalé par: {report.reporter_name} ({report.reporter_email})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(report.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>

                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm"><strong>Motif:</strong></p>
                        <p className="text-sm mt-1">{report.reason}</p>
                      </div>

                      {report.admin_notes && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Notes admin:</strong> {report.admin_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {report.reported_is_blocked ? (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full sm:w-auto"
                            onClick={() => handleUnblockUser(report.reported_id, report.reported_name)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Débloquer le compte
                          </Button>
                        ) : report.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setSelectedReport(report);
                              setBlockDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquer le compte
                          </Button>
                        )}

                        {report.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Examiné
                          </Button>
                        )}

                        {report.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Résolu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Bloquer le compte
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de bloquer <strong>{selectedReport?.reported_name}</strong>.
              Cette action empêchera l'utilisateur de se connecter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Raison du blocage *</Label>
              <Textarea
                id="block-reason"
                placeholder="Indiquez la raison du blocage (minimum 5 caractères)..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={blocking}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={blocking || blockReason.trim().length < 5}
            >
              {blocking ? "Blocage..." : "Bloquer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;
