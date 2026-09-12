import { Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold">SyndeoCare</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            منصة عربية تربط الكوادر الصحية بالمستشفيات والعيادات: وظائف دائمة، مناوبات فورية، وتوثيق
            تراخيص موحّد.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">للكوادر الصحية</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/jobs" className="hover:text-foreground">تصفح الوظائف</Link></li>
            <li><Link to="/shifts" className="hover:text-foreground">سوق المناوبات</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">إنشاء ملف مهني</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">للمنشآت</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/for-facilities" className="hover:text-foreground">كيف تعمل المنصة</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">الأسعار والباقات</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">تسجيل منشأة</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">المصادر</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/guides" className="hover:text-foreground">الأدلة والمقالات</Link></li>
            <li><Link to="/interview-questions" className="hover:text-foreground">أسئلة المقابلات</Link></li>
            <li><Link to="/specialties" className="hover:text-foreground">التخصصات</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">المنصة</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">من نحن</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">تواصل معنا</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">سياسة الخصوصية</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">شروط الاستخدام</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SyndeoCare — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
