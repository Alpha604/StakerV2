import React from 'react';
import { UserRank } from '../lib/jsonbin';

export const RANK_IMAGES: Record<string, string> = {
  "Bronze": "https://storage.googleapis.com/aistudio-user-content-eu/0-bronze.png-45wsqndl1f.png",
  "Silver": "https://storage.googleapis.com/aistudio-user-content-eu/1-silver.png-w7y117pww5i.png",
  "Gold": "https://storage.googleapis.com/aistudio-user-content-eu/2-gold.png-70oogz43899.png",
  "Platinum": "https://storage.googleapis.com/aistudio-user-content-eu/3-platinum.png-o9b2n6f4r4g.png",
  "Diamond": "https://storage.googleapis.com/aistudio-user-content-eu/4-diamond.png-uymvve61q.png",
  "Blood Diamond": "https://storage.googleapis.com/aistudio-user-content-eu/5-blood_diamond.png-cskkclcc9u9.png",
  "Obsidian": "https://storage.googleapis.com/aistudio-user-content-eu/6-obsidian.png-d9kft752nxs.png"
};

export function RankBadge({ rank, className = "h-5 md:h-6" }: { rank?: UserRank, className?: string }) {
  if (!rank || rank === "None") return null;
  
  const imgSrc = RANK_IMAGES[rank];
  if (!imgSrc) return null;

  return (
    <img 
      src={imgSrc} 
      alt={`Rang ${rank}`} 
      title={`Rang: ${rank}`}
      className={`object-contain ${className}`} 
      referrerPolicy="no-referrer"
    />
  );
}
