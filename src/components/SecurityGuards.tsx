import React, { useState, useEffect } from "react";
import { MonitorX, ShieldAlert } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function ScreenSizeGuard({ children }: { children: React.ReactNode }) {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 320 || window.innerHeight < 400) {
        setIsTooSmall(true);
      } else {
        setIsTooSmall(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isTooSmall) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0f212e] flex flex-col items-center justify-center p-6 text-center text-white">
        <MonitorX className="w-16 h-16 text-rose-500 mb-6" />
        <h1 className="text-2xl font-black mb-4 uppercase">Écran non supporté</h1>
        <p className="text-gray-400 font-medium">
          La taille de votre écran est trop petite. Veuillez utiliser un appareil plus grand ou tourner votre téléphone.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function IPGuard({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkIP() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        const userIp = data.ip;

        if (userIp) {
            const configDoc = await getDoc(doc(db, "config", "security"));
            if (configDoc.exists()) {
                const blockedIps = configDoc.data()?.blockedIps || [];
                if (blockedIps.includes(userIp)) {
                    setBlocked(true);
                }
            }
        }
      } catch (err) {
         // Silently fail if ipify drops
      } finally {
        setChecking(false);
      }
    }
    checkIP();
  }, []);

  if (checking) return null; // Wait for IP check before rendering

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0f212e] flex flex-col items-center justify-center p-6 text-center text-white">
         <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
         <h1 className="text-3xl font-black mb-4 uppercase text-white tracking-widest">Accès Refusé</h1>
         <p className="text-gray-300 font-medium">
            Votre adresse IP a été bloquée par nos administrateurs en raison d'activités suspectes.
         </p>
      </div>
    );
  }

  return <>{children}</>;
}
