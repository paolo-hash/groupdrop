export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-tight">groupdrop (beta)</div>

          <nav className="hidden gap-4 text-sm text-neutral-600 md:flex">
            <a href="#drops" className="hover:text-neutral-900">
              Drops
            </a>
            <a href="#how" className="hover:text-neutral-900">
              How it works
            </a>
            <a href="#join" className="hover:text-neutral-900">
              Join
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-14 md:mt-16">
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl md:leading-[1.05]">
            Premium group buys,
            <br className="hidden md:block" />
            without the chaos.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
            Join curated drops. Watch the total climb. When we hit the target, everyone gets the deal.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#join"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
            >
              Join the next drop
            </a>

            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-extrabold text-neutral-900 hover:bg-neutral-50"
            >
              How it works
            </a>
          </div>
        </section>

        {/* Drops */}
        <section id="drops" className="mt-14 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-2">
          {/* Active Drop */}
          <div className="rounded-2xl border border-neutral-200 p-5">
            <div className="text-xs font-extrabold tracking-wider text-neutral-500">ACTIVE DROP</div>
            <div className="mt-2 text-xl font-black">Aesop Hand Wash Bundle</div>
            <div className="mt-1 text-sm text-neutral-600">
              Target: <span className="font-bold text-neutral-900">$5,000</span> • Ends in{" "}
              <span className="font-bold text-neutral-900">3 days</span>
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-2.5 w-full rounded-full bg-neutral-200">
              <div className="h-2.5 w-[62%] rounded-full bg-neutral-900" />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-neutral-600">
              <div>
                Raised: <span className="font-bold text-neutral-900">$3,100</span>
              </div>
              <div>
                62% • <span className="font-bold text-neutral-900">$1,900</span> to go
              </div>
            </div>

            <div className="mt-5">
              <a
                href="#join"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
              >
                Join this drop
              </a>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              You’ll see a temporary authorization. We only charge if the drop completes.
            </p>
          </div>

          {/* Up Next */}
          <div className="rounded-2xl border border-neutral-200 p-5">
            <div className="text-xs font-extrabold tracking-wider text-neutral-500">UP NEXT</div>
            <div className="mt-2 text-xl font-black">Le Labo Discovery Set</div>
            <div className="mt-1 text-sm text-neutral-600">
              Vote to unlock • Target <span className="font-bold text-neutral-900">$7,500</span>
            </div>

            <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
              Invite a friend and you both get early access.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-14 md:mt-16">
          <h2 className="text-2xl font-black tracking-tight">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
            <li>
              <span className="font-bold text-neutral-900">1)</span> We post a curated drop with a target total.
            </li>
            <li>
              <span className="font-bold text-neutral-900">2)</span> You join with one checkout (no chaos).
            </li>
            <li>
              <span className="font-bold text-neutral-900">3)</span> If the drop hits the target before the timer ends,
              we charge and fulfill.
            </li>
          </ol>
        </section>

        {/* Join */}
        <section id="join" className="mt-14 rounded-2xl border border-neutral-200 p-5 md:mt-16">
          <div className="text-lg font-black tracking-tight">Get notified when new drops go live</div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="you@email.com"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
            />
            <button className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-neutral-800">
              Notify me
            </button>
          </div>

          <div className="mt-3 text-xs text-neutral-500">(We’ll wire this up to Supabase next.)</div>
        </section>

        <footer className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} groupdrop
        </footer>
      </div>
    </main>
  );
}
