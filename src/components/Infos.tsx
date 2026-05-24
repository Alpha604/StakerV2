import React from "react";
import { Info, ShieldAlert, BadgeInfo, Wallet, Shield, Mail, Gem, Sparkles, MessageCircle, BarChart } from "lucide-react";

export function Infos() {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Info size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Informations & Guide</h1>
          <p className="text-gray-400">Découvrez l'ensemble des fonctionnalités et le fonctionnement de votre compte.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fonctionnalité du compte */}
        <div className="bg-[#0f212e] border border-[#1a2c38] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BadgeInfo className="text-blue-400" />
            Fonctionnalités du Compte
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1">
                <Wallet className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Solde & Coffre-fort (Vault)</h3>
                <p className="text-sm text-gray-400 mt-1">Vous disposez d'un solde principal et d'un coffre-fort (Vault) pour sécuriser vos gains. Le coffre-fort vous permet de mettre de côté vos cryptos hors de portée des machines à sous et autres jeux.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1">
                <Shield className="text-amber-500" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Maxi Vault (Coffre-fort Sécurisé)</h3>
                <p className="text-sm text-gray-400 mt-1">Le Maxi Vault est un coffre-fort ultra-sécurisé géré par l'administration. En cas de blocage ou d'atteinte d'un montant anormal, vos fonds peuvent être placés dans ce coffre-fort. Contactez le support pour débloquer ces fonds si ce cas se présente.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1">
                <Gem className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Grades & VIP</h3>
                <p className="text-sm text-gray-400 mt-1">Plus vous jouez, plus votre grade augmente (Bronze, Silver, Gold, Platinum, Diamond...). Les grades supérieurs donnent accès à des avantages exclusifs et des plafonds de retrait plus importants.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="mt-1">
                <BarChart className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Statistiques de session</h3>
                <p className="text-sm text-gray-400 mt-1">Suivez en temps réel vos pertes et gains (Profit(Net)) pour mieux gérer votre budget de jeu.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jeux & Fonctionnalité */}
        <div className="bg-[#0f212e] border border-[#1a2c38] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-pink-400" />
              Jeux disponibles
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#1a2c38] rounded-xl border border-gray-700/50">
                <h3 className="font-bold text-white mb-1 tracking-wide">🔥 Jeux Originaux</h3>
                <p className="text-sm text-gray-400">Retrouvez des grands classiques exclusifs comme la Roulette (Wheel), Mines, Plinko, Crash, Keno et Limbo.</p>
              </div>
              
              <div className="p-4 bg-[#1a2c38] rounded-xl border border-gray-700/50">
                <h3 className="font-bold text-white mb-1 tracking-wide">🎫 Jeux de Grattage (FDJ)</h3>
                <p className="text-sm text-gray-400">Grattez et tentez votre chance sur nos exclusivités : Millionnaire, Maxi Cash, Astro et Superior Halla.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pt-4 border-t border-gray-800">
              <MessageCircle className="text-indigo-400" />
              Communication
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Chat en direct :</strong> Un chat global est disponible en bas à droite de votre écran. Discutez avec la communauté et partagez vos gains !
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Support Client :</strong> En cas de litige, bug, ou demande spécifique (déblocage de Maxi Vault, rank-up), vous pouvez contacter le support 24/7 directement depuis le bouton en bas du menu principal ou via l'onglet support.
              </p>
            </div>
          </div>

        </div>

      </div>

      <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
           <h2 className="text-lg font-bold text-blue-400 mb-2">Sécurité et Jeu Responsable</h2>
           <p className="text-sm text-gray-300 max-w-2xl">Le jeu doit rester un plaisir. Ne misez pas d'argent que vous ne pouvez pas vous permettre de perdre. En cas de problème ou de suspicion de fraude sur votre compte, notre système le bloquera automatiquement et le soumettra au Maxi Vault pour vérifier l'exactitude des fonds.</p>
        </div>
        <div className="shrink-0">
           <ShieldAlert className="text-blue-500/50 w-24 h-24" />
        </div>
      </div>

    </div>
  );
}
