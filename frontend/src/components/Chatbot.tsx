import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles, Loader2, Minus } from "lucide-react";
import { getAIChatResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
    role: "user" | "model";
    text: string;
}

const Chatbot = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", text: "Bonjour ! Je suis l'assistant Samalocation. Comment puis-je vous aider aujourd'hui ?" }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        try {
            // Format history for Gemini (excluding the system message)
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const aiResponse = await getAIChatResponse(userMessage, history);
            setMessages((prev) => [...prev, { role: "model", text: aiResponse }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "model", text: "Désolé, je n'arrive pas à joindre le serveur IA. Assurez-vous que le backend tourne localement sur le port 5000." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform z-[60] bg-primary text-primary-foreground"
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        );
    }

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-lg shadow-lg cursor-pointer flex items-center gap-2 z-[60] animate-in slide-in-from-bottom-4"
                onClick={() => setIsMinimized(false)}
            >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Assistant IA actif</span>
                <X className="h-4 w-4 ml-2 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
            </div>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[90vw] sm:w-[380px] h-[500px] shadow-2xl z-[60] flex flex-col border-primary/20 animate-in slide-in-from-bottom-8">
            <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold">Samalocation AI</CardTitle>
                        <p className="text-[10px] opacity-80">En ligne • Support 24/7</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsMinimized(true)}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-muted/30">
                <div className="h-full overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted border border-border shadow-sm rounded-tl-none text-foreground"
                                        }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-muted border border-border shadow-sm p-3 rounded-2xl rounded-tl-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t bg-card rounded-b-xl">
                <form
                    className="flex w-full items-center gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Input
                        placeholder="Écrivez votre message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="flex-1 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-10"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || loading} className="h-10 w-10 shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};

export default Chatbot;
