"use client"

import { useState } from "react"

type PointerState = {
  x: number
  y: number
  active: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function LoginAsciiPanel() {
  const [pointer, setPointer] = useState<PointerState>({
    x: 50,
    y: 50,
    active: false,
  })

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100

    setPointer({
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
      active: true,
    })
  }

  const handlePointerLeave = () => {
    setPointer({
      x: 50,
      y: 50,
      active: false,
    })
  }

  const driftX = (pointer.x - 50) * 0.18
  const driftY = (pointer.y - 50) * 0.12

  return (
    <div
      className="relative min-h-screen overflow-hidden border-r border-zinc-200/70 bg-[#f0f1ec] dark:border-zinc-800 dark:bg-[#dfe2d7]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f8f3_0%,#eceee7_100%)]" />

      <div
        className="absolute -left-[18%] -top-[8%] h-[43rem] w-[43rem] rounded-full bg-[radial-gradient(circle_at_42%_38%,rgba(188,191,111,0.92),rgba(146,149,76,0.78)_44%,rgba(131,135,70,0.28)_74%,transparent_78%)] blur-[1px]"
        style={{
          transform: `translate(${driftX * 0.9}px, ${driftY * 0.9}px)`,
        }}
      />
      <div
        className="absolute left-[6%] top-[5%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(91,96,44,0.58),rgba(91,96,44,0.12)_54%,transparent_72%)] blur-[10px]"
        style={{
          transform: `translate(${driftX * 1.15}px, ${driftY * 1.15}px)`,
        }}
      />

      <div
        className="absolute right-[-14%] top-[-6%] h-[62rem] w-[44rem] rounded-[48%] border-[86px] border-white/66 shadow-[inset_0_0_36px_rgba(255,255,255,0.45),0_18px_48px_rgba(119,121,82,0.18)]"
        style={{
          transform: `translate(${driftX * -0.45}px, ${driftY * -0.45}px) rotate(12deg)`,
        }}
      />
      <div
        className="absolute right-[12%] top-[6%] h-[34rem] w-[22rem] rounded-[48%] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(107,110,79,0.12)_42%,rgba(255,255,255,0.32)_100%)] blur-[2px]"
        style={{
          transform: `translate(${driftX * -0.28}px, ${driftY * -0.28}px) rotate(12deg)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.72), transparent 12%),
            radial-gradient(circle at 67% 17%, rgba(255,255,255,0.72), transparent 5%),
            radial-gradient(circle at 70% 18%, rgba(255,255,255,0.42), transparent 10%)
          `,
        }}
      />

      <div
        className="absolute -right-[6%] top-[2%] h-[12rem] w-[36rem] rotate-[18deg] rounded-full bg-black/12 blur-[18px]"
        style={{ transform: `translate(${driftX * -0.35}px, ${driftY * -0.35}px) rotate(18deg)` }}
      />
      <div
        className="absolute right-[2%] top-[18%] h-[10rem] w-[30rem] rotate-[10deg] rounded-full bg-black/10 blur-[16px]"
        style={{ transform: `translate(${driftX * -0.24}px, ${driftY * -0.24}px) rotate(10deg)` }}
      />
      <div
        className="absolute -left-[8%] bottom-[16%] h-[14rem] w-[34rem] rotate-[-14deg] rounded-full bg-black/8 blur-[24px]"
        style={{ transform: `translate(${driftX * 0.3}px, ${driftY * 0.3}px) rotate(-14deg)` }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,transparent,rgba(226,228,217,0.72))]" />

      <div className="relative h-full min-h-screen" />
    </div>
  )
}
