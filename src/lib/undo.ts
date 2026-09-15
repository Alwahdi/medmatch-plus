import { toast } from "sonner";

type Lang = "ar" | "en";

/**
 * Shows a short success toast with an undo action for reversible operations.
 * Destructive / irreversible actions keep their confirm dialog instead.
 */
export function toastUndo(
  message: string,
  onUndo: () => void | Promise<void>,
  lang: Lang = "ar",
  duration = 5000,
) {
  toast.success(message, {
    duration,
    action: {
      label: lang === "ar" ? "تراجع" : "Undo",
      onClick: () => {
        void onUndo();
      },
    },
  });
}
