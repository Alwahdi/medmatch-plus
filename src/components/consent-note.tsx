import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINK =
  "font-medium text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm";

/** عبارة الموافقة على الشروط وسياسة الخصوصية، بروابط فعلية. */
export function ConsentNote({ className }: { className?: string }) {
  const { lang } = useLang();

  return (
    <p className={cn("text-center text-xs text-muted-foreground", className)}>
      {lang === "ar" ? (
        <>
          بإنشاء حساب، فإنك توافق على{" "}
          <Link to="/terms" className={LINK}>
            شروط الاستخدام
          </Link>{" "}
          و
          <Link to="/privacy" className={LINK}>
            سياسة الخصوصية
          </Link>
          .
        </>
      ) : (
        <>
          By creating an account you agree to the{" "}
          <Link to="/terms" className={LINK}>
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className={LINK}>
            Privacy Policy
          </Link>
          .
        </>
      )}
    </p>
  );
}
