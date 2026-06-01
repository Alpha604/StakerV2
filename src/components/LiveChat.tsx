import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Search, Gift, Trash2, Ghost } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { RankBadge } from "./RankBadge";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

const BOT_MESSAGES = [
  "Quelqu'un joue à Mines ?",
  "Grosse perte sur le Limbo omg 😭",
  "Je viens de taper un x1000 ! 🎉",
  "Plinko est rigged auj",
  "Qui pour un CoinFlip ?",
  "Drop de code promo bientôt ?",
  "J'ai tout perdu...",
  "GL aux nouveaux",
];

const BOT_NAMES = ["DarkSlayer", "CryptoKing", "LuckyL", "Mika", "Sasha99", "AlphaWolf", "StakeFan", "GamblerPro"];

export function LiveChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, globalAppStatus } = useUser() as any;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    
    const q = query(collection(db, "chat_messages"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      
      if (user?.role !== "admin") {
        msgs = msgs.filter((m: any) => !m.isHidden || m.authorId === user?.id);
      }
      
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    if (!user) {
      toast.error("Connectez-vous pour parler sur le chat !");
      return;
    }
    if (globalAppStatus?.preventChat && user.role !== "admin") {
      toast.error("Le chat public est actuellement désactivé par l'administration.");
      return;
    }
    if (user.permissions?.canChat === false) {
      toast.error("Vous n'êtes pas autorisé à parler dans le chat.");
      return;
    }

    const now = Date.now();
    if (user.role !== "admin" && now - lastMessageTime.current < 2000) {
      toast.error("Veuillez patienter avant d'envoyer un autre message.");
      return;
    }
    lastMessageTime.current = now;

    const forbiddenWords = ['connard', 'salope', 'pute', 'pd', 'fdp', 'ntm', 'tg', 'nègre', 'negre', 'bougnoule', 'bâtard', 'batard', 'enculé', 'encule'];
    const lowerMsg = inputMsg.toLowerCase();
    if (forbiddenWords.some(w => lowerMsg.includes(w))) {
      toast.error("Message inapproprié. Veuillez rester respectueux.");
      return;
    }

    const vipActive = user.vipStatus?.active && user.vipStatus?.expiresAt > Date.now();
    const newMsg = {
      author: user.username || "Joueur",
      authorId: user.id,
      rank: user.rank || "None",
      isVip: vipActive,
      text: inputMsg,
      timestamp: serverTimestamp(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHidden: user.isHiddenFromPublic || false,
    };
    
    setInputMsg("");
    try {
      await addDoc(collection(db, "chat_messages"), newMsg);
    } catch (e) {
      toast.error("Erreur d'envoi du message");
    }
  };

  const handleDelete = async (msgId: string) => {
    if (user?.role !== "admin") return;
    try {
      await deleteDoc(doc(db, "chat_messages", msgId));
    } catch(e) {
      toast.error("Erreur à la suppression");
    }
  };

  const handleClearChat = async () => {
    if (user?.role !== "admin") return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer tous les messages actuels du chat ?")) return;
    try {
      const batch = writeBatch(db);
      messages.forEach(msg => {
        batch.delete(doc(db, "chat_messages", msg.id));
      });
      await batch.commit();
      toast.success("Chat réinitialisé");
    } catch(e) {
      toast.error("Erreur de réinitialisation");
    }
  };

  const handleMuteUser = async (authorId: string, authorName: string) => {
    if (user?.role !== "admin") return;
    if (!window.confirm(`Voulez-vous révoquer le droit de parole de ${authorName} ?`)) return;
    try {
      await updateDoc(doc(db, "users", authorId), {
        "permissions.canChat": false
      });
      toast.success(`${authorName} a été mute.`);
    } catch(e) {
      toast.error("Erreur lors de la sanction");
    }
  };

  const handleBanUserFromChat = async (msgId: string, authorId: string, authorName: string) => {
    if (user?.role !== "admin") return;
    if (!window.confirm(`Voulez-vous BANNIR DEFINITIVEMENT ${authorName} du site ?`)) return;
    try {
      await updateDoc(doc(db, "users", authorId), {
        status: "banned",
        banReason: "Banni depuis le chat public par un administrateur pour comportement toxique."
      });
      await deleteDoc(doc(db, "chat_messages", msgId));
      toast.success(`${authorName} a été banni du site.`);
    } catch(e) {
      toast.error("Erreur lors de la sanction");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}
      <div className={`fixed top-0 right-0 h-full w-[100vw] sm:w-[400px] lg:w-[350px] bg-bg-panel border-l border-border-subtle z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full shadow-none pointer-events-none'}`}>
        <div className="h-16 md:h-20 border-b border-border-subtle flex flex-col justify-center px-4 shrink-0 bg-[#0f212e]/50 backdrop-blur-md">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase">Chat en direct</h2>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "admin" && (
                  <button onClick={handleClearChat} className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded text-xs font-bold uppercase transition-colors mr-2">
                    Reset
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-bg-inner rounded-full text-text-secondary hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
          </div>
        </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-text-secondary">{msg.timeStr || msg.time}</span>
              {msg.isVip && (
                <span className="bg-yellow-500/20 text-yellow-500 text-[10px] uppercase font-black px-1.5 py-0.5 rounded border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.3)]">VIP</span>
              )}
              {msg.rank && msg.rank !== "None" ? (
                 <RankBadge rank={msg.rank} className="h-4 drop-shadow-sm" />
              ) : (
                !(msg.isVip) && <User size={12} className="text-text-secondary" />
              )}
              <span className={`font-bold ${msg.authorId === user?.id ? 'text-white' : 'text-text-secondary hover:text-white'}`}>
                {msg.author}
              </span>
              {msg.isHidden && <span title="Message fantôme"><Ghost size={12} className="text-purple-500" /></span>}
              {user?.role === "admin" && (
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => handleBanUserFromChat(msg.id, msg.authorId, msg.author)} className="text-purple-500/50 hover:text-purple-500 transition-colors p-1" title={`BANNIR ${msg.author}`}>
                     <X size={12} strokeWidth={4} />
                  </button>
                  <button onClick={() => handleMuteUser(msg.authorId, msg.author)} className="text-amber-500/50 hover:text-amber-500 transition-colors p-1" title={`Mute ${msg.author}`}>
                     <User size={12} className="relative before:content-['/'] before:absolute before:text-amber-500 before:font-bold before:-rotate-45" />
                  </button>
                  <button onClick={() => handleDelete(msg.id)} className="text-rose-500/50 hover:text-rose-500 transition-colors p-1" title="Supprimer le message">
                     <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className={`break-words ${msg.authorId === user?.id ? 'text-emerald-400' : 'text-[#8b9ba5]'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border-subtle shrink-0">
        <form onSubmit={handleSend} className="bg-bg-inner border border-border-medium focus-within:border-emerald-500 rounded flex items-center transition-colors">
          <input 
            type="text" 
            placeholder="Écrire un message..." 
            className="bg-transparent border-none outline-none w-full py-3 px-4 text-white text-sm"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
          />
          <button type="submit" className="p-3 text-text-secondary hover:text-white transition-colors">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
