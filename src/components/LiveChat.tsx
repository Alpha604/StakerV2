import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Search, Gift, Trash2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { RankBadge } from "./RankBadge";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
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
  const { user } = useUser() as any;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const q = query(collection(db, "chat_messages"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
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
    if (user.permissions?.canChat === false) {
      toast.error("Vous n'êtes pas autorisé à parler dans le chat.");
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

  return (
    <div className={`fixed top-0 right-0 h-full w-[350px] bg-bg-panel border-l border-border-subtle z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full shadow-none'}`}>
      <div className="h-16 md:h-20 border-b border-border-subtle flex flex-col justify-center px-4 shrink-0 bg-[#0f212e]/50 backdrop-blur-md">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-white font-bold text-sm tracking-widest uppercase">Chat en direct</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-bg-inner rounded-full text-text-secondary hover:text-white transition-colors">
            <X size={18} />
            </button>
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
              {user?.role === "admin" && (
                <button onClick={() => handleDelete(msg.id)} className="ml-auto text-rose-500/50 hover:text-rose-500 transition-colors p-1" title="Supprimer le message">
                   <Trash2 size={12} />
                </button>
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
  );
}
