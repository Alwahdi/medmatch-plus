import { useEffect, useState } from "react";

/** حالة الاتصال بالإنترنت — تُقرأ بعد الترطيب لتفادي اختلاف SSR. */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
