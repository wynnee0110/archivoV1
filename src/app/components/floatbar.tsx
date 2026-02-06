import Link from "next/link";

export default function Floatbar() {
  // Buttons data for easy scaling
  const buttons = [
    { href: "/", icon: "/house-door.svg", size: "12" },
    { href: "/", icon: "/person.svg", size: "12" },
    { href: "/", icon: "/send.svg", size: "12" },
  ];

  return (
    <div className="fixed bottom-6 left-0 w-full flex justify-center items-center z-50">
      {/* Glass/frosted background container */}
      <div className="items-center flex gap-4 px-4 py-2 bg-black/30 backdrop-blur-lg border border-cyan-400/20 rounded-full shadow-lg">
        {buttons.map((btn, i) => (
          <Link key={i} href={btn.href}>
            <button
              className={`
                flex justify-center items-center
                w-${btn.size} h-${btn.size}
                rounded-full
                bg-cyan-400
                text-black
                drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]
                hover:scale-110 transition-transform duration-200
              `}
            >
              <img src={btn.icon} alt="icon" className="w-6 h-6" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
