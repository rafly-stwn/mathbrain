import { useDuelStore } from '../../stores/duelStore';

export default function DuelHeader() {
  const { players, playerName } = useDuelStore();
  
  const me = players.find(p => p.name === playerName);
  const opponent = players.find(p => p.name !== playerName);

  const myProgress = me?.progress || 0;
  const oppProgress = opponent?.progress || 0;
  
  // Calculate relative lead (from -100 to 100)
  const diff = Math.max(-100, Math.min(100, myProgress - oppProgress));
  const tugOfWarPercent = 50 + (diff / 2); // 50% is tied. 100% is I win. 0% is opp wins.

  return (
    <div className="bg-white rounded-b-[30px] p-4 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-4">
        {/* You */}
        <div className="flex flex-col items-start w-1/3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">😎</span>
            <span className="font-bold text-sm text-gray-500 truncate max-w-[80px]">You</span>
          </div>
          <div className="text-2xl font-black text-charcoal">{me?.score || 0}</div>
          <div className="text-xs font-bold text-orange-500">🔥 {me?.streak || 0}</div>
        </div>

        {/* Center VS */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="bg-charcoal text-white text-xs font-black px-3 py-1 rounded-full">VS</div>
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-end w-1/3 text-right">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-2xl">🤓</span>
            <span className="font-bold text-sm text-gray-500 truncate max-w-[80px]">{opponent?.name || 'Waiting...'}</span>
          </div>
          <div className="text-2xl font-black text-charcoal">{opponent?.score || 0}</div>
          <div className="text-xs font-bold text-orange-500">🔥 {opponent?.streak || 0}</div>
        </div>
      </div>

      {/* Tug of war bar */}
      <div className="h-3 w-full bg-peach rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-mint transition-all duration-300 ease-out absolute left-0 top-0 bottom-0"
          style={{ width: `${tugOfWarPercent}%` }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 -translate-x-1/2 z-10" />
      </div>
    </div>
  );
}
