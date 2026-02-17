export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-[980px] px-5 py-14 md:py-16">
        {/* Top nav */}
        <header className="flex items-center justify-between">
          <div className="text-lg font-extrabold">groupdrop (beta)</div>

          <nav className="hidden items-center gap-4 text-sm text-neutral-700 md:flex">
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
          <h1 className="text-4xl font-black tracking-tight leading-[1.1] md:text-6xl">
            Premium group buys,
            <br />
            without the chaos.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-700 md:mt-5 md:text-lg">
            Join curated drops. Watch the total climb. When we hit the target, everyone gets the deal.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <a
              href="#join"
              className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800 md:w-auto"
            >
              Join the next drop
            </a>

            <a
              href="#how"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-sm font-extrabold text-neutral-900 hover:bg-neutral-50 md:w-auto"
            >
              How it works
            </a>
          </div>
        </section>

        {/* Drops */}
        <section
          id="drops"
          className="mt-14 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-5"
        >
          {/* Active drop */}
          <div className="rounded-2xl border border-neutral-200 p-5">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">
              ACTIVE DROP
            </div>

            <div className="mt-2 text-2xl font-black">Aesop Hand Wash Bundle</div>

            <div className="mt-1 text-sm text-neutral-700 md:text-base">
              Target: <span className="font-extrabold text-neutral-900">$5,000</span> • Ends in{" "}
              <span className="font-extrabold text-neutral-900">3 days</span>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-neutral-200">
              <div className="h-2.5 w-[62%] rounded-full bg-neutral-900" />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-700 md:text-base">
              <div>
                Raised: <span className="font-extrabold text-neutral-900">$3,100</span>
              </div>
              <div>
                62% • <span className="font-extrabold text-neutral-900">$1,900</span> to go
              </div>
            </div>

            <div className="mt-5">
              <a
                href="#join"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
              >
                Join this drop
              </a>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600">
              You’ll see a temporary authorization. We only charge if the drop completes.
            </p>
          </div>

          {/* Up next */}
          <div className="rounded-2xl border border-neutral-200 p-5">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">
              UP NEXT
            </div>

            <div className="mt-2 text-xl font-black md:text-2xl">
              Le Labo Discovery Set
            </div>

            <div className="mt-1 text-sm text-neutral-700 md:text-base">
              Vote to unlock • Target{" "}
              <span className="font-extrabold text-neutral-900">$7,500</span>
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-4 text-sm leading-relaxed text-neutral-700">
              Invite a friend and you both get early access.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-14 md:mt-16">
          <h2 className="text-2xl font-black tracking-tight">How it works</h2>

          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
            <li>
              <span className="font-extrabold text-neutral-900">1)</span> We post a curated drop with a target total.
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">2)</span> You join with one checkout (no chaos).
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">3)</span> If the drop hits the target before the timer ends, we charge and fulfill.
            </li>
          </ol>
        </section>

        {/* Join */}
        <section id="join" className="mt-14 rounded-2xl border border-neutral-200 p-5 md:mt-16">
          <h3 className="text-lg font-black">Get notified when new drops go live</h3>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              placeholder="you@email.com"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 md:max-w-sm"
            />
            <button className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800">
              Notify me
            </button>
          </div>

          <p className="mt-3 text-xs text-neutral-500">(We’ll wire this up to Supabase next.)</p>
        </section>

        <footer className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} groupdrop
        </footer>
      </div>
    </main>
  );
}
