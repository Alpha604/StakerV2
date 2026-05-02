import React from "react";
import { useUser } from "../context/UserContext";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export function ApprovalGuard({ children, gameName }: { children: React.ReactNode, gameName?: string }) {
  const { user } = useUser();

  if (user && user.status !== "approved" && user.role !== "admin") {
    return (
      <div className="relative w-full h-full flex items-center justify-center min-h-[500px] p-4 flex-col">
          {/* We show the children but blurred/disabled, and an overlay */}
          <div className="absolute inset-0 z-0 blur-md pointer-events-none opacity-40 select-none overflow-hidden flex items-center justify-center">
             {children}
          </div>
          
          <div className="z-10 bg-[#0f212e] border-2 border-red-500/50 p-8 rounded-xl max-w-md text-center shadow-[0_20px_50px_rgba(237,65,99,0.2)] animate-in zoom-in-95 duration-300">
             <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Compte Restreint</h2>
             
             {user.status === "pending" && (
                <p className="text-[#8b9ba5] mb-6 font-medium leading-relaxed">
                  Votre compte est en attente d'approbation par la <strong className="text-white">Fédération Des Jeux Stake (FDJS)</strong>. Vous ne pouvez pas jouer pour le moment.
                </p>
             )}
             
             {user.status === "suspended" && (
                <p className="text-[#f6c722] mb-6 font-medium leading-relaxed">
                  Votre compte a été temporairement <strong className="text-white">suspendu</strong> par l'administration. Les jeux sont inaccessibles.
                </p>
             )}

             {user.status === "banned" && (
                <p className="text-red-400 mb-6 font-medium leading-relaxed">
                  Votre compte a été <strong className="text-white">banni définitivement</strong>. Vous ne pouvez plus jouer sur cette plateforme.
                </p>
             )}

             <button 
              disabled
              className="bg-[#2f4553] text-[#8b9ba5] w-full py-3 rounded font-bold cursor-not-allowed uppercase tracking-wider text-sm"
             >
                Contactez le support
             </button>
          </div>
      </div>
    );
  }

  // Check game restriction
  if (user && gameName && user.permissions?.blockedGames?.[gameName]) {
    return (
      <div className="relative w-full h-full flex items-center justify-center min-h-[500px] p-4 flex-col">
          <div className="absolute inset-0 z-0 blur-md pointer-events-none opacity-40 select-none overflow-hidden flex items-center justify-center">
             {children}
          </div>
          
          <div className="z-10 bg-[#0f212e] border-2 border-[#f6c722]/50 p-8 rounded-xl max-w-md text-center shadow-[0_20px_50px_rgba(246,199,34,0.2)] animate-in zoom-in-95 duration-300">
             <div className="bg-[#f6c722]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[#f6c722]" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Jeu Restreint</h2>
             <p className="text-[#8b9ba5] mb-6 font-medium leading-relaxed">
                L'administration a restreint votre accès à ce jeu pour le moment.
             </p>
          </div>
      </div>
    );
  }

  return <>{children}</>;
}
