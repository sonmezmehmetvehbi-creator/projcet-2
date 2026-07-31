export function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* purple */}
      <div className="animate-orb-a absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-brand/35 blur-[90px] sm:blur-[120px]" />
      {/* orange */}
      <div className="animate-orb-b absolute -top-16 right-[-6rem] h-[22rem] w-[22rem] rounded-full bg-ember/25 blur-[90px] sm:blur-[120px]" />
      {/* baby blue */}
      <div className="animate-orb-c absolute top-40 left-1/3 h-[20rem] w-[20rem] rounded-full bg-sky/20 blur-[90px] sm:blur-[120px]" />

      <div className="absolute inset-0 grid-veil" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-arena-bg" />
    </div>
  )
}
