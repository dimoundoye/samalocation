import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageSquare, Clock, User, CheckCircle, Archive, Reply, Send, RefreshCw, Inbox, RotateCcw } from "lucide-react";
import { getContactMessages, updateContactMessageStatus, replyContactMessage } from "@/api/contact";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'replied' | 'archived';
    created_at: string;
}

type SubTabType = 'all' | 'new' | 'replied' | 'archived';

interface ContactsManagementProps {
    onStatsUpdate?: () => void;
}

const ContactsManagement = ({ onStatsUpdate }: ContactsManagementProps = {}) => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('new');
    const { toast } = useToast();

    // Modal de réponse
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replySubject, setReplySubject] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const data = await getContactMessages();
            setMessages(data);
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Impossible de charger les messages de support.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const counts = useMemo(() => {
        return {
            all: messages.length,
            new: messages.filter(m => m.status === 'new').length,
            replied: messages.filter(m => m.status === 'replied').length,
            archived: messages.filter(m => m.status === 'archived').length,
        };
    }, [messages]);

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            if (activeSubTab === 'all') return true;
            return msg.status === activeSubTab;
        });
    }, [messages, activeSubTab]);

    const handleOpenReply = (msg: ContactMessage) => {
        setSelectedMessage(msg);
        setReplySubject(`Re: ${msg.subject}`);
        setReplyText(`Bonjour ${msg.name},\n\nMerci d'avoir contacté le service client de SamaLocation.\n\n`);
        setReplyModalOpen(true);
    };

    const handleSendReply = async () => {
        if (!selectedMessage || !replyText.trim()) {
            toast({
                title: "Message requis",
                description: "Veuillez saisir votre texte de réponse.",
                variant: "destructive"
            });
            return;
        }

        try {
            setSendingReply(true);
            await replyContactMessage(selectedMessage.id, {
                replyMessage: replyText.trim(),
                replySubject: replySubject.trim()
            });

            toast({
                title: "Réponse envoyée ! ✉️",
                description: `Votre e-mail a été transmis à ${selectedMessage.email}.`,
            });

            // Mettre à jour localement le statut en "replied"
            setMessages(messages.map(m => m.id === selectedMessage.id ? { ...m, status: 'replied' } : m));
            setReplyModalOpen(false);
            setSelectedMessage(null);
            setReplyText("");
            onStatsUpdate?.();
        } catch (error: any) {
            toast({
                title: "Erreur d'envoi",
                description: error.message || "Impossible d'envoyer l'e-mail de réponse.",
                variant: "destructive"
            });
        } finally {
            setSendingReply(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'new' | 'replied' | 'archived') => {
        try {
            await updateContactMessageStatus(id, newStatus);
            const statusLabels: Record<string, string> = {
                new: 'en attente',
                replied: 'répondu',
                archived: 'archivé'
            };
            toast({
                title: "Statut mis à jour",
                description: `Le message a été marqué comme ${statusLabels[newStatus] || newStatus}.`,
            });
            setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
            onStatsUpdate?.();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut.",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Bar with Subtabs & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Sous-onglets */}
                <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border overflow-x-auto scrollbar-none max-w-full">
                    <Button
                        variant={activeSubTab === "new" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-lg text-xs font-semibold h-8 gap-1.5 shrink-0"
                        onClick={() => setActiveSubTab("new")}
                    >
                        <Inbox className="h-3.5 w-3.5" />
                        En attente
                        {counts.new > 0 ? (
                            <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-orange-500 text-white border-none">
                                {counts.new}
                            </Badge>
                        ) : (
                            <Badge variant={activeSubTab === "new" ? "secondary" : "outline"} className="ml-1 text-[10px] px-1.5 py-0 h-4">
                                0
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={activeSubTab === "replied" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-lg text-xs font-semibold h-8 gap-1.5 shrink-0"
                        onClick={() => setActiveSubTab("replied")}
                    >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Messages répondus
                        <Badge variant={activeSubTab === "replied" ? "secondary" : "outline"} className="ml-1 text-[10px] px-1.5 py-0 h-4">
                            {counts.replied}
                        </Badge>
                    </Button>
                    <Button
                        variant={activeSubTab === "archived" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-lg text-xs font-semibold h-8 gap-1.5 shrink-0"
                        onClick={() => setActiveSubTab("archived")}
                    >
                        <Archive className="h-3.5 w-3.5" />
                        Archivés
                        <Badge variant={activeSubTab === "archived" ? "secondary" : "outline"} className="ml-1 text-[10px] px-1.5 py-0 h-4">
                            {counts.archived}
                        </Badge>
                    </Button>
                    <Button
                        variant={activeSubTab === "all" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-lg text-xs font-semibold h-8 gap-1.5 shrink-0"
                        onClick={() => setActiveSubTab("all")}
                    >
                        Tous
                        <Badge variant={activeSubTab === "all" ? "secondary" : "outline"} className="ml-1 text-[10px] px-1.5 py-0 h-4">
                            {counts.all}
                        </Badge>
                    </Button>
                </div>

                {/* Refresh and counter */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs text-muted-foreground">
                        {filteredMessages.length} message{filteredMessages.length > 1 ? 's' : ''}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchMessages} 
                        disabled={loading}
                        className="gap-2 h-8 text-xs rounded-lg shrink-0"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Actualiser
                    </Button>
                </div>
            </div>

            {filteredMessages.length === 0 ? (
                <Card className="border-none shadow-soft">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeSubTab === 'archived' ? (
                                <Archive className="h-8 w-8 text-muted-foreground" />
                            ) : activeSubTab === 'replied' ? (
                                <CheckCircle className="h-8 w-8 text-muted-foreground" />
                            ) : activeSubTab === 'new' ? (
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            {activeSubTab === 'archived'
                                ? "Aucun message archivé"
                                : activeSubTab === 'replied'
                                ? "Aucun message répondu"
                                : activeSubTab === 'new'
                                ? "Aucun message en attente"
                                : "Aucun message"}
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            {activeSubTab === 'archived'
                                ? "Les messages de support que vous archivez apparaîtront dans cet onglet."
                                : activeSubTab === 'replied'
                                ? "Les messages de support auxquels vous avez répondu apparaîtront dans cet onglet."
                                : activeSubTab === 'new'
                                ? "Tous les messages de support reçus ont été traités ou archivés."
                                : "Vous n'avez reçu aucun message via le formulaire de contact pour le moment."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredMessages.map((msg) => (
                        <Card key={msg.id} className={`border-none shadow-soft transition-all hover:shadow-medium ${msg.status === 'new' ? 'border-l-4 border-l-primary' : ''}`}>
                            <CardHeader className="pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{msg.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {msg.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={msg.status === 'new' ? 'default' : msg.status === 'replied' ? 'secondary' : 'outline'}>
                                            {msg.status === 'new' ? 'Nouveau' : msg.status === 'replied' ? 'Répondu' : 'Archivé'}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {formatDate(msg.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-secondary/30 p-4 rounded-lg mb-4">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Objet: {msg.subject}</h4>
                                    <p className="text-foreground whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="bg-primary hover:bg-primary/90 text-white gap-2 font-semibold"
                                        onClick={() => handleOpenReply(msg)}
                                    >
                                        <Reply className="h-4 w-4" /> Répondre par e-mail
                                    </Button>

                                    {msg.status !== 'replied' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
                                            onClick={() => handleStatusUpdate(msg.id, 'replied')}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Marquer comme répondu
                                        </Button>
                                    )}

                                    {msg.status === 'archived' ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-primary border-primary/20 hover:bg-primary/5"
                                            onClick={() => handleStatusUpdate(msg.id, 'new')}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-muted-foreground border-muted hover:bg-secondary"
                                            onClick={() => handleStatusUpdate(msg.id, 'archived')}
                                        >
                                            <Archive className="h-4 w-4 mr-2" /> Archiver
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de réponse directe par e-mail */}
            <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Reply className="h-5 w-5 text-primary" /> Répondre à {selectedMessage?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Envoyez une réponse officielle par e-mail au client. Le message sera automatiquement marqué comme répondu.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-4 py-2">
                            {/* Rappel du message original */}
                            <div className="p-3 bg-secondary/40 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Destinataire : <strong className="text-foreground">{selectedMessage.email}</strong></span>
                                </div>
                                <div className="text-muted-foreground pt-1 border-t">
                                    <span className="font-semibold text-foreground">Message d'origine :</span> « {selectedMessage.message} »
                                </div>
                            </div>

                            {/* Objet */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Objet de l'e-mail</Label>
                                <Input 
                                    value={replySubject} 
                                    onChange={(e) => setReplySubject(e.target.value)}
                                />
                            </div>

                            {/* Corps de réponse */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Votre réponse</Label>
                                <Textarea 
                                    rows={7} 
                                    value={replyText} 
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Rédigez votre réponse ici..."
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setReplyModalOpen(false)}
                            disabled={sendingReply}
                        >
                            Annuler
                        </Button>
                        <Button 
                            onClick={handleSendReply}
                            disabled={sendingReply}
                            className="bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                        >
                            {sendingReply ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" /> Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" /> Envoyer la réponse
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContactsManagement;
