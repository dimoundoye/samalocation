import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="py-16 bg-secondary/30 dark:bg-background border-t border-border/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-2">
                            <img src="/logo-sl.png" alt="Samalocation" className="h-12 w-auto object-contain" />
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden md:inline">
                                Samalocation
                            </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('footer.desc')}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.nav.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><Link to="/" className="hover:text-accent transition-colors">{t('footer.nav.home')}</Link></li>
                            <li><Link to="/pricing" className="hover:text-accent transition-colors">{t('nav.pricing')}</Link></li>
                            <li><Link to="/search" className="hover:text-accent transition-colors">{t('footer.nav.search')}</Link></li>
                            <li><Link to="/about" className="hover:text-accent transition-colors">{t('footer.nav.about')}</Link></li>
                            <li><Link to="/auth" className="hover:text-accent transition-colors">{t('footer.nav.login')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.legal.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><Link to="/terms" className="hover:text-accent transition-colors">{t('footer.legal.terms')}</Link></li>
                            <li><Link to="/privacy" className="hover:text-accent transition-colors">{t('footer.legal.privacy')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.support.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><Link to="/contact" className="hover:text-accent transition-colors">{t('footer.support.contact')}</Link></li>
                            <li><a href="mailto:contact@samalocation.com" className="hover:text-accent transition-colors">contact@samalocation.com</a></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-muted-foreground text-sm">
                        {t('footer.copyright')}
                    </p>
                    <div className="flex gap-6">
                        {/* Social icons placeholder  */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
