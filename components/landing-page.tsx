import { Button } from "@/components/ui/button";
import { 
  ArrowRightIcon, 
  ChevronDownIcon,
  DocumentCheckIcon,
  AdjustmentsHorizontalIcon,
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  CheckIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] selection:bg-[#22c55e]/20 selection:text-black">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 w-full mx-auto border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="text-[#22c55e] flex items-center justify-center h-8 w-8 relative">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 transform rotate-45">
              <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
            </svg>
          </div>
          <span className="font-playfair font-black italic text-2xl tracking-tight text-gray-900">Nova</span>
        </div>
        <div className="hidden lg:flex items-center gap-10 text-[11px] font-mono uppercase tracking-[0.15em] text-gray-600 font-bold">
          <a href="#" className="flex items-center gap-1 hover:text-black transition-colors">Platform <ChevronDownIcon className="w-3 h-3" strokeWidth={3}/></a>
          <a href="#" className="hover:text-black transition-colors">Pricing</a>
          <a href="#" className="hover:text-black transition-colors">Customers</a>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }} className="hidden lg:block text-[11px] font-mono uppercase tracking-[0.15em] text-gray-600 font-bold hover:text-black transition-colors border-r border-[#e5e7eb] pr-6">
            Log In
          </a>
          <Button onClick={onLoginClick} className="bg-[#2a2723] hover:bg-black text-white text-[11px] uppercase tracking-[0.1em] font-normal rounded-sm px-6 py-5 shadow-none border-none">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="w-full">
        {/* Hero Section */}
        <section className="relative w-full border-b border-[#e5e7eb] pt-24 pb-32 overflow-hidden mx-auto">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none" 
               style={{ backgroundImage: "linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)", backgroundSize: "16px 16px", backgroundPosition: "center" }}>
          </div>
          
          {/* Thin frame bounding box */}
          <div className="relative z-10 max-w-[90%] mx-auto border-t border-b border-[#e5e7eb] py-24 bg-white/5 backdrop-blur-[1px]">
             {/* Corner Markers */}
             <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-400 -translate-x-[1px] -translate-y-[1px]"></div>
             <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gray-400 translate-x-[1px] -translate-y-[1px]"></div>
             <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gray-400 -translate-x-[1px] translate-y-[1px]"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-400 translate-x-[1px] translate-y-[1px]"></div>

             <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 mb-10 text-xs font-medium text-gray-500 bg-white/80 px-4 py-2 opacity-90">
                   <div className="text-[10px] font-mono font-bold text-[#22c55e] uppercase tracking-widest px-1.5 py-[1px]">NEW</div>
                   Multi-currency routing is live
                </div>
                
                <h1 className="text-5xl md:text-[5.5rem] font-playfair tracking-tight text-[#2a2723] leading-[1.05] mb-8 font-bold">
                   Expense automation<br/>that respects your workflow.
                </h1>

                <p className="text-[#666] text-xl max-w-2xl mb-12 leading-relaxed">
                   Drop in a receipt. We extract the details, evaluate your company<br/>policies, and route approvals instantly.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                   <Button onClick={onLoginClick} className="bg-[#cdb4db] hover:bg-[#bba0cc] text-gray-900 rounded-sm px-6 py-6 text-[12px] uppercase font-mono tracking-[0.1em] font-bold group shadow-none border-none">
                      Start Routing Expenses <ArrowRightIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Button>
                   <Button variant="outline" className="rounded-sm px-6 py-6 text-[12px] uppercase font-mono tracking-[0.1em] font-bold border-[#e5e7eb] text-gray-600 hover:bg-gray-50 shadow-none">
                      Book A Demo
                   </Button>
                </div>
             </div>
          </div>
        </section>

        {/* 3-Column Features Section */}
        <section className="grid md:grid-cols-3 gap-12 max-w-[85%] mx-auto mt-24 mb-32 relative text-[#2a2723]">
          <div className="flex flex-col">
            <DocumentCheckIcon className="w-12 h-12 text-[#22c55e] mb-6 stroke-2" />
            <h3 className="text-2xl font-playfair font-bold mb-4">Drop-in Receipts</h3>
            <p className="text-gray-500 leading-relaxed text-[15px]">Upload expenses globally. Our engine instantly processes multi-currency receipts using state-of-the-art vision models.</p>
          </div>
          <div className="flex flex-col">
            <AdjustmentsHorizontalIcon className="w-12 h-12 text-[#22c55e] mb-6 stroke-2" />
            <h3 className="text-2xl font-playfair font-bold mb-4">Dynamic Routing</h3>
            <p className="text-gray-500 leading-relaxed text-[15px]">JSON-driven workflows intelligently route approvals from manager to finance seamlessly. Configure rules that match your exact hierarchy.</p>
          </div>
          <div className="flex flex-col">
            <CloudArrowUpIcon className="w-12 h-12 text-[#22c55e] mb-6 stroke-2" />
            <h3 className="text-2xl font-playfair font-bold mb-4">Instant Settlements</h3>
            <p className="text-gray-500 leading-relaxed text-[15px]">Deploy anywhere. Real-time conversion rates and unified audit trails ensure enterprise compliance across every payout.</p>
          </div>
        </section>

        {/* Process Splitting Section */}
        <section className="border-t border-[#e5e7eb] max-w-[85%] mx-auto pt-10 pb-20">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between mb-24 relative">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-gray-100 -z-10"></div>
             <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 bg-white pr-4 py-1">/ Trusted by the finance teams behind:</p>
             <div className="flex flex-wrap items-center gap-10 md:gap-16 opacity-30 grayscale bg-white pl-4">
                <span className="text-2xl font-bold font-serif italic tracking-tighter">elastic</span>
                <span className="text-xl font-serif leading-tight">McKinsey<br/>& Company</span>
                <span className="text-2xl font-sans font-black tracking-tight flex items-center gap-1"><ChevronDownIcon className="w-4 h-4 -rotate-90 stroke-[4]"/>accenture</span>
                <span className="text-2xl font-bold uppercase tracking-widest font-sans flex items-center gap-1"><div className="w-1 h-6 bg-black"></div>MIT</span>
             </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 mb-8">
            <div className="bg-[#111] rounded-2xl relative overflow-hidden aspect-[4/3] shadow-lg flex items-center justify-center border border-gray-800 group cursor-pointer">
              {/* Fake dashboard UI frame */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=mockup')] bg-cover mix-blend-overlay"></div>
              <div className="absolute top-0 left-0 w-full h-12 bg-[#1a1a1a] flex items-center px-4 gap-2 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-4 text-[10px] font-mono text-gray-400">Reimbursement Agent</div>
              </div>
              
              {/* Content overlay */}
              <div className="z-10 bg-white/10 backdrop-blur-md rounded-full p-6 transition-transform group-hover:scale-110">
                 <PlayIcon className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-6">/ Process</p>
              <h2 className="text-4xl md:text-[3rem] font-playfair tracking-tight mb-12 text-[#1a1a1a] leading-[1.1] font-bold">
                See how Nova routes your expenses
              </h2>
              <div className="space-y-10">
                <div className="flex gap-4">
                  <ArrowUpTrayIcon className="w-6 h-6 text-gray-400 shrink-0" strokeWidth={1.5} />
                  <div>
                    <h4 className="text-xl font-medium text-[#1a1a1a]">Capture Receipt</h4>
                    <p className="text-gray-500 text-[15px] mt-2 leading-relaxed">Upload invoices, dinner bills, or global travel expenses in any currency.</p>
                  </div>
                </div>
                <div className="flex gap-4 border-t border-gray-100 pt-8 opacity-40 hover:opacity-100 transition-opacity">
                   <CpuChipIcon className="w-6 h-6 text-gray-400 shrink-0" strokeWidth={1.5}/>
                   <div>
                     <h4 className="text-xl font-medium text-[#1a1a1a]">Automated Policy Mapping</h4>
                     <p className="text-gray-500 text-[15px] mt-2 leading-relaxed">Our engine checks category limits and intelligently routes approval to your regional manager and finance head.</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning section overlay mock */}
        <section className="relative py-24 border-t border-b border-[#e5e7eb] overflow-hidden text-center bg-[#fcfdfc]">
           <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-6 relative z-10">/ We understand team structure</p>
           <h2 className="text-4xl md:text-6xl font-playfair tracking-tight relative z-10 text-[#1a1a1a] font-bold">
             Approval chains made simple, <br/><span className="underline decoration-[#22c55e] underline-offset-8">just for you.</span>
           </h2>
           <p className="text-gray-500 max-w-2xl mx-auto mt-8 text-lg relative z-10">
             No grueling setup. Configure your JSON workflow and Nova intelligently delegates the exact verification chain needed for every employee tier.
           </p>
           
           {/* Mock of the floating Memory overlay from screenshot */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none blur-sm scale-150 grayscale blend-mode-multiply">
              <div className="w-[500px] h-[300px] bg-white shadow-2xl rounded-2xl border border-gray-200 p-4">
                 <div className="w-full h-full bg-[#f3f4f6] rounded-xl flex items-center justify-center text-4xl font-bold font-playfair">Manager View</div>
              </div>
           </div>
        </section>

        {/* Case Study Split Table Design */}
        <section className="py-24 max-w-[85%] mx-auto relative">
           {/* Corner markers */}
           <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-400"></div>
           <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gray-400"></div>
           <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gray-400"></div>
           <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-400"></div>
           <div className="absolute top-0 left-1/2 w-[1px] h-3 bg-gray-400"></div>
           <div className="absolute bottom-0 left-1/2 w-[1px] h-3 bg-gray-400"></div>
           
           <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border-t border-b border-gray-200">
             
             {/* Left Block */}
             <div className="p-12 lg:pr-16 flex flex-col justify-center">
                <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-8">/ Case Study</p>
                <h3 className="text-3xl md:text-[2.5rem] font-playfair text-[#1a1a1a] mb-10 leading-tight font-bold">
                  Global tech firm achieves<br/>89% faster payouts
                </h3>
                
                <div className="border-l-2 border-[#22c55e] pl-6 mb-16">
                   <p className="text-gray-500 text-[15px] italic leading-relaxed">
                     &quot;We went from chasing managers for approval over Slack to fully automated cross-currency settlements. Our team loves it.&quot;
                   </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div>
                     <p className="text-4xl md:text-5xl font-medium text-[#22c55e] tracking-tight mb-2 font-mono">80%</p>
                     <p className="text-[11px] text-gray-500 font-mono tracking-widest uppercase mt-4">Speedup in payout time</p>
                   </div>
                   <div>
                     <p className="text-4xl md:text-5xl font-medium text-[#22c55e] tracking-tight mb-2 font-mono">93%</p>
                     <p className="text-[11px] text-gray-500 font-mono tracking-widest uppercase mt-4">Straight-through approval</p>
                   </div>
                   <div>
                     <p className="text-4xl md:text-5xl font-medium text-[#22c55e] tracking-tight mb-2 font-mono">4 <span className="text-2xl">hr</span></p>
                     <p className="text-[11px] text-gray-500 font-mono tracking-widest uppercase mt-4">Setup time</p>
                   </div>
                </div>
             </div>

             {/* Right Block */}
             <div className="p-12 lg:pl-16 flex flex-col gap-10">
                <div>
                   <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-3">/ Challenge</p>
                   <p className="text-gray-600 leading-relaxed text-[15px]">Employees globally submitting reimbursements via disparate spreadsheets. Approvals were lost, conversion rates were inaccurate, and finance couldn&apos;t keep up.</p>
                </div>
                <div className="w-full h-[1px] bg-gray-100"></div>
                <div>
                   <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-3">/ Solution</p>
                   <p className="text-gray-600 leading-relaxed text-[15px]">Nova&apos;s dynamic JSON routing instantly sends expenses to specific region managers, converting amounts dynamically to the company&apos;s base currency.</p>
                </div>
                <div className="w-full h-[1px] bg-gray-100"></div>
                <div>
                   <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-3">/ Result</p>
                   <p className="text-gray-600 leading-relaxed text-[15px]">Finance processes reduced to seconds. Clear audit trails ensured total budget visibility without pinging managers.</p>
                </div>
                <div className="mt-8">
                   <Button variant="outline" className="rounded-sm px-6 py-6 text-[11px] uppercase font-mono tracking-[0.1em] font-bold border-gray-300 shadow-none text-gray-700 w-max bg-transparent">
                      Read Full Case Study
                   </Button>
                </div>
             </div>

           </div>
        </section>

        {/* Test Before You Trust Details Section */}
        <section className="max-w-[85%] mx-auto pb-32">
           <div className="mb-12 flex justify-between items-end gap-10">
              <div className="max-w-xl">
                 <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-4">/ Budget Confidence</p>
                 <h2 className="text-5xl font-playfair font-bold tracking-tight text-[#1a1a1a] leading-tight">
                   Granular visibility into <br/><span className="underline decoration-[#22c55e] underline-offset-8">your company spend</span>
                 </h2>
              </div>
              <p className="text-gray-500 max-w-md text-[15px] leading-relaxed pb-2 hidden md:block">
                 See exactly where your budget is flowing before the end of the quarter. Eliminate shadow spending and enforce dynamic policy limits.
              </p>
           </div>
           
           <div className="grid lg:grid-cols-2 border border-gray-200">
              {/* Box Left */}
              <div className="flex flex-col border-r border-gray-200">
                 <div className="p-8 pb-10 border-b border-gray-200 bg-[#fbfcfc]">
                    <h3 className="text-2xl text-[#1a1a1a] font-playfair font-bold leading-tight max-w-[250px]">
                      Policy validation on<br/>every single receipt
                    </h3>
                 </div>
                 
                 <div className="flex flex-col flex-1 bg-white">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                       <div className="flex items-start gap-4">
                          <CheckIcon className="w-5 h-5 text-[#22c55e] mt-1 shrink-0" strokeWidth={3}/>
                          <div>
                            <p className="font-semibold text-gray-800 text-[15px]">Auto-approved workflows</p>
                            <p className="text-xs text-gray-400 mt-1">Below limit, deterministic routing</p>
                          </div>
                       </div>
                       <span className="text-3xl font-playfair font-bold text-[#22c55e] tracking-tight">87%</span>
                    </div>

                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                       <div className="flex items-start gap-4">
                          <WrenchScrewdriverIcon className="w-5 h-5 text-[#f97316] mt-1 shrink-0" strokeWidth={2}/>
                          <div>
                            <p className="font-semibold text-gray-800 text-[15px]">Finance validation needed</p>
                            <p className="text-xs text-gray-400 mt-1">Over-limit or missing category</p>
                          </div>
                       </div>
                       <span className="text-3xl font-playfair font-bold text-[#f97316] tracking-tight">13%</span>
                    </div>

                    <div className="p-6 flex items-start gap-4 bg-[#e8f2ea] border-b border-gray-200">
                       <DocumentCheckIcon className="w-5 h-5 text-[#22c55e] mt-1 shrink-0" strokeWidth={2}/>
                       <div>
                         <p className="font-semibold text-gray-800 text-[15px]">Best OCR + Conversion</p>
                         <p className="text-[13px] text-gray-500 mt-1 leading-relaxed max-w-sm">Capture handwritten bills and parse them immediately into your company&apos;s base currency using live market APIs.</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-[#fbfcfc]">
                   <p className="text-lg font-playfair font-bold text-gray-800 mb-2">Don&apos;t guess. Know exactly what you&apos;ll pay.</p>
                   <p className="text-sm text-gray-500 leading-relaxed">Configure strict JSON workflows for complex hierarchies.<br/>View metrics, ensure cross-border payouts, settle in record time.</p>
                 </div>
              </div>

              {/* Box Right */}
              <div className="p-10 flex flex-col justify-center items-center relative min-h-[500px] overflow-hidden bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=gradient-blue')] bg-cover bg-center">
                 <div className="absolute inset-0 bg-[#0a0f2c]/70 backdrop-blur-[2px]"></div>
                 <div className="relative z-10 text-center w-full max-w-sm">
                   <h3 className="text-2xl font-playfair font-medium text-white mb-2 leading-tight">Nova: reliable settlements</h3>
                   <p className="text-3xl font-bold text-white mb-10 tracking-tight leading-tight">Realtime conversion engine</p>
                   <div className="w-20 h-20 bg-white shadow-xl rounded-full mx-auto flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300">
                      <PlayIcon className="w-8 h-8 text-[#0a0f2c] fill-[#0a0f2c] ml-1" />
                   </div>
                   <div className="mt-6 bg-[#1a1a1a]/80 backdrop-blur-md rounded-full px-4 py-2 text-white inline-flex flex-col items-center border border-white/10 mx-auto">
                     <span className="text-sm font-bold flex items-center gap-1 font-mono"><ArrowPathIcon className="w-4 h-4"/> Live API</span>
                     <span className="text-[10px] text-gray-400 mt-0.5"><span className="line-through">Manual calculations</span> <span className="text-[#22c55e] font-bold ml-1">⚡ Automatic</span></span>
                   </div>
                 </div>
                 
                 <div className="absolute top-6 right-6 flex gap-2">
                    <div className="bg-black/50 p-2 rounded-md border border-white/10 hover:bg-black/70 cursor-pointer text-white/70">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    </div>
                    <div className="bg-black/50 p-2 rounded-md border border-white/10 hover:bg-black/70 cursor-pointer text-white/70">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </div>
                 </div>

                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#cdb4db] px-6 py-4 rounded-sm text-gray-900 cursor-pointer hover:bg-[#bba0cc] transition-colors flex items-center shadow-lg border border-[#c4b5fd]/40 group uppercase tracking-[0.1em] text-[11px] font-bold font-mono">
                    See It Action
                    <div className="ml-3 bg-[#a78bfa] text-white p-1 rounded-sm group-hover:bg-[#8b5cf6] transition-colors">
                       <ArrowRightIcon className="w-3 h-3" strokeWidth={3}/>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Deep Green CTA Block */}
        <section className="bg-[#18392b] text-white py-32 flex flex-col items-center justify-center text-center relative mx-auto w-full">
           {/* Cross Pattern Background */}
           <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_center,transparent_0,transparent_100%)]" 
                style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundPosition: "center" }}>
           </div>
           
           <div className="relative z-10 flex flex-col items-center pointer-events-auto w-full px-6">
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#a7f3d0] mb-6">/ Let&apos;s Talk</p>
              <h2 className="text-4xl md:text-6xl font-playfair tracking-tight mb-8 font-bold">Stop drowning in paper receipts.</h2>
              <p className="text-[#a7f3d0] opacity-80 max-w-md text-lg leading-relaxed mb-12">Let Nova&apos;s engine handle your reimbursements.<br/>See what&apos;s possible in minutes.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 <Button onClick={onLoginClick} className="bg-[#cdb4db] hover:bg-[#bba0cc] text-gray-900 rounded-sm px-8 py-7 text-[12px] uppercase font-mono tracking-[0.1em] font-bold shadow-none">
                    Route Expenses Free
                 </Button>
                 <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-[#18392b] rounded-sm px-8 py-7 text-[12px] uppercase font-mono tracking-[0.1em] font-bold shadow-none bg-white/5 backdrop-blur-sm">
                    Book A Demo
                 </Button>
              </div>
           </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 mt-20 pb-16 pt-16 px-6 md:px-12 flex flex-col lg:flex-row justify-between mx-auto">
         <div className="max-w-xs mb-10 lg:mb-0">
             <div className="text-[#22c55e] flex items-center justify-center h-8 w-8 relative mb-6">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 transform rotate-45">
                 <path d="M11 2h2v7.5l6.5-3.75 1 1.73-6.5 3.75 6.5 3.75-1 1.73-6.5-3.75V22h-2v-7.5l-6.5 3.75-1-1.73 6.5-3.75-6.5-3.75 1-1.73 6.5 3.75V2z" />
               </svg>
             </div>
             <p className="text-[13px] text-gray-500 leading-relaxed mb-8">Enterprise-grade platform: Process expenses, build workflows, ensure compliance. End-to-end reimbursement automation with Nova.</p>
             <p className="text-[11px] font-bold text-gray-800 tracking-wide flex items-center justify-between font-mono">
                © 2026 Nova. <span className="text-gray-400 font-normal ml-2">All rights reserved.</span>
                <span className="flex gap-4 ml-4">
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> 
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </span>
             </p>
         </div>

         <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-[11px] font-mono tracking-[0.1em] uppercase text-gray-500 font-bold">
            <a href="#" className="hover:text-black transition-colors block mb-2">Platform</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Blog</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Pricing</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Cookie Policy</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Status Page</a>
            <a href="#" className="hover:text-black transition-colors block mb-2">Consent Preferences</a>
         </div>
      </footer>
    </div>
  );
}
