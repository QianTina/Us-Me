import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-neo-bg flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-2xl space-y-8">
          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
            Us & Me
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-bold font-mono bg-neo-purple inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1deg]">
            Twin Spaces for Couples
          </p>

          {/* Description */}
          <p className="text-lg text-gray-600 font-medium max-w-lg mx-auto">
            平衡亲密关系与独立人格的情侣生活操作系统。
            <br/>
            Balance &quot;We Mode&quot; and &quot;Me Mode&quot;.
          </p>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 w-full max-w-2xl">
            <Link href="/bistro" className="w-full">
              <Button className="w-full h-16 text-xl bg-neo-green hover:bg-neo-green/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-2xl font-black">
                🍔 小餐馆 (Bistro)
              </Button>
            </Link>
            
            <Link href="/chores" className="w-full">
              <Button className="w-full h-16 text-xl bg-neo-purple hover:bg-neo-purple/90 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-2xl font-black">
                🧹 赚积分 (Earn)
              </Button>
            </Link>

            <Link href="/store" className="w-full">
              <Button className="w-full h-16 text-xl bg-neo-pink hover:bg-neo-pink/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-2xl font-black">
                🎁 兑换 (Store)
              </Button>
            </Link>

            <Link href="/kitchen" className="w-full">
              <Button className="w-full h-16 text-xl bg-neo-yellow hover:bg-neo-yellow/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-2xl font-black">
                👨‍🍳 后厨 (Kitchen)
              </Button>
            </Link>

            <Link href="/me" className="w-full sm:col-span-2">
              <Button className="w-full h-16 text-xl bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-2xl font-black">
                🔒 私密空间 (Me Mode)
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-sm font-bold text-gray-400 text-center pb-8 pt-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        Phase 4: Gamified Economy (Points & Rewards)
      </footer>
    </div>
  );
}
