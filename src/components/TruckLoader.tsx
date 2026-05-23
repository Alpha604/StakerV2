export function TruckLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f212e]/80 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00e701] blur-xl opacity-20 rounded-full animate-pulse"></div>
            {/* Stake Box Logo */}
            <div className="w-20 h-20 bg-[#14232e] border border-[#2f4553] rounded-xl flex items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 border-2 border-[#00e701]/40 rounded-xl animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 10%, 0 10%)' }}></div>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
                alt="Stake Logo" 
                className="w-12 opacity-80 brightness-[100] invert"
              />
            </div>
            {/* Ping indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e701] shadow-[0_0_10px_#00e701] animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e701]"></div>
          </div>
      </div>
    </div>
  );
}
