import { useTranslation } from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="py-16 bg-secondary/30 dark:bg-background border-t border-border/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Samalocation
                        </span>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('footer.desc')}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.nav.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="/" className="hover:text-accent transition-colors">{t('footer.nav.home')}</a></li>
                            <li><a href="/pricing" className="hover:text-accent transition-colors">{t('nav.pricing')}</a></li>
                            <li><a href="/search" className="hover:text-accent transition-colors">{t('footer.nav.search')}</a></li>
                            <li><a href="/auth" className="hover:text-accent transition-colors">{t('footer.nav.login')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.legal.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="/terms" className="hover:text-accent transition-colors">{t('footer.legal.terms')}</a></li>
                            <li><a href="/privacy" className="hover:text-accent transition-colors">{t('footer.legal.privacy')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6 text-primary">{t('footer.support.title')}</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="/contact" className="hover:text-accent transition-colors">{t('footer.support.contact')}</a></li>
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
