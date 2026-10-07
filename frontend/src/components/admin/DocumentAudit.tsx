import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, Shield, ShieldAlert, ShieldCheck, AlertTriangle, 
  Loader2, CheckCircle2, XCircle, Info, Calendar, FileText,
  User, CreditCard, Hash, RefreshCw, Trash2, ExternalLink
} from "lucide-react";
import { verifyPDFDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface VerificationDetail {
  status: 'success' | 'failed' | 'not_applicable';
  expected: string;
  actual: string;
}

interface VerificationReport {
  fileName: string;
  fileSize: number;
  docType: 'contract' | 'receipt';
  verified: boolean;
  databaseMatch: boolean;
  details: {
    contractNumber?: VerificationDetail;
    receiptNumber?: VerificationDetail;
    ownerName?: VerificationDetail;
    tenantName?: VerificationDetail;
    rentAmount?: VerificationDetail;
    depositAmount?: VerificationDetail;
    amount?: VerificationDetail;
    paymentDate?: VerificationDetail;
    securityHash?: VerificationDetail;
  };
}

export const DocumentAudit = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [report, setReport] = useState<VerificationReport | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setReport(null);
      } else {
        toast({
          title: "Format invalide",
          description: "Seuls les fichiers PDF sont acceptés pour l'audit d'intégrité.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setReport(null);
      } else {
        toast({
          title: "Format invalide",
          description: "Seuls les fichiers PDF sont acceptés pour l'audit d'intégrité.",
          variant: "destructive"
        });
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setReport(null);
  };

  const runAudit = async () => {
    if (!file) return;
    setLoading(true);
    
    // Simulate steps for sleek UI experience
    setLoadingStep("Lecture et extraction du texte du fichier PDF...");
    await new Promise(r => setTimeout(r, 600));
    
    setLoadingStep("Analyse des métadonnées et détection du hash de sécurité...");
    await new Promise(r => setTimeout(r, 600));

    setLoadingStep("Recherche de la version originale en base de données...");
    await new Promise(r => setTimeout(r, 600));

    setLoadingStep("Vérification croisée et calcul de l'authenticité...");
    
    try {
      const result = await verifyPDFDocument(file);
      setReport(result);
      toast({
        title: "Audit terminé",
        description: result.verified 
          ? "Le document est authentique et conforme." 
          : "Audit complété. Des incohérences ont été détectées.",
        variant: result.verified ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error("Audit error:", error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'auditer le document. Assurez-vous qu'il s'agit d'un PDF Sama Location valide.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const getStatusBadge = (status?: 'success' | 'failed' | 'not_applicable') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Conforme</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Modifié / Erreur</Badge>;
      case 'not_applicable':
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" /> Non applicable (Ancien)</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-soft border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit de Documents & Anti-Fraude
          </CardTitle>
          <CardDescription>
            Déposez un reçu ou un contrat PDF pour vérifier son authenticité, ses signatures et détecter d'éventuelles falsifications de montants ou de noms.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                isDragActive 
                  ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-secondary/20"
              }`}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-1">Glissez-déposez le PDF ici</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Supporte uniquement les formats PDF de reçus ou de contrats générés par Sama Location.
              </p>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white pointer-events-none">
                Parcourir les fichiers
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 border border-secondary rounded-xl animate-fade-in">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 bg-red-100 text-red-600 rounded-lg shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-md">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs gap-1.5"
                    onClick={runAudit}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Lancer l'audit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={removeFile}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="p-8 border border-primary/10 rounded-xl bg-primary/5 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-sm text-primary">Analyse en cours...</p>
                    <p className="text-xs text-muted-foreground mt-1">{loadingStep}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <Card className={`shadow-premium overflow-hidden border-2 animate-fade-in ${
          report.verified 
            ? "border-green-500/30" 
            : report.databaseMatch 
              ? "border-red-500/30" 
              : "border-yellow-500/30"
        }`}>
          {/* Verdict Banner */}
          <div className={`p-6 border-b flex flex-col sm:flex-row items-center gap-4 text-white ${
            report.verified 
              ? "bg-gradient-to-r from-green-600 to-emerald-500" 
              : report.databaseMatch 
                ? "bg-gradient-to-r from-red-600 to-rose-500" 
                : "bg-gradient-to-r from-yellow-600 to-amber-500"
          }`}>
            <div className="p-3 bg-white/20 rounded-full shrink-0">
              {report.verified ? (
                <ShieldCheck className="h-8 w-8 text-white" />
              ) : report.databaseMatch ? (
                <ShieldAlert className="h-8 w-8 text-white" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-white" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black uppercase tracking-wide">
                {report.verified 
                  ? "DOCUMENT AUTHENTIQUE" 
                  : report.databaseMatch 
                    ? "DOCUMENT FALSIFIÉ / MODIFIÉ" 
                    : "DOCUMENT NON RECONNU"
                }
              </h2>
              <p className="text-xs text-white/90 mt-1 max-w-2xl">
                {report.verified 
                  ? "Ce document est certifié original et correspond exactement aux données stockées sur Sama Location. Aucune falsification n'a été détectée." 
                  : report.databaseMatch 
                    ? "Des écarts de contenu ont été détectés entre ce fichier PDF et les informations officielles stockées dans la base de données. Il est très probable que ce document ait été modifié." 
                    : "Les identifiants présents dans ce document ne correspondent à aucun enregistrement dans notre base de données. Il peut s'agir d'un faux reçu/contrat créé de toutes pièces."
                }
              </p>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Meta information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl border">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">Type de Document</span>
                <span className="text-sm font-bold capitalize">{report.docType === 'contract' ? 'Contrat de Bail' : 'Reçu de paiement'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">Source de données</span>
                <span className="text-sm font-bold flex items-center gap-1">
                  {report.databaseMatch ? (
                    <Badge className="bg-green-500">Trouvé en BDD</Badge>
                  ) : (
                    <Badge variant="destructive">Absent de la BDD</Badge>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">Intégrité Cryptographique</span>
                <span className="text-sm font-bold flex items-center gap-1">
                  {report.details.securityHash?.status === 'success' ? (
                    <Badge className="bg-green-500">Hash Valide</Badge>
                  ) : report.details.securityHash?.status === 'not_applicable' ? (
                    <Badge variant="secondary">Non applicable</Badge>
                  ) : (
                    <Badge variant="destructive">Hash Invalide</Badge>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-bold block">Contrôle visuel</span>
                <span className="text-sm font-bold">
                  {report.verified ? (
                    <Badge className="bg-green-500">100% Conforme</Badge>
                  ) : (
                    <Badge variant="destructive">Incohérences</Badge>
                  )}
                </span>
              </div>
            </div>

            {/* Verification checklist */}
            {report.databaseMatch && (
              <div className="space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2 border-b pb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Rapport de comparaison des données
                </h3>

                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[180px]">Donnée Contrôlée</TableHead>
                        <TableHead>Valeur Officielle (Plateforme)</TableHead>
                        <TableHead>Valeur Détectée (PDF)</TableHead>
                        <TableHead className="w-[120px] text-right">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.docType === 'contract' ? (
                        <>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Numéro de Contrat
                            </TableCell>
                            <TableCell className="font-mono text-xs">{report.details.contractNumber?.expected}</TableCell>
                            <TableCell className="font-mono text-xs">{report.details.contractNumber?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.contractNumber?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              Bailleur
                            </TableCell>
                            <TableCell>{report.details.ownerName?.expected}</TableCell>
                            <TableCell>{report.details.ownerName?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.ownerName?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              Locataire
                            </TableCell>
                            <TableCell>{report.details.tenantName?.expected}</TableCell>
                            <TableCell>{report.details.tenantName?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.tenantName?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              Montant du Loyer
                            </TableCell>
                            <TableCell className="font-bold">{report.details.rentAmount?.expected}</TableCell>
                            <TableCell>{report.details.rentAmount?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.rentAmount?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              Dépôt de Garantie
                            </TableCell>
                            <TableCell className="font-bold">{report.details.depositAmount?.expected}</TableCell>
                            <TableCell>{report.details.depositAmount?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.depositAmount?.status)}</TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Numéro de Reçu
                            </TableCell>
                            <TableCell className="font-mono text-xs">{report.details.receiptNumber?.expected}</TableCell>
                            <TableCell className="font-mono text-xs">{report.details.receiptNumber?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.receiptNumber?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              Bailleur
                            </TableCell>
                            <TableCell>{report.details.ownerName?.expected}</TableCell>
                            <TableCell>{report.details.ownerName?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.ownerName?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              Locataire
                            </TableCell>
                            <TableCell>{report.details.tenantName?.expected}</TableCell>
                            <TableCell>{report.details.tenantName?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.tenantName?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              Montant du Paiement
                            </TableCell>
                            <TableCell className="font-bold">{report.details.amount?.expected}</TableCell>
                            <TableCell>{report.details.amount?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.amount?.status)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Date de Règlement
                            </TableCell>
                            <TableCell>{report.details.paymentDate?.expected}</TableCell>
                            <TableCell>{report.details.paymentDate?.actual}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(report.details.paymentDate?.status)}</TableCell>
                          </TableRow>
                        </>
                      )}
                      <TableRow>
                        <TableCell className="font-semibold flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          Signature SHA-256
                        </TableCell>
                        <TableCell className="font-mono text-[9px] max-w-[200px] truncate" title={report.details.securityHash?.expected}>
                          {report.details.securityHash?.expected}
                        </TableCell>
                        <TableCell className="font-mono text-[9px] max-w-[200px] truncate" title={report.details.securityHash?.actual}>
                          {report.details.securityHash?.actual}
                        </TableCell>
                        <TableCell className="text-right">{getStatusBadge(report.details.securityHash?.status)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="gap-2" onClick={removeFile}>
                <RefreshCw className="h-3.5 w-3.5" />
                Auditer un autre fichier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
