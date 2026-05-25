import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect, useMemo } from "react";
import { useUser, CustomUser, UserRank } from "../context/UserContext";
import {
  Search,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Trash2,
  Shield,
  ShieldAlert,
  AlertTriangle,
  X,
  Save,
  History,
  Settings,
  Lock,
  Unlock,
  Gavel,
  Cpu,
  Database,
  Eye,
  Gamepad,
  Mail,
  CheckCircle,
  Monitor,
  Smartphone,
  Laptop,
  ArrowUpCircle,
  ArrowDownCircle,
  Archive,
  ArchiveRestore,
  Filter,
  Check,
  XCircle,
  Inbox,
  Clock,
  RotateCcw,
  LockOpen
} from "lucide-react";
import { RankBadge } from "./RankBadge";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getCountFromServer,
  increment,
} from "firebase/firestore";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";

import { ALL_GAMES } from "./Home";

export function AdminPanel() {
  const { user, globalAppStatus } = useUser();
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<CustomUser | null>(null);

  // App Lock Modal States
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockTargetMode, setLockTargetMode] = useState<
    "maintenance" | "arret" | "moderation"
  >("maintenance");
  const [lockBlockedDevices, setLockBlockedDevices] = useState<string[]>([]);

  const [lockHasEndTime, setLockHasEndTime] = useState(false);
  const [lockEndMode, setLockEndMode] = useState<"duration" | "date">(
    "duration",
  );
  const [lockDurationValue, setLockDurationValue] = useState(1);
  const [lockDurationUnit, setLockDurationUnit] = useState<
    "minutes" | "hours" | "days"
  >("hours");
  const [lockEndDate, setLockEndDate] = useState("");
  const [lockEndTime, setLockEndTime] = useState("");

  const [lockAutoUnlock, setLockAutoUnlock] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [globalBetsCount, setGlobalBetsCount] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<CustomUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomUser>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [suspensionMinutes, setSuspensionMinutes] = useState<number | "">("");
  const [suspensionDate, setSuspensionDate] = useState<string>("");
  const [suspensionTime, setSuspensionTime] = useState<string>("");
  const [actionReason, setActionReason] = useState<string>("");

  const [editTab, setEditTab] = useState<
    "general" | "finances" | "permissions" | "history"
  >("general");
  const [mainTab, setMainTab] = useState<
    "users" | "games" | "inbox" | "security"
  >("users");
  const [userCategory, setUserCategory] = useState<
    "Tous" | "En attente" | "Approuvés" | "Suspendus" | "Bannis"
  >("Tous");

  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");

  const [gamesConfig, setGamesConfig] = useState<
    Record<string, { banned: boolean; reason: string; date: string }>
  >({});
  const [securityConfig, setSecurityConfig] = useState<{
    blockedIps: string[];
  }>({ blockedIps: [] });
  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    let unsubUsers: () => void;
    let unsubBets: () => void;
    let unsubGames: () => void;
    let unsubRequests: () => void;
    let unsubSecurity: () => void;

    const clockInterval = setInterval(() => setNow(Date.now()), 10000);

    if (user?.role === "admin") {
      unsubUsers = onSnapshot(
        collection(db, "users"),
        (snap) => {
          const usersData = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as CustomUser,
          );
          setUsers(usersData);
          setLoading(false);
        },
        (err) => console.error(err),
      );

      const betsQ = query(
        collection(db, "bets"),
        orderBy("timestamp", "desc"),
        limit(100),
      );
      unsubBets = onSnapshot(
        betsQ,
        (snap) => {
          setRecentBets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => console.error(err),
      );

      unsubGames = onSnapshot(
        doc(db, "config", "games"),
        (snap) => {
          if (snap.exists()) setGamesConfig(snap.data() as any);
        },
        (err) => console.error(err),
      );

      unsubSecurity = onSnapshot(
        doc(db, "config", "security"),
        (snap) => {
          if (snap.exists())
            setSecurityConfig(snap.data() as { blockedIps: string[] });
        },
        (err) => console.error(err),
      );

      const requestsQ = query(
        collection(db, "admin_requests"),
        orderBy("createdAt", "desc"),
        limit(50),
      );
      unsubRequests = onSnapshot(
        requestsQ,
        (snap) => {
          setAdminRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => console.error(err),
      );

      fetchGlobalBetsCount();
      const countInterval = setInterval(fetchGlobalBetsCount, 15000);

      return () => {
        if (unsubUsers) unsubUsers();
        if (unsubBets) unsubBets();
        if (unsubGames) unsubGames();
        if (unsubRequests) unsubRequests();
        if (unsubSecurity) unsubSecurity();
        clearInterval(countInterval);
        clearInterval(clockInterval);
      };
    }

    return () => clearInterval(clockInterval);
  }, [user]);

  const fetchGlobalBetsCount = async () => {
    try {
      const snap = await getCountFromServer(collection(db, "bets"));
      setGlobalBetsCount(snap.data().count);
    } catch (e) {
      console.warn("Could not get bet count", e);
    }
  };

  const updateUser = async (userId: string, updates: Partial<CustomUser>) => {
    setActionLoading(userId + Object.keys(updates)[0]);
    try {
      await updateDoc(doc(db, "users", userId), updates as any);
    } catch (e) {
      console.warn(e);
      alert("Erreur lors de la mise à jour");
    }
    setActionLoading(null);
  };

  const updateGameBanned = async (
    gameName: string,
    isBanned: boolean,
    reason: string,
  ) => {
    try {
      await updateDoc(doc(db, "config", "games"), {
        [`${gameName}`]: {
          banned: isBanned,
          reason,
          date: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateCategoryBanned = async (
    categoryName: string,
    isBanned: boolean,
    reason: string,
  ) => {
    try {
      await updateDoc(doc(db, "config", "games"), {
        [`categories.${categoryName}`]: {
          banned: isBanned,
          reason,
          date: new Date().toISOString(),
        },
      });
    } catch {
      await setDoc(
        doc(db, "config", "games"),
        {
          categories: {
            [`${categoryName}`]: {
              banned: isBanned,
              reason,
              date: new Date().toISOString(),
            },
          },
        },
        { merge: true },
      );
    }
  };

  const deleteUser = (userToDelete: CustomUser) => {
    if (
      [
        "lafrancaise.desjeux@outlook.fr",
        "romeo.brawlstars59@gmail.com",
        "mimizerzer27@gmail.com",
      ].includes(userToDelete.email || "")
    )
      return alert("Impossible de supprimer cet administrateur protégé.");
    if (userToDelete.id === user?.id)
      return alert("Vous ne pouvez pas vous supprimer vous-même.");
    
    setUserToDeleteConfirm(userToDelete);
  };

  const performDeleteUser = async () => {
    if (!userToDeleteConfirm) return;
    setActionLoading(userToDeleteConfirm.id + "delete");
    try {
      await deleteDoc(doc(db, "users", userToDeleteConfirm.id));
      setUserToDeleteConfirm(null);
    } catch (e) {
      console.warn(e);
    }
    setActionLoading(null);
  };

  const clearGlobalBets = async () => {
    const doubleConfirm = prompt(
      "TAPEZ 'PURGE' POUR SUPPRIMER TOUT L'HISTORIQUE DES PARIS (Irréversible):",
    );
    if (doubleConfirm !== "PURGE") return;
    alert(
      "Ce processus peut être long / impossible si > 500 documents sur FrontEnd. Veuillez utiliser Firebase Console -> Functions.",
    );
  };

  const handleEditClick = (u: CustomUser) => {
    setEditingUser(u);
    setEditForm({
      balance: u.balance,
      vault: u.vault || 0,
      balanceLimit: u.balanceLimit || 500000,
      maxiVault: u.maxiVault || 0,
      totalWagered: u.totalWagered || 0,
      totalWon: u.totalWon || 0,
      role: u.role || "user",
      status: u.status || "pending",
      rank: u.rank || "None",
      permissions: u.permissions || {},
      canAppealRank: u.canAppealRank !== false,
      canUseSupport: u.canUseSupport !== false,
    });
    setSuspensionMinutes("");
    setSuspensionDate("");
    setSuspensionTime("");
    setActionReason(
      u.status === "suspended"
        ? u.suspensionReason || ""
        : u.status === "banned"
          ? u.banReason || ""
          : "",
    );
    if (u.status === "suspended" && u.suspensionEndsAt) {
      const d = new Date(u.suspensionEndsAt);
      const minDiff = (u.suspensionEndsAt - Date.now()) / (60 * 1000);
      if (minDiff > 0 && minDiff < 24 * 60) {
        setSuspensionMinutes(Math.ceil(minDiff));
      }
      setSuspensionDate(d.toISOString().split("T")[0]);
      setSuspensionTime(d.toTimeString().slice(0, 5));
    }
    setEditTab("general");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      const finalUpdates: Partial<CustomUser> = { ...editForm };

      if (finalUpdates.status === "suspended") {
        if (suspensionMinutes !== "") {
          finalUpdates.suspensionEndsAt =
            Date.now() + Number(suspensionMinutes) * 60 * 1000;
        } else if (suspensionDate && suspensionTime) {
          const dateObj = new Date(`${suspensionDate}T${suspensionTime}`);
          finalUpdates.suspensionEndsAt = dateObj.getTime();
        }
        finalUpdates.suspensionReason = actionReason;
      } else if (finalUpdates.status === "banned") {
        finalUpdates.banReason = actionReason;
        finalUpdates.suspensionEndsAt = null as any;
      } else {
        finalUpdates.suspensionEndsAt = null as any;
      }

      await updateDoc(doc(db, "users", editingUser.id), finalUpdates as any);
      const isSelf = user?.id === editingUser.id;
      setEditingUser(null);
      if (
        (isSelf && finalUpdates.status === "suspended") ||
        finalUpdates.status === "banned"
      ) {
        window.location.reload();
      }
    } catch (e) {
      console.warn(e);
      alert("Erreur de sauvegarde.");
    }
    setEditLoading(false);
  };

  const chartData = useMemo(() => {
    return [...recentBets].reverse().map((b, i) => ({
      name: i,
      amount: b.betAmount,
      profit: b.payout - b.betAmount,
    }));
  }, [recentBets]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="bg-black/40 backdrop-blur-xl p-10 rounded-3xl text-center border border-red-500/20 max-w-lg w-full shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <ShieldAlert
            size={64}
            className="mx-auto text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          />
          <h2 className="text-3xl font-extrabold text-red-500 mb-3 tracking-tight">
            Accès Refusé
          </h2>
          <p className="text-gray-400 font-medium">
            Habilitation administrateur requise pour Network_Core.
          </p>
        </div>
      </div>
    );
  }

  const onlineUsers = users.filter(
    (u) => u.lastOnline && Date.now() - u.lastOnline < 5 * 60 * 1000,
  ).length;
  const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalVault = users.reduce((acc, u) => acc + (u.vault || 0), 0);
  const totalEconomy = totalBalance + totalVault;
  const totalWagered = users.reduce((acc, u) => acc + (u.totalWagered || 0), 0);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (userCategory === "En attente") return u.status === "pending";
    if (userCategory === "Approuvés")
      return u.status === "approved" || !u.status;
    if (userCategory === "Suspendus") return u.status === "suspended";
    if (userCategory === "Bannis") return u.status === "banned";

    return true; // "Tous"
  });

  const handleAdminRequestVal = async (
    req: any,
    status: "accepted" | "rejected",
    response: string,
  ) => {
    try {
      await updateDoc(doc(db, "admin_requests", req.id), {
        status,
        adminResponse: response,
        resolvedAt: Date.now(),
      });

      if (status === "accepted") {
        if (req.type === "ban_appeal") {
          await updateDoc(doc(db, "users", req.userId), {
            status: "approved",
            suspensionEndsAt: null,
            banAppealRequested: false,
          });
        } else if (req.type === "deposit") {
          const u = users.find((u) => u.id === req.userId);
          const today = new Date().toISOString().split("T")[0];
          const currentDailyCount =
            u?.dailyDeposits?.date === today ? u.dailyDeposits.count || 0 : 0;
          const currentDailyTotal =
            u?.dailyDeposits?.date === today
              ? u.dailyDeposits.totalAmount || 0
              : 0;

          await updateDoc(doc(db, "users", req.userId), {
            balance: increment(req.amount),
            "dailyDeposits.date": today,
            "dailyDeposits.count": currentDailyCount + 1,
            "dailyDeposits.totalAmount": currentDailyTotal + req.amount,
          });
        } else if (req.type === "withdraw") {
          await updateDoc(doc(db, "users", req.userId), {
            balance: increment(-req.amount),
          });
        } else if (req.type === "vault_in") {
          await updateDoc(doc(db, "users", req.userId), {
            balance: increment(-req.amount),
            vault: increment(req.amount),
          });
        } else if (req.type === "vault_out") {
          await updateDoc(doc(db, "users", req.userId), {
            balance: increment(req.amount),
            vault: increment(-req.amount),
          });
        } else if (req.type === "maxi_vault_unlock") {
          // Admin approves the unlock, moving actual maxiVault back to balance
          const targetUser = users.find((u) => u.id === req.userId);
          const currentMaxiVault = targetUser?.maxiVault || req.maxiVaultAmount || 0;
          await updateDoc(doc(db, "users", req.userId), {
            balance: increment(currentMaxiVault),
            maxiVault: 0,
            balanceLimit: increment(currentMaxiVault + 500000) // Increase limit significantly to allow the new balance
          });
        }
      } else {
        if (req.type === "ban_appeal") {
          await updateDoc(doc(db, "users", req.userId), {
            banAppealRequested: false,
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la résolution de la requête");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full text-white animate-in fade-in duration-500 pb-24">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Cpu className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Nexus Control
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400/80 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                SYSTEM: ONLINE / SECURED
              </div>
            </div>
          </div>
        </div>

        <div className="flex bg-black/40 border border-gray-800 rounded-xl p-1 gap-1 items-center">
          <button
            onClick={clearGlobalBets}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/30 px-5 py-2.5 rounded-lg font-bold transition-all text-sm group"
          >
            <AlertTriangle
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            Master Purge
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Réseau Utilisateurs"
          icon={<Users className="text-blue-500" size={22} />}
          value={users.length}
          sub={`${onlineUsers} Actifs en temps réel`}
          color="from-blue-600/20 to-blue-900/10"
          border="border-blue-500/20"
        />
        <StatCard
          title="Trésorerie Globale"
          icon={<Database className="text-emerald-500" size={22} />}
          value={`$${formatCurrency(totalEconomy)}`}
          sub={`$${formatCurrency(totalBalance)} S. / $${formatCurrency(totalVault)} C.`}
          color="from-emerald-600/20 to-emerald-900/10"
          border="border-emerald-500/20"
        />
        <StatCard
          title="Flux Parié Total"
          icon={<Activity className="text-purple-500" size={22} />}
          value={`$${formatCurrency(totalWagered)}`}
          sub="Capital misé à ce jour"
          color="from-purple-600/20 to-purple-900/10"
          border="border-purple-500/20"
        />

        {/* Trajectory Mini Chart Card */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-gray-800 p-5 flex flex-col justify-between relative overflow-hidden h-[140px]">
          <div className="z-10 relative">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">
                Trafic Live
              </span>
              <TrendingUp size={16} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {globalBetsCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Transactions Globales</p>
          </div>
          <div className="absolute inset-0 pt-16 z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  content={() => <div />}
                  cursor={{
                    stroke: "#4f46e5",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Interface Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setMainTab("users")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === "users" ? "bg-white/10 text-white border border-white/20" : "bg-black/40 text-gray-400 border border-transparent hover:bg-white/5"}`}
        >
          <Users size={18} /> Registre Utilisateurs
        </button>
        <button
          onClick={() => setMainTab("inbox")}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === "inbox" ? "bg-white/10 text-white border border-white/20" : "bg-black/40 text-gray-400 border border-transparent hover:bg-white/5"}`}
        >
          <Mail size={18} /> Boîte de réception
          {adminRequests.filter((r) => r.status === "pending").length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex flex-col items-center justify-center rounded-full font-bold shadow-lg">
              {adminRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab("games")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === "games" ? "bg-white/10 text-white border border-white/20" : "bg-black/40 text-gray-400 border border-transparent hover:bg-white/5"}`}
        >
          <Gamepad size={18} /> Configuration Jeux
        </button>
        <button
          onClick={() => setMainTab("security")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === "security" ? "bg-white/10 text-emerald-400 border border-white/20" : "bg-black/40 text-emerald-500/50 border border-transparent hover:bg-emerald-500/10 hover:text-emerald-400"}`}
        >
          <Shield size={18} /> Sécurité / IP
        </button>
      </div>

      {mainTab === "inbox" ? (
        <div className="bg-[#0f1923]/80 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl flex flex-col h-[700px] p-0 text-white overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-gray-900 to-[#0f1923]">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                <Inbox className="text-blue-400 w-6 h-6" /> 
                Boîte de réception
              </h2>
              <p className="text-sm text-gray-500 mt-1">Gérez les demandes utilisateurs avec précision.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-gray-800 self-stretch lg:self-auto">
              <button 
                onClick={() => setInboxFilter("all")} 
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex-1 lg:flex-none text-center ${inboxFilter === "all" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                Toutes ({adminRequests.length})
              </button>
              <button 
                onClick={() => setInboxFilter("pending")} 
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors flex-1 lg:flex-none text-center ${inboxFilter === "pending" ? "bg-yellow-500 text-black shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                <Clock size={14} className={inboxFilter === "pending" ? "text-black" : "text-yellow-500"} /> En attente
              </button>
              <button 
                onClick={() => setInboxFilter("accepted")} 
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors flex-1 lg:flex-none text-center ${inboxFilter === "accepted" ? "bg-emerald-500 text-black shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                <Check size={14} className={inboxFilter === "accepted" ? "text-black" : "text-emerald-500"} /> Acceptées
              </button>
              <button 
                onClick={() => setInboxFilter("rejected")} 
                className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors flex-1 lg:flex-none text-center ${inboxFilter === "rejected" ? "bg-red-500 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                <XCircle size={14} className={inboxFilter === "rejected" ? "text-white" : "text-red-500"} /> Refusées
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#09090b] custom-scrollbar shadow-inner relative">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[120px] pointer-events-none rounded-full"></div>
            {adminRequests.filter(r => inboxFilter === "all" || r.status === inboxFilter).length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black/40 rounded-3xl border border-gray-800/50 border-dashed backdrop-blur-sm mx-auto max-w-lg mt-10">
                 <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                   <Inbox className="text-gray-600 w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Aucune requête trouvée</h3>
                 <p className="text-gray-500 font-medium">Aucune demande ne correspond à ce filtre pour le moment.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max relative z-10 w-full">
                {adminRequests.filter(r => inboxFilter === "all" || r.status === inboxFilter).map((req) => {
                  const targetUser = users.find(u => u.id === req.userId);
                  const currentMaxiVault = targetUser?.maxiVault || 0;
                  
                  // Icon/Color Mapping Based On Request Type
                  let TypeIcon = ArrowDownCircle;
                  let typeColor = "text-emerald-400";
                  let typeBg = "bg-emerald-500/10";
                  let typeBorder = "border-emerald-500/30";
                  let glowColor = "bg-emerald-500/10";
                  
                  if (req.type === "rank_upgrade") {
                    TypeIcon = ArrowUpCircle;
                    typeColor = "text-purple-400";
                    typeBg = "bg-purple-500/10";
                    typeBorder = "border-purple-500/30";
                    glowColor = "bg-purple-500/10";
                  } else if (req.type === "ban_appeal") {
                    TypeIcon = ShieldAlert;
                    typeColor = "text-rose-400";
                    typeBg = "bg-rose-500/10";
                    typeBorder = "border-rose-500/30";
                    glowColor = "bg-rose-500/10";
                  } else if (req.type === "maxi_vault_unlock") {
                    TypeIcon = LockOpen;
                    typeColor = "text-amber-400";
                    typeBg = "bg-amber-500/10";
                    typeBorder = "border-amber-500/40";
                    glowColor = "bg-amber-500/10";
                  } else if (req.type === "support_message") {
                    TypeIcon = Mail;
                    typeColor = "text-blue-400";
                    typeBg = "bg-blue-500/10";
                    typeBorder = "border-blue-500/30";
                    glowColor = "bg-blue-500/10";
                  } else if (req.type === "vault_in" || req.type === "vault_out") {
                    TypeIcon = req.type === "vault_in" ? Archive : ArchiveRestore;
                    typeColor = "text-indigo-400";
                    typeBg = "bg-indigo-500/10";
                    typeBorder = "border-indigo-500/30";
                    glowColor = "bg-indigo-500/10";
                  }

                  return (
                    <div
                      key={req.id}
                      className={`relative bg-[#0b1219] border ${req.status === "pending" ? typeBorder + " shadow-xl shadow-black/50" : "border-gray-800 opacity-70 hover:opacity-100"} rounded-3xl p-6 flex flex-col gap-4 transition-all overflow-hidden group w-full`}
                    >
                      {/* Gradient glow for pending */}
                      {req.status === "pending" && (
                        <div className={`absolute top-0 right-0 w-48 h-48 ${glowColor} rounded-full blur-[60px] pointer-events-none -mr-10 -mt-10 opacity-70`}></div>
                      )}

                      <div className="flex justify-between items-start z-10 w-full relative">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${typeBg} ${typeColor} ${typeBorder} shadow-lg shrink-0`}>
                            <TypeIcon size={24} />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <span
                              className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-black/50 border border-gray-700/60 text-gray-300 mb-2 truncate max-w-full`}
                            >
                              {req.type === "rank_upgrade"
                                ? "Évolution de grade"
                                : req.type === "ban_appeal"
                                  ? "Dmd de déban"
                                  : req.type === "deposit"
                                    ? "Achat - Dmd"
                                    : req.type === "withdraw"
                                      ? "Retrait - Dmd"
                                      : req.type === "vault_in"
                                        ? "Vault In - Dmd"
                                        : req.type === "maxi_vault_unlock"
                                          ? "Débloquer Maxi Vault"
                                          : req.type === "support_message"
                                            ? "Message Support"
                                            : "Vault Out - Dmd"}
                            </span>
                            <h3 className="font-black text-lg text-white mb-0.5 truncate w-full" title={req.username}>
                              {req.username}
                            </h3>
                            <button 
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono tracking-tight text-left block truncate w-full"
                              onClick={() => {
                                const u = users.find(u => u.id === req.userId);
                                if(u) handleEditClick(u);
                              }}
                            >
                              {req.userEmail}
                            </button>
                          </div>
                        </div>

                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                            req.status === "pending" 
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" 
                              : req.status === "accepted" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          } shrink-0 mt-1`}
                          title={req.status === "pending" ? "En attente" : req.status === "accepted" ? "Accepté" : "Refusé"}
                        >
                          {req.status === "pending" ? <Clock size={14} /> : req.status === "accepted" ? <Check size={14} /> : <XCircle size={14} />}
                        </div>
                      </div>
                      
                      {/* Detailed Module Content */}
                      <div className="bg-gradient-to-br from-[#121c26] to-[#0c131a] rounded-2xl p-4 border border-gray-800/80 z-10 flex flex-col gap-3 flex-1 shadow-inner mt-2">
                        {req.message && (
                          <div className="bg-black/60 p-4 rounded-xl border border-gray-700/50 mb-1 flex-1 shadow-inner">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-2 font-mono">Message utilisateur</span>
                            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{req.message}</div>
                          </div>
                        )}
                        {req.type === "maxi_vault_unlock" && (
                          <div className="flex items-center justify-between p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                            <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">Maxi Vault Bloqué</span>
                            <div className="text-amber-500 font-mono font-black text-lg flex items-center gap-1.5">
                              <Lock size={14} /> ${currentMaxiVault.toFixed(2)}
                            </div>
                          </div>
                        )}
                        {req.amount !== undefined && req.type !== "maxi_vault_unlock" && (
                          <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Montant Exigé</span>
                            <div className="text-emerald-400 font-mono font-black text-xl">
                              ${req.amount.toFixed(2)}{" "}
                              {req.crypto ? <span className="text-[10px] text-emerald-900 bg-emerald-400 px-1.5 py-0.5 rounded ml-1 font-bold">{req.crypto}</span> : ""}
                            </div>
                          </div>
                        )}
                        {req.method && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Moyen Transfert</span>
                            <span className="text-xs font-bold text-gray-300 uppercase bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">
                              {req.method}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/60">
                           <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                             <Clock size={12} className="text-gray-600" /> {new Date(req.createdAt).toLocaleString("fr-FR")}
                           </span>
                        </div>
                      </div>

                      {/* Request Action Area */}
                      <div className="z-10 mt-1">
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const response = prompt(
                                  "Message d'acceptation (optionnel) :",
                                );
                                if (response !== null)
                                  handleAdminRequestVal(req, "accepted", response);
                              }}
                              className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 hover:border-emerald-500 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <Check size={16} /> Accepter
                            </button>
                            <button
                              onClick={() => {
                                const response = prompt(
                                  "Raison du refus (optionnel) :",
                                );
                                if (response !== null)
                                  handleAdminRequestVal(req, "rejected", response);
                              }}
                              className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 hover:border-rose-500 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
                            >
                              <X size={16} /> Refuser
                            </button>
                          </div>
                        ) : (
                          req.adminResponse ? (
                            <div className="bg-indigo-900/10 p-4 rounded-xl border border-indigo-500/20 text-sm flex gap-3 items-start relative overflow-hidden">
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500"></div>
                              <div className="mt-0.5">
                                <Monitor size={16} className="text-indigo-400" />
                              </div>
                              <div className="flex-1 text-left">
                                <span className="font-bold text-indigo-400/80 text-[10px] uppercase tracking-wider block mb-1">
                                  Réponse SYS.ADMIN
                                </span>
                                <span className="text-gray-200 font-medium italic">"{req.adminResponse}"</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-xs font-bold text-gray-500 bg-gray-900/50 py-3 rounded-xl border border-gray-800/60 uppercase tracking-widest flex items-center justify-center gap-2">
                              <Archive size={14} className="text-gray-600" /> Archivée / Traitée
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : mainTab === "users" ? (
        /* Main Table Interface */
        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
          {/* Table Toolbar */}
          <div className="p-6 border-b border-gray-800 flex flex-col justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center border border-gray-700">
                <Eye size={20} className="text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Registre des Identités
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                  Surveillance Synchrone
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex bg-[#0f1923] p-1 rounded-xl border border-gray-800 w-full md:w-auto overflow-x-auto">
                {["Tous", "En attente", "Approuvés", "Suspendus", "Bannis"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setUserCategory(cat as any)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${userCategory === cat ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>
              <div className="relative w-full md:w-96 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Identifier un citoyen (UID...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl py-2.5 pl-12 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-black/40 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-800">
                  <th className="py-4 px-6 font-medium">Sujet</th>
                  <th className="py-4 px-6 font-medium text-center">
                    Niveau / Grade
                  </th>
                  <th className="py-4 px-6 font-medium">État Sécuritaire</th>
                  <th className="py-4 px-6 font-medium">Capitaux</th>
                  <th className="py-4 px-6 font-medium text-center">
                    Interventions Directes
                  </th>
                  <th className="py-4 px-6 font-medium text-right">
                    Manipulation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="w-12 h-12 border-4 border-gray-800 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="font-mono text-xs tracking-widest uppercase">
                          Acquisition des cibles...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-500">
                      <Search size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg">
                        Aucun enregistrement
                      </p>
                      <p className="text-sm font-mono mt-1 opacity-60">
                        Matrice de recherche vide pour : {searchQuery}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOnline =
                      u.lastOnline && now - u.lastOnline < 2 * 60 * 1000;
                    const isProtectedAdmin = [
                      "lafrancaise.desjeux@outlook.fr",
                      "romeo.brawlstars59@gmail.com",
                      "mimizerzer27@gmail.com",
                    ].includes(u.email || "");
                    const isSelf = user?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* P1: Identity */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.username}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-700 shadow-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase">
                                  {u.username.substring(0, 2)}
                                </div>
                              )}
                              <div
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] shadow-sm ${isOnline ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-gray-600"}`}
                                title={isOnline ? "Active" : "Offline"}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-200 truncate flex items-center gap-2 text-base">
                                {u.username}
                                {isSelf && (
                                  <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-indigo-500/30">
                                    Moi
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-xs text-gray-500 truncate"
                                title={u.email}
                              >
                                {u.email || "Anonyme"}
                              </div>
                              <div
                                className="text-[10px] text-gray-600 font-mono mt-0.5"
                                title={u.id}
                              >
                                UID: {u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* P2: Role & Rank */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max
                           ${
                             u.role === "admin"
                               ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                               : "bg-gray-800 text-gray-400 border border-gray-700"
                           }`}
                            >
                              {u.role === "admin" ? (
                                <Shield size={12} />
                              ) : (
                                <Users size={12} />
                              )}
                              {u.role || "user"}
                            </span>
                            <RankBadge
                              rank={u.rank}
                              className="h-5 drop-shadow-md"
                            />
                          </div>
                        </td>

                        {/* P3: Status */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full 
                         ${
                           u.status === "approved"
                             ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                             : u.status === "suspended"
                               ? "bg-amber-500 animate-pulse"
                               : u.status === "banned"
                                 ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                                 : "bg-gray-500"
                         }
                       `}
                            />
                            <span
                              className={`text-sm font-semibold 
                         ${
                           u.status === "approved"
                             ? "text-emerald-400"
                             : u.status === "suspended"
                               ? "text-amber-400"
                               : u.status === "banned"
                                 ? "text-red-400"
                                 : "text-gray-400"
                         }`}
                            >
                              {u.status === "approved"
                                ? "Vérifié"
                                : u.status === "suspended"
                                  ? "Suspendu"
                                  : u.status === "banned"
                                    ? "Banni"
                                    : "En attente"}
                            </span>
                          </div>
                        </td>

                        {/* P4: Finances */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1 w-full max-w-[160px] bg-black/30 p-2.5 rounded-lg border border-gray-800/50">
                            <div className="font-mono text-emerald-400 text-sm font-bold flex justify-between w-full items-center">
                              <span className="text-gray-500 text-[10px] font-sans uppercase font-bold tracking-wider">
                                Main
                              </span>
                              <span>{formatCurrency(u.balance)}$</span>
                            </div>
                            <div className="w-full h-px bg-gray-800 my-0.5"></div>
                            <div className="font-mono text-gray-300 text-sm flex justify-between w-full items-center">
                              <span className="text-gray-500 text-[10px] font-sans uppercase font-bold tracking-wider">
                                Safe
                              </span>
                              <span>{formatCurrency(u.vault || 0)}$</span>
                            </div>
                          </div>
                        </td>

                        {/* P5: Quick Actions (Guarded) */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            {isSelf || isProtectedAdmin ? (
                              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                                <Lock size={12} className="inline mr-1" />{" "}
                                Protégé
                              </span>
                            ) : (
                              <>
                                {u.status !== "approved" && (
                                  <button
                                    onClick={() =>
                                      updateUser(u.id, {
                                        status: "approved",
                                        suspensionEndsAt: undefined,
                                      })
                                    }
                                    disabled={actionLoading === u.id + "status"}
                                    className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                    title="Débloquer / Approuver"
                                  >
                                    {actionLoading === u.id + "status" ? (
                                      <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Unlock size={14} />
                                    )}
                                  </button>
                                )}
                                {u.status !== "suspended" && (
                                  <button
                                    onClick={() =>
                                      updateUser(u.id, { status: "suspended" })
                                    }
                                    disabled={actionLoading === u.id + "status"}
                                    className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                    title="Suspendre Temporairement"
                                  >
                                    {actionLoading === u.id + "status" ? (
                                      <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <ShieldAlert size={14} />
                                    )}
                                  </button>
                                )}
                                {u.status !== "banned" && (
                                  <button
                                    onClick={() =>
                                      updateUser(u.id, { status: "banned" })
                                    }
                                    disabled={actionLoading === u.id + "status"}
                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                    title="Bannir Définitivement"
                                  >
                                    {actionLoading === u.id + "status" ? (
                                      <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Gavel size={14} />
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* P6: Panel / Delete */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(u)}
                              disabled={actionLoading?.startsWith(u.id)}
                              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-lg transition-all text-xs font-bold flex items-center gap-2 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50"
                            >
                              <Settings
                                size={14}
                                className="group-hover:rotate-90 transition-transform duration-500"
                              />{" "}
                              Paramétrer
                            </button>

                            {!isProtectedAdmin && !isSelf && (
                              <button
                                onClick={() => deleteUser(u)}
                                disabled={actionLoading?.startsWith(u.id)}
                                className="w-9 h-9 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 rounded-lg transition-all disabled:opacity-50"
                                title="Effacer Entité"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : mainTab === "games" ? (
        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl p-8 min-h-[600px] flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-gray-800 pb-4">
              <Gamepad className="text-emerald-500" /> Gestion Globale des
              Catégories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max mb-8">
              {[
                "originals",
                "slots",
                "evolution",
                "stake-gaming",
                "grattage",
              ].map((cat) => {
                const config = gamesConfig?.["categories"]?.[cat] || {
                  banned: false,
                  reason: "",
                };
                const isBanned = config.banned;

                return (
                  <div
                    key={cat}
                    className="bg-black/40 border border-gray-800 rounded-xl p-5 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-white capitalize">
                        {cat}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-bold ${isBanned ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}
                      >
                        {isBanned ? "BLOQUÉ" : "ACTIF"}
                      </span>
                    </div>

                    {isBanned ? (
                      <button
                        onClick={() => updateCategoryBanned(cat, false, "")}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded mt-auto"
                      >
                        Débloquer
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 mt-auto">
                        <input
                          id={`cat-reason-${cat}`}
                          type="text"
                          placeholder="Raison (ex: Maintenance)"
                          className="bg-black/50 border border-gray-700 rounded p-2 text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            const r =
                              (
                                document.getElementById(
                                  `cat-reason-${cat}`,
                                ) as HTMLInputElement
                              )?.value || "Maintenance";
                            updateCategoryBanned(cat, true, r);
                          }}
                          className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 font-bold rounded border border-red-500/50"
                        >
                          Bloquer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-gray-800 pb-4">
              <Gamepad className="text-emerald-500" /> Gestion Globale des Jeux
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
              {ALL_GAMES.map((g) => g.name).map((game) => {
                const config = gamesConfig?.[game] || {
                  banned: false,
                  reason: "",
                };
                const isBanned = config.banned;

                return (
                  <div
                    key={game}
                    className="bg-black/40 border border-gray-800 rounded-xl p-5 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-white">
                        {game}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isBanned ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"}`}
                      >
                        {isBanned ? "Bloqué" : "En Ligne"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Statut / Raison
                      </label>
                      <select
                        value={
                          isBanned
                            ? config.reason || "En construction"
                            : "online"
                        }
                        onChange={(e) => {
                          if (e.target.value === "online") {
                            updateGameBanned(game, false, "");
                          } else {
                            updateGameBanned(game, true, e.target.value);
                          }
                        }}
                        className="bg-[#0c0c0e] text-white p-3 rounded-lg border border-gray-800 focus:border-emerald-500/50 outline-none w-full"
                      >
                        <option value="online">En Ligne (Actif)</option>
                        <option value="En conclusion">En conclusion</option>
                        <option value="En construction">En construction</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Mise à jour">Mise à jour (MAJ)</option>
                        <option value="Ban Définitif">Ban Définitif</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : mainTab === "security" ? (
        <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl p-8 min-h-[600px] flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-gray-800 pb-4">
            <Shield className="text-emerald-500" /> Centre de Sécurité &
            Filtrage IP
          </h2>

          <div className="flex flex-col gap-6">
            <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Lock className="text-amber-500 w-5 h-5" /> Mode d'Accès de
                l'Application
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                Bloque temporairement l'application pour tous les utilisateurs
                non-administrateurs avec un écran spécifique.
              </p>

              {globalAppStatus?.maintenance && (
                <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-amber-500 font-bold mb-1">
                      Cible :{" "}
                      {globalAppStatus.blockedDevices?.length
                        ? globalAppStatus.blockedDevices
                            .join(", ")
                            .toUpperCase()
                        : "TOUS LES APPAREILS"}
                    </div>
                    <div className="text-amber-400/80 text-sm">
                      Veuillez vous déconnecter ou utiliser le mode navigation
                      privée (sur l'appareil ciblé) pour voir la page de
                      restriction. En tant qu'admin, vous ne serez pas bloqué.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={async () => {
                    await setDoc(
                      doc(db, "config", "app"),
                      {
                        maintenance: false,
                        mode: "active",
                        blockedDevices: [],
                        endTime: null,
                        autoUnlock: false,
                      },
                      { merge: true },
                    );
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${globalAppStatus?.mode === "active" || (!globalAppStatus?.maintenance && !globalAppStatus?.mode) ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                >
                  <Unlock size={18} /> Actif
                </button>

                <button
                  onClick={() => {
                    setLockTargetMode("maintenance");
                    setLockBlockedDevices(
                      globalAppStatus?.blockedDevices || [],
                    );
                    setShowLockModal(true);
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${globalAppStatus?.mode === "maintenance" || (globalAppStatus?.maintenance && !globalAppStatus?.mode) ? "bg-amber-500 hover:bg-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                >
                  <Lock size={18} /> Maintenance
                </button>

                <button
                  onClick={() => {
                    setLockTargetMode("arret");
                    setLockBlockedDevices(
                      globalAppStatus?.blockedDevices || [],
                    );
                    setShowLockModal(true);
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${globalAppStatus?.mode === "arret" ? "bg-rose-500 hover:bg-rose-600 text-black shadow-[0_0_15px_rgba(244,63,94,0.5)]" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                >
                  <Lock size={18} /> Arrêt
                </button>

                <button
                  onClick={() => {
                    setLockTargetMode("moderation");
                    setLockBlockedDevices(
                      globalAppStatus?.blockedDevices || [],
                    );
                    setShowLockModal(true);
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${globalAppStatus?.mode === "moderation" ? "bg-blue-500 hover:bg-blue-600 text-black shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                >
                  <Lock size={18} /> Modération
                </button>
              </div>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="text-rose-500 w-5 h-5" /> Adresses IP
                Bloquées
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                Les utilisateurs avec une adresse IP dans cette liste se verront
                refuser l'accès au site totalement, y compris la création de
                compte et la navigation.
              </p>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Ajouter une IP (ex: 192.168.1.1)"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="flex-1 bg-[#0c0c0e] border border-gray-800 p-3 rounded-xl text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={async () => {
                    if (!newIp.trim()) return;
                    const updated = [
                      ...(securityConfig?.blockedIps || []),
                      newIp.trim(),
                    ];
                    await setDoc(
                      doc(db, "config", "security"),
                      { blockedIps: updated },
                      { merge: true },
                    );
                    setNewIp("");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 font-bold rounded-xl whitespace-nowrap transition-colors flex items-center justify-center gap-2"
                >
                  Ajouter l'IP
                </button>
              </div>

              <div className="space-y-2">
                {!securityConfig?.blockedIps ||
                securityConfig.blockedIps.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-gray-800 rounded-xl text-gray-600 font-medium">
                    Aucune adresse IP n'est actuellement bloquée.
                  </div>
                ) : (
                  securityConfig.blockedIps.map((ip) => (
                    <div
                      key={ip}
                      className="flex justify-between items-center bg-[#0c0c0e] border border-gray-800 p-3 rounded-lg px-4 hover:border-gray-600 transition-colors"
                    >
                      <span className="font-mono text-gray-300 font-bold">
                        {ip}
                      </span>
                      <button
                        onClick={async () => {
                          const updated = securityConfig.blockedIps.filter(
                            (i) => i !== ip,
                          );
                          await setDoc(
                            doc(db, "config", "security"),
                            { blockedIps: updated },
                            { merge: true },
                          );
                        }}
                        className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Editing Modal (Command Center Style) */}
      {editingUser ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-gray-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 via-[#09090b] to-[#09090b] flex-shrink-0">
              <div className="flex items-center gap-5">
                <div className="relative">
                  {editingUser.photoURL ? (
                    <img
                      src={editingUser.photoURL}
                      alt={editingUser.username}
                      className="w-16 h-16 rounded-xl border border-gray-700 shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 text-white rounded-xl flex items-center justify-center uppercase font-black text-2xl shadow-xl border border-gray-700">
                      {editingUser.username.substring(0, 2)}
                    </div>
                  )}
                  {editingUser.lastOnline &&
                    Date.now() - editingUser.lastOnline < 5 * 60 * 1000 && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-[#09090b] rounded-full shadow-[0_0_8px_#10b981]"></div>
                    )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      {editingUser.username}
                    </h2>
                    {user?.id === editingUser.id && (
                      <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                        Votre Compte
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 items-center font-mono text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Cpu size={12} className="text-indigo-500" />{" "}
                      {editingUser.email || "NO-EMAIL"}
                    </span>
                    <span>|</span>
                    <span title={editingUser.id} className="text-gray-600">
                      ID: {editingUser.id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-white bg-gray-900 hover:bg-gray-800 p-3 rounded-xl transition-all border border-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Side Nav */}
              <div className="md:w-64 border-r border-gray-800 bg-[#0c0c0e] flex flex-row md:flex-col p-4 gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                <NavButton
                  active={editTab === "general"}
                  onClick={() => setEditTab("general")}
                  icon={<Settings size={18} />}
                  label="Accréditations"
                  color="text-indigo-400"
                  bg="bg-indigo-500/10"
                />
                <NavButton
                  active={editTab === "finances"}
                  onClick={() => setEditTab("finances")}
                  icon={<DollarSign size={18} />}
                  label="Ressources"
                  color="text-emerald-400"
                  bg="bg-emerald-500/10"
                />
                <NavButton
                  active={editTab === "permissions"}
                  onClick={() => setEditTab("permissions")}
                  icon={<ShieldAlert size={18} />}
                  label="Restrictions"
                  color="text-rose-400"
                  bg="bg-rose-500/10"
                />
                <NavButton
                  active={editTab === "history"}
                  onClick={() => setEditTab("history")}
                  icon={<History size={18} />}
                  label="Journaux (Logs)"
                  color="text-purple-400"
                  bg="bg-purple-500/10"
                  badge={recentBets
                    .filter((b) => b.userId === editingUser.id)
                    .length.toString()}
                />
              </div>

              {/* Editing Body */}
              <div className="flex-1 overflow-y-auto bg-[#09090b] p-6 lg:p-10 custom-scrollbar relative">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full"></div>

                <form
                  id="edit-user-form"
                  onSubmit={handleSaveEdit}
                  className="relative z-10 max-w-3xl mx-auto"
                >
                  {editTab === "general" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <FormSection
                        title="Classification & Accès Serveur"
                        icon={<Shield className="text-indigo-400" />}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormSelect
                            label="Niveau d'Administration"
                            value={editForm.role || "user"}
                            onChange={(val: any) =>
                              setEditForm({
                                ...editForm,
                                role: val as "admin" | "user",
                              })
                            }
                            disabled={
                              [
                                "lafrancaise.desjeux@outlook.fr",
                                "romeo.brawlstars59@gmail.com",
                                "mimizerzer27@gmail.com",
                              ].includes(editingUser.email || "") ||
                              user?.id === editingUser.id
                            }
                            options={[
                              { value: "user", label: "Utilisateur Standard" },
                              { value: "admin", label: "Agent Nexus (Admin)" },
                            ]}
                          />

                          <FormSelect
                            label="Statut Opérationnel"
                            value={editForm.status || "pending"}
                            onChange={(val: any) =>
                              setEditForm({ ...editForm, status: val as any })
                            }
                            disabled={
                              [
                                "lafrancaise.desjeux@outlook.fr",
                                "romeo.brawlstars59@gmail.com",
                                "mimizerzer27@gmail.com",
                              ].includes(editingUser.email || "") ||
                              user?.id === editingUser.id
                            }
                            options={[
                              {
                                value: "approved",
                                label: "✅ Signal Clair (Approuvé)",
                              },
                              {
                                value: "pending",
                                label: "⏳ En attente de contrôle...",
                              },
                              {
                                value: "suspended",
                                label: "⚠️ Isolation Temporaire",
                              },
                              {
                                value: "banned",
                                label: "❌ Radiation du Réseau (Ban)",
                              },
                            ]}
                          />

                          {(editForm.status === "suspended" ||
                            editForm.status === "banned") &&
                            ![
                              "lafrancaise.desjeux@outlook.fr",
                              "romeo.brawlstars59@gmail.com",
                              "mimizerzer27@gmail.com",
                            ].includes(editingUser.email || "") &&
                            user?.id !== editingUser.id && (
                              <div className="md:col-span-2 p-5 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
                                <label className="text-sm font-bold text-red-500 flex items-center gap-2">
                                  <AlertTriangle size={16} /> Motif de la
                                  sanction (Visible par l'utilisateur)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Fraude détectée, Multi-compte..."
                                  value={actionReason}
                                  onChange={(e) =>
                                    setActionReason(e.target.value)
                                  }
                                  className="bg-black text-red-400 p-3 rounded-lg border border-red-500/30 focus:border-red-500 outline-none w-full"
                                />

                                {editForm.status === "suspended" && (
                                  <>
                                    <label className="text-sm font-bold text-amber-500 flex items-center gap-2 mt-4">
                                      <AlertTriangle size={16} /> Fin de
                                      l'isolation (Par Date ou Minutes)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-xs text-amber-500/70 block mb-1">
                                          Durée (Minutes)
                                        </span>
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          placeholder="Laisser vide pour permanent ou utiliser la date"
                                          value={suspensionMinutes}
                                          onChange={(e) => {
                                            setSuspensionMinutes(
                                              e.target.value !== ""
                                                ? Number(e.target.value)
                                                : "",
                                            );
                                            setSuspensionDate("");
                                            setSuspensionTime("");
                                          }}
                                          className="bg-black text-amber-500 font-mono text-lg p-3 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none placeholder:text-amber-500/30 w-full"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="w-full">
                                          <span className="text-xs text-amber-500/70 block mb-1">
                                            Date Expiration
                                          </span>
                                          <input
                                            type="date"
                                            value={suspensionDate}
                                            onChange={(e) => {
                                              setSuspensionDate(e.target.value);
                                              setSuspensionMinutes("");
                                            }}
                                            className="bg-black text-amber-500 block p-3 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none w-full"
                                          />
                                        </div>
                                        <div className="w-full">
                                          <span className="text-xs text-amber-500/70 block mb-1">
                                            Heure
                                          </span>
                                          <input
                                            type="time"
                                            value={suspensionTime}
                                            onChange={(e) => {
                                              setSuspensionTime(e.target.value);
                                              setSuspensionMinutes("");
                                            }}
                                            className="bg-black text-amber-500 block p-3 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none w-full"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                          <div className="md:col-span-2">
                            <FormSelect
                              label="Échelon Social (Rank Override)"
                              value={editForm.rank || "None"}
                              onChange={(val: any) =>
                                setEditForm({
                                  ...editForm,
                                  rank: val as UserRank,
                                })
                              }
                              options={[
                                { value: "None", label: "Civile (Aucun)" },
                                { value: "Bronze", label: "Niveau Bronze" },
                                { value: "Silver", label: "Niveau Argent" },
                                { value: "Gold", label: "Niveau Or" },
                                { value: "Platinum", label: "Niveau Platine" },
                                {
                                  value: "Diamond",
                                  label: "Niveau Diamant 💎",
                                },
                                { value: "Champion", label: "Champion 🏆" },
                                {
                                  value: "Grand Champion",
                                  label: "Grand Champion 🎖️",
                                },
                                {
                                  value: "Supersonic Legend",
                                  label: "Supersonic Legend ⚡",
                                },
                              ]}
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection
                        title="Traces Réseau"
                        icon={
                          <Monitor size={18} className="text-emerald-400" />
                        }
                      >
                        <div className="bg-black/20 border border-gray-800 rounded-xl p-5 mt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <label className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1 block">
                                Adresse IP Connue
                              </label>
                              <div className="text-emerald-400 font-mono text-lg">
                                {editingUser?.lastIp || "Inconnue"}
                              </div>
                            </div>
                            {editingUser?.lastIp && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  const confirmed = window.confirm(
                                    `Voulez-vous vraiment bloquer l'IP ${editingUser.lastIp} ?`,
                                  );
                                  if (confirmed) {
                                    const updated = [
                                      ...(securityConfig?.blockedIps || []),
                                      editingUser.lastIp,
                                    ];
                                    await setDoc(
                                      doc(db, "config", "security"),
                                      {
                                        blockedIps: Array.from(
                                          new Set(updated),
                                        ),
                                      },
                                      { merge: true },
                                    );
                                  }
                                }}
                                disabled={securityConfig?.blockedIps?.includes(
                                  editingUser.lastIp,
                                )}
                                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                  securityConfig?.blockedIps?.includes(
                                    editingUser.lastIp,
                                  )
                                    ? "bg-rose-500/10 text-rose-500/50 cursor-not-allowed border border-rose-500/10"
                                    : "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                }`}
                              >
                                {securityConfig?.blockedIps?.includes(
                                  editingUser.lastIp,
                                )
                                  ? "IP Déjà Bloquée"
                                  : "Bloquer cette IP"}
                              </button>
                            )}
                          </div>
                        </div>
                      </FormSection>
                    </div>
                  )}

                  {editTab === "finances" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <FormSection
                        title="Ressources & Capital"
                        icon={<DollarSign className="text-emerald-400" />}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          {/* Liquidité Container */}
                          <div className="bg-gradient-to-br from-[#0c0c0e] to-black p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Database size={14} className="text-emerald-400" /> Solde Courant (Liquide)
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xl">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.balance ?? ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, balance: Number(e.target.value) })
                                }
                                className="bg-black/50 text-emerald-400 font-mono font-black text-2xl p-4 pl-10 rounded-xl border border-gray-800 focus:border-emerald-500/50 outline-none w-full transition-all hover:bg-black"
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 text-right">Montant directement jouable.</p>
                          </div>

                          {/* Vault Container */}
                          <div className="bg-gradient-to-br from-[#0c0c0e] to-black p-5 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Lock size={14} className="text-blue-400" /> Réserve Sécurisée (Coffre)
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xl">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.vault ?? ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, vault: Number(e.target.value) })
                                }
                                className="bg-black/50 text-blue-400 font-mono font-black text-2xl p-4 pl-10 rounded-xl border border-gray-800 focus:border-blue-500/50 outline-none w-full transition-all hover:bg-black"
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 text-right">Fonds stockés par l'utilisateur.</p>
                          </div>
                        </div>

                        {/* Limits and Maxi Vault container */}
                        <div className="mt-6 p-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-red-500/20 p-[1px]">
                          <div className="bg-[#09090b] p-5 rounded-[15px] grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={14} /> Seuil Lock (Balance Limit)
                              </label>
                              <div className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</span>
                                  <input
                                    type="number"
                                    value={editForm.balanceLimit ?? 500000}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, balanceLimit: Number(e.target.value) })
                                    }
                                    className="bg-black/80 text-purple-300 font-mono text-lg p-3 pl-8 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none w-full transition-all hover:bg-black"
                                  />
                                </div>
                                <button className="p-3 bg-purple-500/10 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors border border-purple-500/20" title="Reset default (500k)" onClick={() => setEditForm({...editForm, balanceLimit: 500000})}>
                                  <RotateCcw size={16} />
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1.5"><ShieldAlert size={10} /> Déclenche le transfert Maxi Vault automatique.</p>
                            </div>

                            <div className="space-y-3 relative">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                              <label className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={14} /> Vault Administratif (Maxi Vault)
                              </label>
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50 font-mono text-sm">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.maxiVault ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, maxiVault: Number(e.target.value) })
                                  }
                                  className="bg-[#110e05] text-amber-400 font-mono font-bold text-lg p-3 pl-8 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none w-full transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] focus:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                />
                              </div>
                              <div className="flex gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      balance: (prev.balance || 0) + (prev.maxiVault || 0),
                                      balanceLimit: (prev.balanceLimit || 500000) + (prev.maxiVault || 0) + 500000,
                                      maxiVault: 0
                                    }));
                                  }}
                                  className="flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                                >
                                  <Unlock size={12} /> Débloquer vers Solde
                                </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if(confirm("Confirmer la purge de ce maxi vault ? Cet argent disparaîtra définitivement.")) {
                                        setEditForm(prev => ({ ...prev, maxiVault: 0 }));
                                      }
                                    }}
                                    className="py-1.5 px-3 flex items-center justify-center text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 rounded transition-colors"
                                    title="Brûler (Effacer)"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </FormSection>

                      <FormSection
                        title="Statistiques & Falsification"
                        icon={<Monitor className="text-indigo-400" />}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800/80 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                              Volume Parié Total Fictif
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.totalWagered ?? ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, totalWagered: Number(e.target.value) })
                                }
                                className="bg-[#09090b] text-gray-300 font-mono p-2.5 pl-7 rounded-lg border border-gray-800 outline-none w-full focus:border-indigo-500/50 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                              Gains Totaux Fictifs
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.totalWon ?? ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, totalWon: Number(e.target.value) })
                                }
                                className="bg-[#09090b] text-gray-300 font-mono p-2.5 pl-7 rounded-lg border border-gray-800 outline-none w-full focus:border-indigo-500/50 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </FormSection>

                      <FormSection
                        title="Opérations Rapides"
                        icon={<TrendingUp className="text-emerald-400" />}
                      >
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                balance: (editForm.balance || 0) + 1000,
                              })
                            }
                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors text-sm font-bold truncate"
                          >
                            + 1 000 $
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                balance: (editForm.balance || 0) + 100000,
                              })
                            }
                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors text-sm font-bold truncate"
                          >
                            + 100 000 $
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({ ...editForm, balance: 0, vault: 0 })
                            }
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors text-sm font-bold truncate"
                          >
                            Vider les comptes (0$)
                          </button>
                        </div>
                      </FormSection>
                    </div>
                  )}

                  {editTab === "permissions" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <FormSection
                        title="Restrictions du Réseau"
                        icon={<Settings className="text-rose-400" />}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                          {/* Comm & Support */}
                          <div className="bg-gradient-to-br from-[#0c1015] to-[#090b0e] border border-gray-800/80 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[50px] rounded-full"></div>
                            <h4 className="font-black text-white flex items-center gap-2 mb-6 text-sm uppercase tracking-widest relative z-10">
                              <Mail size={16} className="text-blue-400" />
                              Communications
                            </h4>
                            <div className="space-y-6 relative z-10">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800/50 hover:bg-black/60 transition-colors">
                                <div>
                                  <span className="text-sm font-bold text-gray-200 block">Accès au Chat (Global)</span>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block uppercase">Envoyer des msgs dans le chat.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={editForm.permissions?.canChat !== false} onChange={(e) => setEditForm({...editForm, permissions: {...editForm.permissions, canChat: e.target.checked}})} />
                                  <div className="w-10 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-gray-700 shadow-inner"></div>
                                </label>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800/50 hover:bg-black/60 transition-colors">
                                <div>
                                  <span className="text-sm font-bold text-gray-200 block">Envoyer Tickets Support</span>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block uppercase">Contacter l'admin.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={editForm.canUseSupport !== false} onChange={(e) => setEditForm({...editForm, canUseSupport: e.target.checked})} />
                                  <div className="w-10 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-gray-700 shadow-inner"></div>
                                </label>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800/50 hover:bg-black/60 transition-colors">
                                <div>
                                  <span className="text-sm font-bold text-gray-200 block">Demande de Rank-Up</span>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block uppercase">Évolution de grade.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={editForm.canAppealRank !== false} onChange={(e) => setEditForm({...editForm, canAppealRank: e.target.checked})} />
                                  <div className="w-10 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-gray-700 shadow-inner"></div>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Financement Limites */}
                          <div className="bg-gradient-to-br from-[#0a110d] to-[#070b09] border border-gray-800/80 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 p-24 bg-emerald-500/5 blur-[50px] rounded-full"></div>
                            <h4 className="font-black text-white flex items-center gap-2 mb-6 text-sm uppercase tracking-widest relative z-10">
                              <DollarSign size={16} className="text-emerald-400" />
                              Limites Caisse
                            </h4>
                            <div className="space-y-5 relative z-10">
                              <div className="p-3 bg-black/40 rounded-xl border border-gray-800/60">
                                <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1.5 block">Montant Dépôt Max ($)</label>
                                <input type="number" min="0" placeholder="Vide = illimité" value={editForm.permissions?.maxDepositAmount || ""} onChange={(e) => setEditForm({...editForm, permissions: {...(editForm.permissions || {}), maxDepositAmount: e.target.value ? parseFloat(e.target.value) : undefined}})} className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-emerald-400 text-lg font-black focus:outline-none focus:border-emerald-500 placeholder-gray-800 font-mono transition-colors" />
                              </div>
                              <div className="p-3 bg-black/40 rounded-xl border border-gray-800/60">
                                <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1.5 block">Transferts par Jour (Max)</label>
                                <input type="number" min="0" placeholder="Vide = illimité" value={editForm.permissions?.maxDepositsPerDay || ""} onChange={(e) => setEditForm({...editForm, permissions: {...(editForm.permissions || {}), maxDepositsPerDay: e.target.value ? parseInt(e.target.value) : undefined}})} className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-emerald-400 text-lg font-black focus:outline-none focus:border-emerald-500 placeholder-gray-800 font-mono transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-8"></div>

                        <div className="mb-8">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Lock size={14} className="text-gray-400" /> Blocage des Modules Internes
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                              {
                                id: "canDeposit",
                                label: "Dépôts (Fiat/Crypto)",
                                value:
                                  editForm.permissions?.canDeposit !== false,
                              },
                              {
                                id: "isDemandMode",
                                label: "Mode Sur Demande",
                                value:
                                  editForm.permissions?.isDemandMode === true,
                              },
                              {
                                id: "canWithdraw",
                                label: "Retraits",
                                value:
                                  editForm.permissions?.canWithdraw !== false,
                              },
                              {
                                id: "canUseVault",
                                label: "Sécurisation Vault",
                                value:
                                  editForm.permissions?.canUseVault !== false,
                              },
                              {
                                id: "canBuyVip",
                                label: "Panel Achat VIP",
                                value:
                                  editForm.permissions?.canBuyVip !== false,
                              },
                              {
                                id: "canClaimRewards",
                                label: "Distribution Récompenses",
                                value:
                                  editForm.permissions?.canClaimRewards !==
                                  false,
                              }
                            ].map((perm) => (
                              <label
                                key={perm.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors shadow-inner ${!perm.value ? "bg-rose-950/20 border-rose-500/30 text-rose-300" : "bg-[#0b1015] border-gray-800/80 hover:border-gray-700 text-gray-300"}`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={perm.value}
                                  onChange={(e) => {
                                    setEditForm({
                                      ...editForm,
                                      permissions: {
                                        ...(editForm.permissions || {}),
                                        [perm.id]: e.target.checked,
                                      },
                                    });
                                  }}
                                />
                                <span
                                  className="w-5 h-5 rounded-[4px] border border-gray-600 flex items-center justify-center shrink-0 transition-colors"
                                  style={{
                                    backgroundColor: perm.value
                                      ? "#10b981"
                                      : "transparent",
                                    borderColor: perm.value ? "#10b981" : "",
                                  }}
                                >
                                  {perm.value && (
                                    <svg
                                      className="w-3.5 h-3.5 text-white"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </span>
                                <span className="text-sm font-bold tracking-wide">
                                  {perm.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest border-b border-emerald-500/10 pb-2 mb-4">
                            Filtrage Légal : Jeux Originaux
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {[
                              "crash",
                              "dice",
                              "hilo",
                              "keno",
                              "limbo",
                              "mines",
                              "plinko",
                              "roulette",
                              "slide",
                              "wheel",
                            ].map((gameId) => {
                              const isBlocked =
                                !!editForm.permissions?.blockedGames?.[gameId];
                              return (
                                <label
                                  key={gameId}
                                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isBlocked ? "bg-rose-950/20 border-rose-500/20 text-rose-400" : "bg-black/30 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-300"}`}
                                >
                                  <span className="text-xs font-bold uppercase tracking-wider truncate">
                                    {gameId}
                                  </span>
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={!isBlocked}
                                    onChange={(e) => {
                                      const newBlocked = {
                                        ...(editForm.permissions
                                          ?.blockedGames || {}),
                                      };
                                      if (e.target.checked)
                                        delete newBlocked[gameId];
                                      else newBlocked[gameId] = true;
                                      setEditForm({
                                        ...editForm,
                                        permissions: {
                                          ...(editForm.permissions || {}),
                                          blockedGames: newBlocked,
                                        },
                                      });
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest border-b border-purple-500/10 pb-2 mb-4">
                            Filtrage Légal : Cartes & Slots
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {[
                              "baccarat",
                              "blackjack",
                              "video-poker",
                              "scarab-spin",
                              "le-bandit",
                            ].map((gameId) => {
                              const isBlocked =
                                !!editForm.permissions?.blockedGames?.[gameId];
                              return (
                                <label
                                  key={gameId}
                                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isBlocked ? "bg-rose-950/20 border-rose-500/20 text-rose-400" : "bg-black/30 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-300"}`}
                                >
                                  <span className="text-xs font-bold uppercase tracking-wider truncate">
                                    {gameId.replace("-", " ")}
                                  </span>
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={!isBlocked}
                                    onChange={(e) => {
                                      const newBlocked = {
                                        ...(editForm.permissions
                                          ?.blockedGames || {}),
                                      };
                                      if (e.target.checked)
                                        delete newBlocked[gameId];
                                      else newBlocked[gameId] = true;
                                      setEditForm({
                                        ...editForm,
                                        permissions: {
                                          ...(editForm.permissions || {}),
                                          blockedGames: newBlocked,
                                        },
                                      });
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </FormSection>
                    </div>
                  )}

                  {editTab === "history" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <FormSection
                        title="Audit des Transactions"
                        icon={<History className="text-gray-400" />}
                      >
                        <div className="overflow-hidden border border-gray-800 rounded-xl bg-black/50">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-900/50 text-gray-500 font-mono text-[10px] uppercase border-b border-gray-800">
                              <tr>
                                <th className="p-4">Heure (SYS)</th>
                                <th className="p-4">Module</th>
                                <th className="p-4">Risque</th>
                                <th className="p-4">Quotient</th>
                                <th className="p-4 text-right">Delta ($)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                              {recentBets.filter(
                                (b) => b.userId === editingUser.id,
                              ).length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="p-10 text-center text-gray-600 font-mono"
                                  >
                                    Aucune trace numérique récente.
                                  </td>
                                </tr>
                              ) : (
                                recentBets
                                  .filter((b) => b.userId === editingUser.id)
                                  .map((bet) => {
                                    const profit = bet.payout - bet.betAmount;
                                    const isWin = profit > 0;
                                    return (
                                      <tr
                                        key={bet.id}
                                        className="hover:bg-white/[0.02]"
                                      >
                                        <td className="p-4 text-gray-500 font-mono text-xs">
                                          {new Date(
                                            bet.timestamp,
                                          ).toLocaleTimeString()}
                                        </td>
                                        <td className="p-4 font-bold text-gray-300 capitalize text-xs">
                                          {bet.game}
                                        </td>
                                        <td className="p-4 text-gray-400 font-mono text-xs">
                                          {formatCurrency(bet.betAmount)}$
                                        </td>
                                        <td className="p-4 text-gray-300 font-mono text-xs">
                                          {bet.multiplier.toFixed(2)}x
                                        </td>
                                        <td
                                          className={`p-4 font-mono font-bold text-right text-xs ${isWin ? "text-emerald-400" : "text-gray-500"}`}
                                        >
                                          {isWin ? "+" : ""}
                                          {formatCurrency(profit)}$
                                        </td>
                                      </tr>
                                    );
                                  })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </FormSection>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800 bg-[#09090b] flex justify-between items-center flex-shrink-0">
              <div className="text-xs font-mono text-gray-600 flex items-center gap-2">
                Validation des modifications irréversible.
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-transparent text-gray-400 font-bold hover:text-white rounded-xl transition-colors border border-transparent hover:border-gray-800 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="edit-user-form"
                  disabled={editLoading}
                  className="px-8 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Écriture...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Appliquer (SYS.UPDATE)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete User Confirmation Modal */}
      {userToDeleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111c25] border border-red-500/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center text-center p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
            
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <Trash2 className="text-red-500 w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Suppression Définitive</h2>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              Vous êtes sur le point de purger l'utilisateur <strong className="text-white bg-white/10 px-2 py-0.5 rounded font-mono">{userToDeleteConfirm.username}</strong> du réseau. Cette action est irréversible et effacera toutes ses données cryptographiques et son historique.
            </p>
            
            <div className="flex w-full gap-3">
              <button
                onClick={() => setUserToDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                disabled={actionLoading === userToDeleteConfirm.id + "delete"}
              >
                Annuler
              </button>
              <button
                onClick={performDeleteUser}
                disabled={actionLoading === userToDeleteConfirm.id + "delete"}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                {actionLoading === userToDeleteConfirm.id + "delete" ? "Purge..." : "Confirmer Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock App Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f212e]/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1a2c38] w-full max-w-md rounded-2xl border border-[#2f4553] shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              {lockTargetMode === "maintenance" && (
                <Lock className="text-amber-500" />
              )}
              {lockTargetMode === "arret" && (
                <AlertTriangle className="text-rose-500" />
              )}
              {lockTargetMode === "moderation" && (
                <Gavel className="text-blue-500" />
              )}
              Confirmer le Mode{" "}
              {lockTargetMode === "maintenance"
                ? "Maintenance"
                : lockTargetMode === "arret"
                  ? "Arrêt"
                  : "Modération"}
            </h3>

            <p className="text-sm text-gray-400 mb-6">
              Vous êtes sur le point de restreindre l'accès à l'application.
              Veuillez sélectionner les plateformes que vous souhaitez bloquer
              spécifiquement. Laissez vide pour bloquer TOUT LE MONDE.
            </p>

            <div className="flex pl-1 pr-1 flex-col gap-3 mb-6">
              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${lockBlockedDevices.includes("desktop") ? "bg-[#2f4553]/50 border-[#4d7187]" : "bg-[#0f212e]/50 border-[#2f4553] hover:border-gray-500"}`}
              >
                <div className="flex items-center gap-3 text-white">
                  <Monitor size={18} className="text-gray-400" />
                  <span className="font-bold text-sm">
                    Ordinateurs / Navigateurs Web
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#00e701]"
                  checked={lockBlockedDevices.includes("desktop")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setLockBlockedDevices((prev) => [...prev, "desktop"]);
                    else
                      setLockBlockedDevices((prev) =>
                        prev.filter((d) => d !== "desktop"),
                      );
                  }}
                />
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${lockBlockedDevices.includes("ios") ? "bg-[#2f4553]/50 border-[#4d7187]" : "bg-[#0f212e]/50 border-[#2f4553] hover:border-gray-500"}`}
              >
                <div className="flex items-center gap-3 text-white">
                  <Smartphone size={18} className="text-gray-400" />
                  <span className="font-bold text-sm">
                    Appareils iOS (iPhone / iPad)
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#00e701]"
                  checked={lockBlockedDevices.includes("ios")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setLockBlockedDevices((prev) => [...prev, "ios"]);
                    else
                      setLockBlockedDevices((prev) =>
                        prev.filter((d) => d !== "ios"),
                      );
                  }}
                />
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${lockBlockedDevices.includes("android") ? "bg-[#2f4553]/50 border-[#4d7187]" : "bg-[#0f212e]/50 border-[#2f4553] hover:border-gray-500"}`}
              >
                <div className="flex items-center gap-3 text-white">
                  <Smartphone size={18} className="text-gray-400" />
                  <span className="font-bold text-sm">Appareils Android</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#00e701]"
                  checked={lockBlockedDevices.includes("android")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setLockBlockedDevices((prev) => [...prev, "android"]);
                    else
                      setLockBlockedDevices((prev) =>
                        prev.filter((d) => d !== "android"),
                      );
                  }}
                />
              </label>
            </div>

            <div className="mb-4">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${lockHasEndTime ? "bg-[#2f4553]/50 border-[#00e701]/50" : "bg-[#0f212e]/50 border-[#2f4553] hover:border-gray-500"}`}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#00e701]"
                  checked={lockHasEndTime}
                  onChange={(e) => setLockHasEndTime(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">
                    Estimer la fin & Afficher un compte à rebours
                  </span>
                  <span className="text-xs text-gray-400">
                    Ajoute un compte à rebours visible sur la page de
                    restriction.
                  </span>
                </div>
              </label>
            </div>

            {lockHasEndTime && (
              <div className="flex flex-col gap-4 mb-6 bg-[#0f212e]/30 p-4 rounded-lg border border-[#2f4553]">
                <div className="flex bg-black/40 p-1 rounded-lg">
                  <button
                    onClick={() => setLockEndMode("duration")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${lockEndMode === "duration" ? "bg-[#2f4553] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                  >
                    Durée
                  </button>
                  <button
                    onClick={() => setLockEndMode("date")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${lockEndMode === "date" ? "bg-[#2f4553] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                  >
                    Date & Heure
                  </button>
                </div>

                {lockEndMode === "duration" ? (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      value={lockDurationValue}
                      onChange={(e) =>
                        setLockDurationValue(
                          Math.max(1, parseInt(e.target.value) || 1),
                        )
                      }
                      className="w-24 bg-[#0c0c0e] border border-gray-800 p-2 rounded-lg text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <select
                      value={lockDurationUnit}
                      onChange={(e) =>
                        setLockDurationUnit(e.target.value as any)
                      }
                      className="flex-1 bg-[#0c0c0e] border border-gray-800 p-2 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Heures</option>
                      <option value="days">Jours</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={lockEndDate}
                      onChange={(e) => setLockEndDate(e.target.value)}
                      className="flex-1 bg-[#0c0c0e] border border-gray-800 p-2 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="time"
                      value={lockEndTime}
                      onChange={(e) => setLockEndTime(e.target.value)}
                      className="flex-1 bg-[#0c0c0e] border border-gray-800 p-2 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 pt-3 border-t border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-500"
                    checked={lockAutoUnlock}
                    onChange={(e) => setLockAutoUnlock(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-amber-500">
                    Désactiver automatiquement à la fin
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end mt-4 pt-4 border-t border-[#2f4553]">
              <button
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-300 rounded-lg text-sm font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const mode = lockTargetMode;
                  let endTime = null;

                  if (lockHasEndTime) {
                    if (lockEndMode === "duration") {
                      const msMultiplier =
                        lockDurationUnit === "minutes"
                          ? 60000
                          : lockDurationUnit === "hours"
                            ? 3600000
                            : 86400000;
                      endTime = Date.now() + lockDurationValue * msMultiplier;
                    } else if (lockEndDate && lockEndTime) {
                      endTime = new Date(
                        `${lockEndDate}T${lockEndTime}`,
                      ).getTime();
                    }
                  }

                  await setDoc(
                    doc(db, "config", "app"),
                    {
                      maintenance: true,
                      mode,
                      blockedDevices: lockBlockedDevices,
                      endTime,
                      autoUnlock: lockHasEndTime && lockAutoUnlock,
                    },
                    { merge: true },
                  );
                  setShowLockModal(false);
                }}
                className={`px-4 py-2 font-bold rounded-lg text-sm transition-all flex items-center gap-2 text-black ${
                  lockTargetMode === "maintenance"
                    ? "bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : lockTargetMode === "arret"
                      ? "bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-blue-500 hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                }`}
              >
                <CheckCircle size={16} />
                Confirmer le Blocage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub components for clean code --- //

function StatCard({ title, icon, value, sub, color, border }: any) {
  return (
    <div
      className={`bg-black/40 ${color} p-6 rounded-3xl border ${border} flex flex-col gap-3 relative overflow-hidden backdrop-blur-md`}
    >
      <div className="flex justify-between items-center z-10 opacity-70">
        {icon}
      </div>
      <div className="z-10 mt-2">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold font-mono tracking-tight text-white mb-2">
          {value}
        </p>
        <p className="text-xs text-gray-500 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, color, bg, badge }: any) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all w-full text-left
        ${active ? `bg-white/5 text-white shadow-sm ring-1 ring-white/10` : `text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]`}`}
    >
      <div
        className={`p-1.5 rounded-lg ${active ? bg : "bg-transparent"} ${active ? color : "text-gray-500"}`}
      >
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function FormSection({ title, icon, children }: any) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function FormSelect({ label, value, onChange, disabled, options }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-gray-500 tracking-wider uppercase">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-[#0c0c0e] text-white p-3.5 rounded-xl border border-gray-800 focus:border-indigo-500/50 outline-none w-full appearance-none disabled:opacity-50 transition-all cursor-pointer hover:border-gray-700"
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
