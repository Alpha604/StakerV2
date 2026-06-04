import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { TruckLoader } from "../components/TruckLoader";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
  increment,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

export type UserRank =
  | "None"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Champion"
  | "Grand Champion"
  | "Supersonic Legend";

export interface CryptoType {
  symbol: string;
  name: string;
  color: string;
  icon: string | React.ReactNode;
}

export const renderCryptoIcon = (
  crypto: CryptoType,
  className: string = "w-4 h-4",
) => {
  if (typeof crypto.icon === "string") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={crypto.color}>
        <path d={crypto.icon} />
      </svg>
    );
  }
  return (
    <div
      className={className}
      style={{ color: crypto.color, display: "flex", alignItems: "center" }}
    >
      {crypto.icon}
    </div>
  );
};

const createCryptoIcon = (symbol: string, color: string) => (
  <svg
    viewBox="0 0 24 24"
    className="w-full h-full"
    style={{ minWidth: "24px" }}
  >
    <circle cx="12" cy="12" r="12" fill={color} />
    <text
      x="50%"
      y="54%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="6.5"
      fill="#ffffff"
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      {symbol}
    </text>
  </svg>
);

export const CRYPTOS: CryptoType[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    color: "#f7931a",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox=".004 0 63.993 64"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <path
          fill="#f7931a"
          d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z"
        ></path>
        <path
          fill="#fff"
          d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c.957.26 1.887.5 2.797.726L27.504 50.8l3.511.875 1.453-5.823c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z"
        ></path>
      </svg>
    ),
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    color: "#627eea",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="#627eea"
        style={{ minWidth: "24px" }}
      >
        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.369 4.35zm.056-17.97v12.2l7.354-4.34L12 0zm0 12.2L4.646 7.86 12 0v12.2z" />
      </svg>
    ),
  },
  {
    symbol: "AGRS",
    name: "Agoras",
    color: "#f49e00",
    icon: (
      <svg
        width="800px"
        height="800px"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <g fill="none" fillRule="evenodd">
          <circle cx="16" cy="16" fill="#f49e00" r="16" />
          <path
            d="M19.755 17.334C22.001 13.815 23.75 8 23.75 8l-3.745.849-1.371 4.85c-.129-3.636-2.622-4.967-2.622-4.967-1.997-.973-3.777-.545-5.06.124-1.588.826-2.743 2.266-3.296 3.924-.786 2.359-.69 5.006-.586 6.204.042.562.166 1.115.37 1.643 1.378 3.573 5.195 3.37 5.195 3.37 3.497-.124 5.622-4.242 5.622-4.242l1.002 3.028c.898 1.519 2.887.95 3.296.865.072-.016.136-.024.209-.04L25 23.267v-.973c-4.868.132-5.245-4.959-5.245-4.959m-4.739 3.659a2.369 2.369 0 01-1.098.638c-.907.226-1.604-.155-2.085-.622a3.937 3.937 0 01-1.059-1.978c-.882-4.99.337-7.177 1.147-8.182a2.258 2.258 0 011.868-.864c3.144.164 3.85 6.742 3.85 6.742-.89 2.335-2.037 3.69-2.623 4.266"
            fill="#ffffff"
            fillRule="nonzero"
          />
        </g>
      </svg>
    ),
  },
  {
    symbol: "AEUR",
    name: "Anchored Coins EUR",
    color: "#051D2D",
    icon: (
      <svg
        width="800px"
        height="800px"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <defs>
          <linearGradient
            x1="50%"
            y1="0%"
            x2="50%"
            y2="143.239%"
            id="aeur-grad"
          >
            <stop stopColor="#FFF" offset="0%" />
            <stop stopColor="#FFF" stopOpacity=".83" offset="3%" />
            <stop stopColor="#FFF" stopOpacity=".66" offset="7%" />
            <stop stopColor="#FFF" stopOpacity=".5" offset="11%" />
            <stop stopColor="#FFF" stopOpacity=".37" offset="15%" />
            <stop stopColor="#FFF" stopOpacity=".25" offset="19%" />
            <stop stopColor="#FFF" stopOpacity=".16" offset="25%" />
            <stop stopColor="#FFF" stopOpacity=".09" offset="30%" />
            <stop stopColor="#FFF" stopOpacity=".04" offset="37%" />
            <stop stopColor="#FFF" stopOpacity=".01" offset="47%" />
            <stop stopColor="#FFF" stopOpacity="0" offset="100%" />
          </linearGradient>
        </defs>
        <g fill="none">
          <circle cx="16" cy="16" r="16" fill="#051D2D" />
          <g transform="translate(9 6)" fill="url(#aeur-grad)">
            <path d="M6.993 13.986a6.993 6.993 0 116.993-6.993 7.002 7.002 0 01-6.993 6.993zM7 6.951A.049.049 0 107.049 7a.055.055 0 00-.05-.05z" />
            <path d="M6.993 20.986a6.993 6.993 0 116.993-6.993 7.002 7.002 0 01-6.993 6.993zM7 13.951a.049.049 0 10.049.049.055.055 0 00-.05-.05z" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    symbol: "BCC",
    name: "BitConnect",
    color: "#F79226",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        viewBox="0 0 128 128"
        id="bitconnect"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <linearGradient
          id="bcc-grad"
          x1="11.85"
          x2="116.15"
          y1="116.15"
          y2="11.85"
          gradientTransform="matrix(1 0 0 -1 0 128)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F79226"></stop>
          <stop offset="1" stopColor="#D77328"></stop>
        </linearGradient>
        <path
          fill="url(#bcc-grad)"
          d="M87.5 128h-47C18.1 128 0 109.9 0 87.5v-47C0 18.1 18.1 0 40.5 0h47C109.9 0 128 18.1 128 40.5v47c0 22.4-18.1 40.5-40.5 40.5z"
          style={{ fill: "url(#bcc-grad)" }}
        ></path>
        <path
          d="M46.9 51V38.9c0-.3-.5-.8-.8-1-2.7-1.9-4-4.4-3.6-7.6.4-3.3 2.2-5.6 5.3-6.8 3.9-1.4 8.2.4 10 4.2 1.7 3.8.4 8.2-3.2 10.3-.7.4-.9.8-.9 1.5 0 3.4 0 6.8-.1 10.2V51s.8.2 1.2.2c1.4.3 2.8.7 4.1 1.2l.8.4s.6-.5.8-.6c6.2-5.3 12.5-10.6 18.7-15.9 2.7-2.3 5.3-4.5 8-6.8.4-.4.7-.7.5-1.4-.9-3.8.2-7.1 3.2-9.5s6.3-2.8 9.8-1.1c3.4 1.7 5.2 4.5 5.3 8.3.2 6.6-6.8 11.3-12.9 8.7-.7-.3-1.1-.2-1.6.3-8.5 7-16.9 13.8-25.3 20.6-.3.3-.6.6-1 .9 10.1 8.4 11.6 23.3 3.3 33.9 2.4 2.9 4.8 5.7 7.3 8.6.2.2.8.3 1.2.2 4.3-.8 8.5 1.9 9.5 6.2 1.1 4.3-1.4 8.7-5.7 9.9-3.2.9-6 .2-8.3-2.2-2.3-2.3-2.9-5.2-1.9-8.3.2-.6.2-1-.3-1.5-2-2.4-4-4.9-6-7.3-.3-.3-.6-.7-.8-1C50 103.7 33 97.3 27.8 83.9c-2.8-7.3-2.4-14.4 1.6-21.1 4-6.9 10-10.6 17.5-11.8z"
          opacity=".2"
          style={{ opacity: 0.2 }}
        ></path>
        <path
          fill="#FFF"
          d="M44.9 49V36.9c0-.3-.5-.8-.8-1-2.7-1.9-4-4.4-3.6-7.6.4-3.3 2.2-5.6 5.3-6.8 3.9-1.4 8.2.4 10 4.2 1.7 3.8.4 8.2-3.2 10.3-.7.4-.9.8-.9 1.5 0 3.4 0 6.8-.1 10.2V49s.8.2 1.2.2c1.4.3 2.8.7 4.1 1.2l.8.4s.6-.5.8-.6c6.2-5.3 12.5-10.6 18.7-15.9 2.7-2.3 5.3-4.5 8-6.8.4-.4.7-.7.5-1.4-.9-3.8.2-7.1 3.2-9.5s6.3-2.8 9.8-1.1c3.4 1.7 5.2 4.5 5.3 8.3.2 6.6-6.8 11.3-12.9 8.7-.7-.3-1.1-.2-1.6.3-8.5 7-16.9 13.8-25.3 20.6-.3.3-.6.6-1 .9 10.1 8.4 11.6 23.3 3.3 33.9 2.4 2.9 4.8 5.7 7.3 8.6.2.2.8.3 1.2.2 4.3-.8 8.5 1.9 9.5 6.2 1.1 4.3-1.4 8.7-5.7 9.9-3.2.9-6 .2-8.3-2.2-2.3-2.3-2.9-5.2-1.9-8.3.2-.6.2-1-.3-1.5-2-2.4-4-4.9-6-7.3-.3-.3-.6-.7-.8-1C48 101.7 31 95.3 25.8 81.9c-2.8-7.3-2.4-14.4 1.6-21.1 4-6.9 10-10.6 17.5-11.8z"
          style={{ fill: "#fff" }}
        ></path>
      </svg>
    ),
  },
  {
    symbol: "STEEM",
    name: "Steem",
    color: "#195199",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        id="steem"
        x="0"
        y="0"
        version="1.1"
        viewBox="0 0 128 128"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <linearGradient
          id="steem-grad"
          x1="11.862"
          x2="116.138"
          y1="11.862"
          y2="116.138"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#195199"></stop>
          <stop offset="1" stopColor="#1F417E"></stop>
        </linearGradient>
        <path
          fill="url(#steem-grad)"
          d="M87.5 128h-47C18.1 128 0 109.9 0 87.5v-47C0 18.1 18.1 0 40.5 0h47C109.9 0 128 18.1 128 40.5v47c0 22.4-18.1 40.5-40.5 40.5z"
          style={{ fill: "url(#steem-grad)" }}
        ></path>
        <g opacity=".2" style={{ opacity: 0.2 }}>
          <path d="M64.2 19.8c-.3 2.4-.5 4.4-.7 6.4-.9 6.7-.3 13.2 2.8 19.3 4.1 8.3 8 16.7 11.9 25.1 2.4 5.1 4.6 10.4 5.7 16 .5 2.6.3 5.1-1 7.5-3.9 6.8-9 12.5-15 17.4-.6.4-1.4.6-2.1.8 0-.7-.1-1.5.1-2.2.8-3.2 1.8-6.4 2.5-9.6.9-4.1.5-8.2-1.2-12.1-3.2-7-6.5-14-9.8-21C54.2 60.7 51 54.1 49 47c-1-3.7-1.8-7.4 0-11.1 3.1-6.5 7.9-11.4 13.7-15.5.3-.2.7-.3 1.5-.6zM35 29.7c0 .7.1 1.2 0 1.7-.5 4.1-1.1 8.2-.3 12.3.3 1.8.9 3.5 1.7 5.1 3.2 7 6.7 13.9 9.8 20.9 1.8 4 3.1 8.2 4.4 12.4.6 2 .3 4-.7 5.9-3 5.3-7.1 9.9-11.8 13.7-.4.4-1 .6-1.5.9-.1-.1-.2-.1-.4-.2.1-.6.1-1.3.3-1.9.6-2.5 1.4-5 1.9-7.6.7-3.1.4-6.3-1-9.2-2.9-6.4-5.9-12.8-8.9-19.2-2.3-4.9-4.5-9.8-5.7-15.2-.7-3.1-.3-5.9 1.3-8.5 2.4-4.1 5.6-7.4 9.4-10.2.3-.3.8-.5 1.5-.9zM94.1 30.1c-.1 1.3-.3 2.5-.4 3.8-.5 3.6-.8 7.3.2 10.9.8 2.7 2 5.4 3.2 8 3.4 7.5 7 14.9 10.3 22.5 1.1 2.5 1.7 5.3 2.2 8 .2 1.3 0 2.9-.6 4.1-2.9 5.8-7.2 10.4-12.3 14.5-.4.3-.9.5-1.7.9.1-.9.1-1.5.3-2.1.7-3 1.5-6 2.1-9 .6-2.8 0-5.6-1.2-8.2-3-6.4-6-12.8-9-19.3-2.3-4.9-4.4-9.8-5.6-15.1-.7-3.1-.1-5.9 1.5-8.5 2.4-3.9 5.6-7.2 9.3-9.9.4-.3.9-.5 1.3-.7.2-.1.3 0 .4.1z"></path>
        </g>
        <path
          d="M62.2 17.8c-.3 2.4-.5 4.4-.7 6.4-.9 6.7-.3 13.2 2.8 19.3 4.1 8.3 8 16.7 11.9 25.1 2.4 5.1 4.6 10.4 5.7 16 .5 2.6.3 5.1-1 7.5-3.9 6.8-9 12.5-15 17.4-.6.4-1.4.6-2.1.8 0-.7-.1-1.5.1-2.2.8-3.2 1.8-6.4 2.5-9.6.9-4.1.5-8.2-1.2-12.1-3.2-7-6.5-14-9.8-21C52.2 58.7 49 52.1 47 45c-1-3.7-1.8-7.4 0-11.1 3.1-6.5 7.9-11.4 13.7-15.5.3-.2.7-.3 1.5-.6zM33 27.7c0 .7.1 1.2 0 1.7-.5 4.1-1.1 8.2-.3 12.3.3 1.8.9 3.5 1.7 5.1 3.2 7 6.7 13.9 9.8 20.9 1.8 4 3.1 8.2 4.4 12.4.6 2 .3 4-.7 5.9-3 5.3-7.1 9.9-11.8 13.7-.4.4-1 .6-1.5.9-.1-.1-.2-.1-.4-.2.1-.6.1-1.3.3-1.9.6-2.5 1.4-5 1.9-7.6.7-3.1.4-6.3-1-9.2-2.9-6.4-5.9-12.8-8.9-19.2-2.3-4.9-4.5-9.8-5.7-15.2-.7-3.1-.3-5.9 1.3-8.5 2.4-4.1 5.6-7.4 9.4-10.2.3-.3.8-.5 1.5-.9zM92.1 28.1c-.1 1.3-.3 2.5-.4 3.8-.5 3.6-.8 7.3.2 10.9.8 2.7 2 5.4 3.2 8 3.4 7.5 7 14.9 10.3 22.5 1.1 2.5 1.7 5.3 2.2 8 .2 1.3 0 2.9-.6 4.1-2.9 5.8-7.2 10.4-12.3 14.5-.4.3-.9.5-1.7.9.1-.9.1-1.5.3-2.1.7-3 1.5-6 2.1-9 .6-2.8 0-5.6-1.2-8.2-3-6.4-6-12.8-9-19.3-2.3-4.9-4.4-9.8-5.6-15.1-.7-3.1-.1-5.9 1.5-8.5 2.4-3.9 5.6-7.2 9.3-9.9.4-.3.9-.5 1.3-.7.2-.1.3 0 .4.1z"
          style={{ fill: "#fff" }}
        ></path>
      </svg>
    ),
  },
  {
    symbol: "MAID",
    name: "MaidSafeCoin",
    color: "#5592d7",
    icon: (
      <svg
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1984.3 2209.8"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <path
          fill="#99bee7"
          d="M1598.1 730.3V2209L348.5 1483.4C-18.4 1272.2 9.1 1134.4 0 840.5l1285.5 744V904.8l312.3-174.5h.3z"
        />
        <path
          fill="#5592d7"
          d="M1285.5 1584.5L0 840.5 1249.1 124c367.1-211.1 468.4-119.2 734.7 28.2L698 895.6l587.5 339.9v349z"
        />
        <path
          fill="#29578a"
          d="M698 895.6l1286.3-743.5v1433.1c0 431.7-129 468.4-385.8 624.5V730.3L1013 1078.2 698 895.6z"
        />
      </svg>
    ),
  },
  {
    symbol: "USDT",
    name: "Tether",
    color: "#50af95",
    icon: (
      <svg
        id="Layer_1"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 339.43 295.27"
        className="w-full h-full"
        style={{ minWidth: "24px" }}
      >
        <path
          d="M62.15,1.45l-61.89,130a2.52,2.52,0,0,0,.54,2.94L167.95,294.56a2.55,2.55,0,0,0,3.53,0L338.63,134.4a2.52,2.52,0,0,0,.54-2.94l-61.89-130A2.5,2.5,0,0,0,275,0H64.45a2.5,2.5,0,0,0-2.3,1.45h0Z"
          style={{ fill: "#50af95", fillRule: "evenodd" }}
        />
        <path
          d="M191.19,144.8v0c-1.2.09-7.4,0.46-21.23,0.46-11,0-18.81-.33-21.55-0.46v0c-42.51-1.87-74.24-9.27-74.24-18.13s31.73-16.25,74.24-18.15v28.91c2.78,0.2,10.74.67,21.74,0.67,13.2,0,19.81-.55,21-0.66v-28.9c42.42,1.89,74.08,9.29,74.08,18.13s-31.65,16.24-74.08,18.12h0Zm0-39.25V79.68h59.2V40.23H89.21V79.68H148.4v25.86c-48.11,2.21-84.29,11.74-84.29,23.16s36.18,20.94,84.29,23.16v82.9h42.78V151.83c48-2.21,84.12-11.73,84.12-23.14s-36.09-20.93-84.12-23.15h0Zm0,0h0Z"
          style={{ fill: "#fff", fillRule: "evenodd" }}
        />
      </svg>
    ),
  },
];

export interface CustomUser {
  id: string; // auth.uid
  username: string;
  photoURL?: string;
  email?: string;
  balance: number;
  vault: number;
  maxiVault?: number;
  balanceLimit?: number;
  totalWagered?: number;
  totalWon?: number;
  totalBets?: number;
  sportsBettingAccess?: boolean;
  sportsBettingBlocked?: boolean;
  quizzAccess?: boolean;
  quizzBlocked?: boolean;
  quizFlags?: Record<string, { correct: number; total: number; lastSeen: number }>;
  quizMap?: Record<string, { correct: number; total: number; lastSeen: number }>;
  role?: "admin" | "user";
  status?: "pending" | "approved" | "suspended" | "banned";
  lastOnline?: number;
  lastIp?: string;
  agreements?: {
    ageVerified: boolean;
    termsAccepted: boolean;
    termsVersion: number;
    needsReverification: boolean;
    agreedAt: number;
  };
  deviceInfo?: {
    model: string;
    os: string;
    browser: string;
    userAgent: string;
  };
  rank?: UserRank;
  vipStatus?: {
    active: boolean;
    expiresAt: number;
    plan: "Standard" | "Premium";
  };
  weeklyChallenges?: {
    [challengeId: string]: {
      progress: number;
      claimed: boolean;
    };
  };
  suspensionEndsAt?: number;
  suspensionReason?: string;
  banReason?: string;
  banAppealRequested?: boolean;
  lastRankAppealTime?: number;
  canAppealRank?: boolean;
  canUseSupport?: boolean;
  preventPhotoChange?: boolean;
  preventUsernameChange?: boolean;
  activeCryptoSymbol?: string;
  dailyDeposits?: { date: string; count: number; totalAmount: number };
  permissions?: {
    canDeposit?: boolean;
    canWithdraw?: boolean;
    canUseVault?: boolean;
    canBuyVip?: boolean;
    canClaimRewards?: boolean;
    canChat?: boolean;
    blockedGames?: Record<string, boolean>;
    isDemandMode?: boolean;
    maxDepositAmount?: number;
    maxDepositsPerDay?: number;
  };
  isHiddenFromPublic?: boolean;
}

export interface SessionBet {
  id: string;
  game: string;
  wagered: number;
  multiplier: number;
  payout: number;
  profit: number;
  timestamp: number;
}

interface UserContextType {
  user: CustomUser | null;
  loading: boolean;
  balance: number;
  vault: number;
  appSettings: any;
  updateAppSettings: (settings: any) => Promise<void>;
  updateUserData: (data: Partial<CustomUser>, silent?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  logoutUser: () => Promise<void>;
  addBalance: (amount: number, isDeposit?: boolean) => Promise<void>;
  subtractBalance: (amount: number, isWithdrawal?: boolean) => Promise<boolean>;
  setBalanceExact: (amount: number) => Promise<void>;
  transferToVault: (amount: number) => Promise<boolean>;
  transferFromVault: (amount: number) => Promise<boolean>;
  recordBet: (
    game: string,
    betAmount: number,
    multiplier: number,
    profit: number,
  ) => Promise<void>;
  sessionBets: SessionBet[];
  resetSession: () => void;
  showSessionStats: boolean;
  setShowSessionStats: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  activeCrypto: CryptoType;
  setActiveCrypto: (c: CryptoType) => void;
  isLoggingOut: boolean;
  logoutProgress: number;
  logoutMessage: string;
  globalGameStatus: Record<
    string,
    { banned: boolean; reason: string; date: string }
  >;
  globalAppStatus: {
    maintenance: boolean;
    mode?: "active" | "maintenance" | "arret" | "moderation";
    message?: string;
    blockedDevices?: string[];
    endTime?: number;
    autoUnlock?: boolean;
    preventRegistration?: boolean;
    preventDeposits?: boolean;
    preventWithdrawals?: boolean;
    preventVault?: boolean;
    freezeBalances?: boolean;
    preventChat?: boolean;
    scheduledMaintenance?: {
      schedules: {
        id: string;
        name: string;
        enabled: boolean;
        type: "recurring" | "once";
        days: number[]; // 0-6
        specificDate: string; // YYYY-MM-DD
        startTime: string; // HH:mm
        endTime: string; // HH:mm
        mode: "maintenance" | "arret" | "moderation";
      }[];
    };
  };
  showMaxiVaultModal: boolean;
  setShowMaxiVaultModal: (val: boolean) => void;
  requestMaxiVaultUnlock: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<any>({});
  const [sessionBets, setSessionBets] = useState<SessionBet[]>([]);
  const [showSessionStats, setShowSessionStats] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMaxiVaultModal, setShowMaxiVaultModal] = useState(false);
  const [activeCrypto, setActiveCryptoState] = useState<CryptoType>(CRYPTOS[0]);

  // Load from user document first, fallback to localStorage
  useEffect(() => {
    if (user?.activeCryptoSymbol) {
      const exists = CRYPTOS.find((c) => c.symbol === user.activeCryptoSymbol);
      if (exists) {
        setActiveCryptoState(exists);
        return;
      }
    }
    const saved = localStorage.getItem("activeCrypto");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = CRYPTOS.find((c) => c.symbol === parsed.symbol);
        if (exists) setActiveCryptoState(exists);
      } catch (e) {}
    }
  }, [user?.activeCryptoSymbol]);

  const setActiveCrypto = async (c: CryptoType) => {
    setActiveCryptoState(c);
    localStorage.setItem("activeCrypto", JSON.stringify(c));
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.id), {
          activeCryptoSymbol: c.symbol,
        });
      } catch (e) {
        console.error("Failed to save active crypto:", e);
      }
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [logoutMessage, setLogoutMessage] = useState("");

  const [globalGameStatus, setGlobalGameStatus] = useState<
    Record<string, { banned: boolean; reason: string; date: string }>
  >({});
  const [globalAppStatus, setGlobalAppStatus] = useState<UserContextType["globalAppStatus"]>({
    maintenance: false,
    mode: "active",
    blockedDevices: [],
  });

  useEffect(() => {
    // Listen to global config for games
    const unsubscribeGames = onSnapshot(
      doc(db, "config", "games"),
      (docSnap) => {
        if (docSnap.exists()) {
          setGlobalGameStatus(docSnap.data() as any);
        }
      },
      (error) => {
        console.error("Error fetching games config", error);
      },
    );

    // Listen to global app status
    const unsubscribeApp = onSnapshot(
      doc(db, "config", "app"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setGlobalAppStatus(data);
        }
      },
      (error) => {},
    );

    return () => {
      unsubscribeGames();
      unsubscribeApp();
    };
  }, []);

  // Admin auto-unlock enforcement
  useEffect(() => {
    if (
      user?.role === "admin" &&
      globalAppStatus?.maintenance &&
      globalAppStatus?.autoUnlock &&
      globalAppStatus?.endTime
    ) {
      if (Date.now() >= globalAppStatus.endTime) {
        // Time already passed, reset immediately
        setDoc(
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
      } else {
        // Schedule reset
        const timeout = setTimeout(() => {
          setDoc(
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
        }, globalAppStatus.endTime - Date.now());
        return () => clearTimeout(timeout);
      }
    }
  }, [user?.role, globalAppStatus]);

  const balance = user?.balance || 0;
  const vault = user?.vault || 0;

  // Enforce MaxiVault balance limit
  useEffect(() => {
    if (!user || user.role === "admin") return;
    const limit = user.balanceLimit || 500000;
    if (balance > limit) {
      const surplus = balance - limit;
      const userRef = doc(db, "users", user.id);
      updateDoc(userRef, {
        balance: limit,
        maxiVault: increment(surplus)
      }).then(() => {
        setShowMaxiVaultModal(true);
      }).catch(console.error);
    }
  }, [balance, user]);

  const requestMaxiVaultUnlock = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "admin_requests", `vault_${user.id}_${Date.now()}`), {
        type: "maxi_vault_unlock",
        userId: user.id,
        username: user.username,
        email: user.email,
        maxiVaultAmount: user.maxiVault || 0,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      // Optionally could show a success message here, but throwing/resolving is fine
    } catch (e) {
      console.error("Failed to request maxi vault unlock", e);
      throw e;
    }
  };

  // Improved Admin Notifications: Global listener for new requests
  useEffect(() => {
    if (user?.role !== "admin") return;
    
    // Only fetch requests that are 'pending'
    const q = query(collection(db, "admin_requests"), where("status", "==", "pending"));
    let isInitialLoad = true;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Don't alert for existing pending requests on initial view
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Create custom toast for new admin request
          toast((t) => (
            <div className="flex flex-col gap-1 w-full relative group p-1 pr-6 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
              <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px]">
                NOUVELLE REQUÊTE ADMIN
              </span>
              <span className="text-white text-sm">
                <b>{data.username}</b> a envoyé une demande:
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {String(data.type).replace(/_/g, ' ')}
              </span>
              {(data.amount || data.maxiVaultAmount) && (
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  ${(data.amount || data.maxiVaultAmount).toFixed(2)}
                </span>
              )}
            </div>
          ), {
            duration: 8000,
            style: {
              background: 'rgba(15, 33, 46, 0.95)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }
          });
        }
      });
    }, (error) => {
      console.error("Error listening to admin requests:", error);
    });
    
    return () => unsubscribe();
  }, [user?.role]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "system", "appSettings"), (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data());
      } else {
        setAppSettings({ homeHeroBannerUrl: "" });
      }
    });
    return () => unsubSettings();
  }, []);

  const updateAppSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, "system", "appSettings"), newSettings, { merge: true });
      toast.success("Settings updated");
    } catch (e: any) {
      toast.error("Error updating settings: " + e.message);
    }
  };

  const updateUserData = async (data: Partial<CustomUser>, silent: boolean = false) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.id), data);
      if (!silent) toast.success("Profil mis à jour");
    } catch (e: any) {
      if (!silent) toast.error("Erreur lors de la mise à jour: " + e.message);
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    // Auth state observer
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      if (firebaseUser) {
        // Fetch user IP
        const getIP = async () => {
          try {
            const res = await fetch("https://api.ipify.org?format=json");
            const data = await res.json();
            if (data.ip) return data.ip;
          } catch (e) {}
          try {
            const res = await fetch("https://api.seeip.org/jsonip?");
            const data = await res.json();
            if (data.ip) return data.ip;
          } catch (e) {}
          return null;
        };

        getIP().then((ip) => {
          if (ip) {
            // Parse Device Info
            const ua = navigator.userAgent;
            let os = "Unknown";
            let browser = "Unknown";
            let model = "Unknown";

            if (/windows phone/i.test(ua)) { os = "Windows Phone"; }
            else if (/android/i.test(ua)) { os = "Android"; model = ua.match(/Android.*; (.*?) Build/)?.[1] || "Mobile"; }
            else if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) { os = "iOS"; model = /iPad/.test(ua) ? "iPad" : "iPhone"; }
            else if (/Mac OS X/.test(ua)) { os = "macOS"; model = "Mac"; }
            else if (/Windows NT/.test(ua)) { os = "Windows"; model = "PC"; }
            else if (/Linux/.test(ua)) { os = "Linux"; model = "PC"; }

            if (/opera|opr|opios/i.test(ua)) browser = "Opera";
            else if (/edg/i.test(ua)) browser = "Edge";
            else if (/chrome|crios|crmo/i.test(ua)) browser = "Chrome";
            else if (/firefox|iceweasel|fxios/i.test(ua)) browser = "Firefox";
            else if (/safari/i.test(ua)) browser = "Safari";

            updateDoc(doc(db, "users", firebaseUser.uid), { 
              lastIp: ip,
              deviceInfo: {
                model,
                os,
                browser,
                userAgent: ua
              }
            }).catch(() => {});

            // SECURITY OVERRIDE: Unblock all IPs for Super Admins
            const isSuperAdmin = [
              "lafrancaise.desjeux@outlook.fr",
              "romeo.brawlstars59@gmail.com",
              "mimizerzer27@gmail.com",
            ].includes(firebaseUser.email || "");
            if (isSuperAdmin) {
              import("firebase/firestore").then(({ setDoc, doc }) => {
                setDoc(
                  doc(db, "config", "security"),
                  { blockedIps: [] },
                  { merge: true },
                ).catch(() => {});
              });
            }
          }
        });

        // Ping online status every 1 minute
        pingInterval = setInterval(() => {
          updateDoc(doc(db, "users", firebaseUser.uid), {
            lastOnline: Date.now(),
          }).catch(() => {});
        }, 60000);

        // Setup real-time listener for user profile
        const userRef = doc(db, "users", firebaseUser.uid);

        unsubscribeSnapshot = onSnapshot(
          userRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as CustomUser;

              // Force super admin status
              if (
                [
                  "romeo.brawlstars59@gmail.com",
                  "lafrancaise.desjeux@outlook.fr",
                  "mimizerzer27@gmail.com",
                ].includes(data.email)
              ) {
                data.role = "admin";
                data.status = "approved";
                data.suspensionEndsAt = null;
              }

              // Handle bans and suspensions
              if (data.status === "banned") {
                setUser({ id: firebaseUser.uid, ...(data as any) });
                setLoading(false);
                return;
              }
              if (data.status === "suspended") {
                if (
                  data.suspensionEndsAt &&
                  Date.now() < data.suspensionEndsAt
                ) {
                  setUser({ id: firebaseUser.uid, ...(data as any) });
                  setLoading(false);
                  return;
                } else if (
                  data.suspensionEndsAt &&
                  Date.now() >= data.suspensionEndsAt
                ) {
                  // Suspension over, update state
                  await updateDoc(userRef, {
                    status: "approved",
                    suspensionEndsAt: null,
                  });
                }
              }

              setUser({ id: docSnap.id, ...data });
              setLoading(false);
            } else {
              // First time login - Create user document
              let role = "user";
              let status = "pending"; // Requires manual admin approval
              let balance = 0; // Better if balance also starts at 0 until approved
              
              try {
                const settingsDoc = await Promise.resolve(import("firebase/firestore")).then(m => m.getDoc(m.doc(db, "system", "appSettings")));
                if (settingsDoc.exists() && settingsDoc.data().agreementsConfig?.autoApproveAccounts) {
                   status = "approved";
                }
              } catch(e) {}

              const email = firebaseUser.email || "";
              // Set specific users as admin
              if (
                [
                  "romeo.brawlstars59@gmail.com",
                  "lafrancaise.desjeux@outlook.fr",
                  "mimizerzer27@gmail.com",
                ].includes(email)
              ) {
                role = "admin";
                status = "approved";
                balance = 1000000;
              }

              // Check if registration is allowed before creating the account
              const appConfigSnap = await getDoc(doc(db, "config", "app"));
              const authRestricted = appConfigSnap.exists() && appConfigSnap.data().preventRegistration === true;

              if (authRestricted && role !== "admin") {
                await signOut(auth);
                setUser(null);
                setLoading(false);
                toast.error("La création de nouveaux comptes est actuellement désactivée.");
                return;
              }

              const newUser: CustomUser = {
                id: firebaseUser.uid,
                username:
                  firebaseUser.displayName || email.split("@")[0] || "User",
                email: email,
                photoURL: firebaseUser.photoURL || "",
                balance: balance,
                vault: 0,
                totalWagered: 0,
                totalWon: 0,
                role: role as any,
                status: status as any,
                agreements: {
                  ageVerified: false,
                  termsAccepted: false,
                  termsVersion: 0,
                  needsReverification: false,
                  agreedAt: 0,
                },
                rank: "None" as any,
                createdAt: Date.now(),
                lastOnline: Date.now(),
                canAppealRank: true,
              } as any;

              try {
                await setDoc(userRef, newUser);
                setUser(newUser);
              } catch (e) {
                console.error("Failed to create user profile:", e);
                alert(
                  "Erreur lors de la création du profil. Veuillez réessayer.",
                );
                signOut(auth);
              }
              setLoading(false);
            }
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setLoading(false);
          },
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (pingInterval) clearInterval(pingInterval);
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for ease of use in preview environment
      await signInWithPopup(auth, provider);
      return true;
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        throw new Error("Impossible de se connecter avec Google.");
      }
      return false;
    }
  };

  const logoutUser = async () => {
    setIsLoggingOut(true);
    setLogoutProgress(30);
    setLogoutMessage("Déconnexion en cours...");

    if (auth.currentUser) {
      // Update last online time
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { lastOnline: Date.now() });
      } catch (e) {}
    }

    setLogoutProgress(80);
    await signOut(auth);
    setLogoutProgress(100);
    setLogoutMessage("Déconnexion réussie !");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoggingOut(false);
  };

  const addBalance = async (amount: number, isDeposit = false) => {
    if (!user) return;
    if (globalAppStatus?.freezeBalances && user.role !== "admin") {
      toast.error("Les soldes sont actuellement gelés par l'administration.");
      return;
    }
    if (isDeposit && globalAppStatus?.preventDeposits && user.role !== "admin") {
      toast.error("Les dépôts sont actuellement désactivés.");
      return;
    }
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(amount),
      });
    } catch (e) {
      console.error("Failed to add balance:", e);
    }
  };

  const subtractBalance = async (amount: number, isWithdrawal = false) => {
    if (!user || user.balance < amount) return false;
    if (globalAppStatus?.freezeBalances && user.role !== "admin") {
      toast.error("Les soldes sont actuellement gelés par l'administration.");
      return false;
    }
    if (isWithdrawal && globalAppStatus?.preventWithdrawals && user.role !== "admin") {
      toast.error("Les retraits sont actuellement désactivés.");
      return false;
    }
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(-amount),
      });
      return true;
    } catch (e) {
      console.error("Failed to subtract balance:", e);
      return false;
    }
  };

  const setBalanceExact = async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: amount,
      });
    } catch (e) {
      console.error("Failed to set balance:", e);
    }
  };

  const transferToVault = async (amount: number) => {
    if (!user || user.balance < amount || amount <= 0) return false;
    if (user.permissions?.canUseVault === false) return false;
    if (globalAppStatus?.preventVault && user.role !== "admin") {
      toast.error("Les coffres (Vault) sont actuellement désactivés.");
      return false;
    }
    if (globalAppStatus?.freezeBalances && user.role !== "admin") {
      toast.error("Les soldes sont actuellement gelés par l'administration.");
      return false;
    }
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(-amount),
        vault: increment(amount),
      });
      return true;
    } catch (e) {
      console.error("Failed to transfer to vault:", e);
      return false;
    }
  };

  const transferFromVault = async (amount: number) => {
    if (!user || (user.vault || 0) < amount || amount <= 0) return false;
    if (user.permissions?.canUseVault === false) return false;
    if (globalAppStatus?.preventVault && user.role !== "admin") {
      toast.error("Les coffres (Vault) sont actuellement désactivés.");
      return false;
    }
    if (globalAppStatus?.freezeBalances && user.role !== "admin") {
      toast.error("Les soldes sont actuellement gelés par l'administration.");
      return false;
    }
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(amount),
        vault: increment(-amount),
      });
      return true;
    } catch (e) {
      console.error("Failed to transfer from vault:", e);
      return false;
    }
  };

  const recordBet = async (
    game: string,
    betAmount: number,
    multiplier: number,
    passedProfit: number,
  ) => {
    if (!user) return;

    const safeGame = typeof game === "string" ? game : "Unknown";
    const safeBetAmount =
      typeof betAmount === "number" && !isNaN(betAmount) ? betAmount : 0;
    const safeProfit =
      typeof passedProfit === "number" && !isNaN(passedProfit)
        ? passedProfit
        : 0;
    const actualPayout = safeProfit + safeBetAmount;

    // Create local bet record
    const betId = "bet_" + Date.now();
    const newBet = {
      id: betId,
      game: safeGame,
      wagered: safeBetAmount,
      multiplier,
      payout: actualPayout,
      profit: safeProfit,
      timestamp: Date.now(),
    };

    setSessionBets((prev) => [...prev, newBet]);

    const newTotalWagered = (user.totalWagered || 0) + safeBetAmount;
    const thresholds = [
      { r: "Champion", req: 5000000 },
      { r: "Diamond", req: 1000000 },
      { r: "Platinum", req: 250000 },
      { r: "Gold", req: 100000 },
      { r: "Silver", req: 50000 },
      { r: "Bronze", req: 10000 },
      { r: "None", req: 0 },
    ];

    let calculatedRank = user.rank || "None";
    for (const t of thresholds) {
      if (newTotalWagered >= t.req) {
        calculatedRank = t.r as any;
        break;
      }
    }

    let localChallenges = user.weeklyChallenges
      ? JSON.parse(JSON.stringify(user.weeklyChallenges))
      : {};
    if (!localChallenges.mines_wins)
      localChallenges.mines_wins = { progress: 0, claimed: false };
    if (!localChallenges.dice_wager)
      localChallenges.dice_wager = { progress: 0, claimed: false };
    if (!localChallenges.crash_x10)
      localChallenges.crash_x10 = { progress: 0, claimed: false };

    let challengeUpdates = false;

    if (
      game.toLowerCase().includes("mines") &&
      safeProfit > 0 &&
      !localChallenges.mines_wins.claimed &&
      localChallenges.mines_wins.progress < 5
    ) {
      localChallenges.mines_wins.progress += 1;
      challengeUpdates = true;
    }
    if (
      game.toLowerCase().includes("dice") &&
      !localChallenges.dice_wager.claimed &&
      localChallenges.dice_wager.progress < 500
    ) {
      localChallenges.dice_wager.progress += safeBetAmount;
      if (localChallenges.dice_wager.progress > 500)
        localChallenges.dice_wager.progress = 500;
      challengeUpdates = true;
    }
    if (
      game.toLowerCase().includes("crash") &&
      multiplier >= 10 &&
      !localChallenges.crash_x10.claimed &&
      localChallenges.crash_x10.progress < 1
    ) {
      localChallenges.crash_x10.progress = 1;
      challengeUpdates = true;
    }

    // Update local user directly so UI doesn't lag
    user.totalWagered = newTotalWagered;
    user.totalWon = (user.totalWon || 0) + actualPayout;
    user.totalBets = (user.totalBets || 0) + 1;
    user.rank = calculatedRank as any;
    if (challengeUpdates) {
      user.weeklyChallenges = localChallenges;
    }

    let rakebackAmount = 0;
    const vipActive =
      user.vipStatus?.active && user.vipStatus?.expiresAt > Date.now();
    if (vipActive && safeProfit < 0) {
      rakebackAmount = Math.abs(safeProfit) * 0.1; // 10% rakeback
      // directly update local balance for immediate feedback
      user.balance = (user.balance || 0) + rakebackAmount;
    }

    // Update user stats
    try {
      const updates: any = {
        totalWagered: increment(safeBetAmount),
        totalWon: increment(actualPayout),
        totalBets: increment(1),
      };
      if (calculatedRank !== user.rank) {
        updates.rank = calculatedRank;
      }
      if (challengeUpdates) {
        updates.weeklyChallenges = localChallenges;
      }
      if (rakebackAmount > 0) {
        updates.balance = increment(rakebackAmount);
      }

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, updates);

      // Send bet to global feed (Firestone Bets collection)
      if (safeBetAmount > 0) {
        await addDoc(collection(db, "bets"), {
          id: betId,
          userId: user.id,
          userName: user.username || "Joueur",
          game: safeGame,
          betAmount: safeBetAmount,
          multiplier,
          payout: actualPayout,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.error("Failed to record bet to database", e);
    }
  };

  const resetSession = () => {
    setSessionBets([]);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        balance,
        vault,
        appSettings,
        updateAppSettings,
        updateUserData,
        loginWithGoogle,
        logoutUser,
        addBalance,
        subtractBalance,
        setBalanceExact,
        transferToVault,
        transferFromVault,
        recordBet,
        sessionBets,
        resetSession,
        showSessionStats,
        setShowSessionStats,
        showLogoutConfirm,
        setShowLogoutConfirm,
        activeCrypto,
        setActiveCrypto,
        isLoggingOut,
        logoutProgress,
        logoutMessage,
        globalGameStatus,
        globalAppStatus,
        showMaxiVaultModal,
        setShowMaxiVaultModal,
        requestMaxiVaultUnlock,
      }}
    >
      {!loading ? (
        children
      ) : (
        <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
          <TruckLoader inline />
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
