import { Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold">SyndeoCare</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("footer.forPros")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/jobs" className="hover:text-foreground">{t("footer.browseJobs")}</Link></li>
            <li><Link to="/shifts" className="hover:text-foreground">{t("footer.shiftMarket")}</Link></li>
            <li><Link to="/register" className="hover:text-foreground">{t("footer.createProfile")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("footer.forFacilities")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/for-facilities" className="hover:text-foreground">{t("footer.howItWorks")}</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">{t("footer.plans")}</Link></li>
            <li><Link to="/register/employer" className="hover:text-foreground">{t("footer.registerFacility")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("footer.resources")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/guides" className="hover:text-foreground">{t("footer.guides")}</Link></li>
            <li><Link to="/interview-questions" className="hover:text-foreground">{t("footer.questions")}</Link></li>
            <li><Link to="/specialties" className="hover:text-foreground">{t("footer.specialties")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("footer.platform")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">{t("footer.about")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("footer.contact")}</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">{t("footer.terms")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SyndeoCare — {t("footer.rights")}
      </div>
    </footer>
  );
}
