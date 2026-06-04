export function TruckLoader({ inline = false }: { inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 py-8">
          <div className="relative group scale-75">
            <div className="absolute inset-0 bg-[#00e701] blur-xl opacity-10 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 flex items-center justify-center bg-gradient-to-b from-[#1a2c38] to-[#0f212e] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite]"></div>
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
                 alt="Stake Logo" 
                 className="w-12 opacity-90 brightness-[100] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse"
               />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f212e]/90 backdrop-blur-md pointer-events-none transition-opacity duration-500">
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <div className="relative group">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-[#00e701] blur-2xl opacity-10 rounded-full animate-pulse"></div>
            
            <div className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-b from-[#1a2c38] to-[#0f212e] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 overflow-hidden">
               {/* Animated sweeping highlight */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite]"></div>
               
               {/* The actual logo bouncing softly */}
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
                 alt="Stake Logo" 
                 className="w-14 opacity-90 brightness-[100] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse"
               />
            </div>
            
            {/* Elegant Loading Dots Below */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
      </div>
    </div>
  );
}
