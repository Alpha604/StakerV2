import React, { useState, useEffect } from "react";
import { MonitorX, ShieldAlert } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useUser } from "../context/UserContext";

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
  const [userIp, setUserIp] = useState<string | null>(null);
  const { user } = useUser() as any;

  useEffect(() => {
    async function fetchIP() {
      const getIP = async () => {
        try {
           const res = await fetch("https://api.ipify.org?format=json");
           const data = await res.json();
           if (data.ip) return data.ip;
        } catch(e) {}
        try {
           const res = await fetch("https://api.seeip.org/jsonip?");
           const data = await res.json();
           if (data.ip) return data.ip;
        } catch(e) {}
        try {
           const res = await fetch("https://api64.ipify.org?format=json");
           const data = await res.json();
           if (data.ip) return data.ip;
        } catch(e) {}
        return null;
      };

      const ip = await getIP();
      if (ip) {
         setUserIp(ip);
      } else {
         setChecking(false);
      }
    }
    fetchIP();
  }, []);

  useEffect(() => {
    if (!userIp) return;
    import("firebase/firestore").then(({ onSnapshot, doc }) => {
      const unsub = onSnapshot(doc(db, "config", "security"), (snap) => {
        if (snap.exists()) {
          const blockedIps = snap.data()?.blockedIps || [];
          if (blockedIps.includes(userIp)) {
            setBlocked(true);
          } else {
            setBlocked(false);
          }
        }
        setChecking(false);
      });
      return () => unsub();
    });
  }, [userIp]);

  if (checking) return null; // Wait for IP check before rendering

  // For bypassing admin IPs
  const isSuperAdmin = ["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(user?.email || "");
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  if (blocked && !isAdmin) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0f212e] flex flex-col items-center justify-center p-6 text-center text-white">
         <ShieldAlert className="w-20 h-20 text-red-500 mb-6 cursor-pointer" onClick={() => {
            const pwd = window.prompt("Admin override password:");
            if (pwd === "fdjsadmin8921") {
               import("firebase/firestore").then(({ setDoc, doc }) => {
                 setDoc(doc(db, "config", "security"), { blockedIps: [] }, { merge: true });
                 alert("IPs unblocked! Please refresh.");
               });
            }
         }} />
         <h1 className="text-3xl font-black mb-4 uppercase text-white tracking-widest">Accès Refusé</h1>
         <p className="text-gray-300 font-medium">
            Votre adresse IP a été bloquée par nos administrateurs en raison d'activités suspectes.
         </p>
      </div>
    );
  }

  return <>{children}</>;
}
