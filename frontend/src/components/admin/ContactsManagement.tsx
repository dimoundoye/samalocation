import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Clock, User, CheckCircle, Archive, Trash2 } from "lucide-react";
import { getContactMessages, updateContactMessageStatus } from "@/api/contact";
import { useToast } from "@/hooks/use-toast";

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'replied' | 'archived';
    created_at: string;
}

const ContactsManagement = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

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

    const handleStatusUpdate = async (id: string, newStatus: 'replied' | 'archived') => {
        try {
            await updateContactMessageStatus(id, newStatus);
            toast({
                title: "Statut mis à jour",
                description: `Le message a été marqué comme ${newStatus === 'replied' ? 'répondu' : 'archivé'}.`,
            });
            setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
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
            {messages.length === 0 ? (
                <Card className="border-none shadow-soft">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Aucun message</h3>
                        <p className="text-muted-foreground">Vous n'avez reçu aucun message via le formulaire de contact pour le moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {messages.map((msg) => (
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
                                    {msg.status !== 'replied' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                            onClick={() => handleStatusUpdate(msg.id, 'replied')}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Marquer comme répondu
                                        </Button>
                                    )}
                                    {msg.status !== 'archived' && (
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
        </div>
    );
};

export default ContactsManagement;
