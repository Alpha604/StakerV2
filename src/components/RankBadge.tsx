import React from 'react';
import { UserRank } from '../context/UserContext';

export const RANK_IMAGES: Record<string, string> = {
  "Bronze": "https://static.wikia.nocookie.net/rocketleague/images/d/d1/S21BronzePlayerBanner.png/revision/latest?cb=20260311144043",
  "Silver": "https://static.wikia.nocookie.net/rocketleague/images/d/d7/S21SilverPlayerBanner.png/revision/latest?cb=20260311144056",
  "Gold": "https://static.wikia.nocookie.net/rocketleague/images/1/18/S21GoldPlayerBanner.png/revision/latest?cb=20260311144108",
  "Platinum": "https://static.wikia.nocookie.net/rocketleague/images/4/4f/S21PlatinumPlayerBanner.png/revision/latest?cb=20260311144123",
  "Diamond": "https://static.wikia.nocookie.net/rocketleague/images/6/66/S21DiamondPlayerBanner.png/revision/latest?cb=20260311144136",
  "Champion": "https://static.wikia.nocookie.net/rocketleague/images/5/57/S21ChampionPlayerBanner.png/revision/latest?cb=20260311144149",
  "Grand Champion": "https://static.wikia.nocookie.net/rocketleague/images/0/07/S21GrandChampionPlayerBanner.png/revision/latest?cb=20260311144200",
  "Supersonic Legend": "https://static.wikia.nocookie.net/rocketleague/images/a/a9/S21SupersonicLegendPlayerBanner.png/revision/latest?cb=20260311144216"
};

export function RankBadge({ rank, className = "h-8 md:h-10" }: { rank?: UserRank, className?: string }) {
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
