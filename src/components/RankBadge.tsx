import React from 'react';
import { UserRank } from '../lib/jsonbin';

export const RANK_COLORS: Record<string, string> = {
  "None": "text-gray-400 border-gray-400 bg-gray-400/10 hidden",
  "Bronze": "text-[#cd7f32] border-[#cd7f32] bg-[#cd7f32]/10",
  "Silver": "text-gray-300 border-gray-300 bg-gray-300/10",
  "Gold": "text-yellow-400 border-yellow-400 bg-yellow-400/10",
  "Platinum": "text-cyan-300 border-cyan-300 bg-cyan-300/10",
  "Diamond": "text-blue-400 border-blue-400 bg-blue-400/10",
  "Blood Diamond": "text-red-500 border-red-500 bg-red-500/10",
  "Obsidian": "text-purple-600 border-purple-600 bg-purple-600/10"
};

export function RankBadge({ rank, className = "" }: { rank?: UserRank, className?: string }) {
  if (!rank || rank === "None") return null;
  
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${RANK_COLORS[rank]} ${className}`} title={`Rang: ${rank}`}>
      {rank}
    </span>
  );
}
