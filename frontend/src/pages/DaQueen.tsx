import { Heart, Stars, ChevronLeft, Sparkles, MessageCircleHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import daqueenImg from "@/assets/daqueen.jpeg";

const DaQueen = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 text-slate-900 overflow-x-hidden relative font-serif selection:bg-rose-200">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-rose-200/40 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-amber-200/40 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "3s" }} />

                {/* Floating particles (simplified) */}
                <div className="absolute top-1/4 left-1/4 text-rose-300/30 animate-bounce duration-[4s]">
                    <Heart size={40} className="fill-current" />
                </div>
                <div className="absolute bottom-1/4 right-1/4 text-amber-300/30 animate-bounce duration-[6s]">
                    <Sparkles size={40} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-20 p-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-rose-600/80 hover:text-rose-700 hover:bg-rose-100/50 transition-all font-sans font-bold text-lg"
                >
                    <ChevronLeft className="mr-2 h-6 w-6" />
                    Retour à l'accueil
                </Button>
            </nav>

            <main className="container mx-auto px-6 py-8 lg:py-20 relative z-10">
                <div className="flex flex-col items-center gap-16 lg:gap-24">

                    {/* Header Section */}
                    <div className="text-center space-y-6 max-w-4xl animate-in fade-in slide-in-from-top-12 duration-1000">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-rose-100 text-rose-600 rounded-full font-sans font-bold text-lg tracking-widest uppercase">
                            <Stars size={20} className="animate-spin-slow" />
                            Une Reine, Une Mère, Une Amie
                            <Stars size={20} className="animate-spin-slow" />
                        </div>
                        <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-black font-sans leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-500 to-rose-800 drop-shadow-sm">
                            DaQueen
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center w-full">

                        {/* Image Section */}
                        <div
                            className="relative group focus:outline-none animate-in fade-in slide-in-from-left-12 duration-1000 delay-300 fill-mode-both"
                        >
                            <div className="absolute -inset-6 bg-gradient-to-tr from-rose-400 to-amber-400 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-500"></div>
                            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-700">
                                <img
                                    src={daqueenImg}
                                    alt="DaQueen"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]" />
                            </div>

                            {/* Decorative Floating Element */}
                            <div
                                className="absolute -top-10 -right-10 h-32 w-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl -rotate-12 animate-pulse"
                            >
                                <Heart className="text-rose-500 h-16 w-16 fill-rose-500" />
                            </div>
                        </div>

                        {/* Content Section */}
                        <div
                            className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-1000 delay-500 fill-mode-both"
                        >
                            <div className="space-y-8 text-2xl md:text-3xl lg:text-4xl leading-relaxed text-slate-800 font-medium">
                                <p className="relative">
                                    <span className="absolute -left-10 top-0 text-7xl text-rose-200 pointer-events-none">"</span>
                                    À toi qui occupes une place si précieuse dans mon existence. Plus qu'une amie, tu es cette épaule, cette confidente, cette <span className="text-rose-600 font-bold underline decoration-rose-200 underline-offset-8">relation unique</span> où l'amour d'un fils rencontre la sagesse d'une mère.
                                </p>

                                <div className="bg-white/40 backdrop-blur-sm p-10 rounded-[2rem] border border-white/60 shadow-inner">
                                    <p className="flex items-start gap-4">
                                        <MessageCircleHeart className="shrink-0 text-rose-500 mt-1" size={36} />
                                        <span>
                                            On se rappelle de tout... de nos moments de folie pure, de nos rires interminables, mais aussi de nos <span className="italic">disputes sans fin</span>.
                                            Mais ce qui nous définit, c'est cette force qu'on a de toujours se retrouver, ces **réconciliations infinies** qui ne cessent de renforcer ce lien indestructible entre nous.
                                        </span>
                                    </p>
                                </div>

                                <p>
                                    En ce jour spécial, je veux simplement que tu saches à quel point ton âme est belle. Merci d'être toi, merci d'être là, tout simplement.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 items-center pt-4">
                                <div
                                    className="inline-flex items-center gap-4 px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-sans font-black text-3xl shadow-[0_20px_50px_rgba(225,29,72,0.3)] cursor-default hover:translate-y-[-4px] transition-transform"
                                >
                                    <Sparkles className="fill-white" />
                                    Joyeux Anniversaire !
                                </div>
                                <p className="text-xl font-sans font-bold text-rose-600 animate-pulse">
                                    Je t'adore infiniment ❤️
                                </p>
                            </div>

                            <div className="pt-8 flex gap-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-2 w-2 rounded-full bg-rose-300" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 p-16 text-center text-slate-400 text-base font-sans mt-12 bg-white/30 border-t border-rose-100">
                <p>Créé avec tout mon cœur pour célébrer celle qui règne sur mon amitié la plus pure.</p>
                <div className="flex justify-center gap-4 mt-6">
                    <Heart size={20} className="text-rose-400 fill-rose-400" />
                    <Heart size={20} className="text-rose-400 fill-rose-400" />
                    <Heart size={20} className="text-rose-400 fill-rose-400" />
                </div>
            </footer>
        </div>
    );
};

export default DaQueen;
