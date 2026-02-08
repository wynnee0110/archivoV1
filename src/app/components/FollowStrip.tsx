const FollowSuggestionStrip = () => {
  // Mock data - replace with your actual user fetching logic later
  const suggestions = [
    { id: 1, name: "Alice", username: "ali_ce", avatar: "A" },
    { id: 2, name: "Bob", username: "builder_b", avatar: "B" },
    { id: 3, name: "Charlie", username: "char_zero", avatar: "C" },
    { id: 4, name: "Dave", username: "dave_dev", avatar: "D" },
    { id: 5, name: "Eve", username: "evelyn", avatar: "E" },
  ];

  return (
    <div className="w-full py-6 border-y border-white/5 bg-white/[0.01]">
      <div className="px-4 mb-3 flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Suggested Humans
        </h3>
        <button className="text-[10px] text-cyan-500 font-bold hover:underline">View All</button>
      </div>

      {/* The Swipeable Container */}
      <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
        {suggestions.map((user) => (
          <div 
            key={user.id} 
            className="flex-shrink-0 w-32 h-48 bg-[#1e212b] border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 snap-center hover:border-cyan-500/50 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.avatar}
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-white truncate w-24 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate w-24 leading-tight">@{user.username}</p>
            </div>
            <button className="mt-1 w-full py-1.5 px-3 bg-white text-black text-[10px] font-black rounded-lg hover:bg-cyan-400 active:scale-95 transition-all duration-150 shadow-sm">
              Follow
            </button>
          </div>
        ))}
      </div>

      {/* Global scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
