import { ArrowRight, CheckCircle2, Shield, Zap, Sparkles, Clock, Compass } from 'lucide-react'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-slate-950 text-slate-100 overflow-x-hidden font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Fresh Jobs Intel
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/jobs"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            LinkedIn Jobs
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 w-full max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-8 animate-pulse">
          <Sparkles className="h-3 w-3" />
          <span>Chrome Extension Ready</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
          Never Apply to a{' '}
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Stale Job Listing
          </span>{' '}
          Again.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Filter and scan LinkedIn Jobs in real-time. Automatically hide old postings and highlight listings added in the last 30 minutes, 2 hours, or custom intervals.
        </p>

        {/* Installation Box */}
        <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-left shadow-2xl">
          <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-400" />
            Quick Installation Instructions
          </h2>
          <ol className="space-y-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">1</span>
              <span>Open Chrome and go to <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-mono text-xs">chrome://extensions/</code></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">2</span>
              <span>Toggle on <strong>Developer mode</strong> in the top-right corner.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">3</span>
              <span>Click <strong>Load unpacked</strong> in the top-left and select this folder: <br /><code className="bg-slate-950 px-2 py-0.5 rounded text-blue-400 font-mono text-xs block mt-1 overflow-x-auto">~/Desktop/linkedin-fresh-jobs-main</code></span>
            </li>
          </ol>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-left hover:border-blue-500/30 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Real-Time Freshness</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Identify exactly when a job was posted. Filter out listings older than your specified threshold instantly.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-left hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Custom Intervals</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Preset options (30m, 2h, 24h) and customizable minute-based thresholds so you target the exact window you want.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-left hover:border-purple-500/30 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Runs fully locally in your browser. Your job searches, settings, and filter history never leave your device.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-900 text-xs text-slate-500 gap-4 z-10">
        <p>© 2026 LinkedIn Fresh Jobs Intelligence. Built for high-speed job search.</p>
        <div className="flex gap-4">
          <span className="text-slate-600">Local installation mode</span>
        </div>
      </footer>
    </main>
  )
}
