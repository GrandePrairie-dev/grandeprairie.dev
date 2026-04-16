import { useState, useEffect, useRef } from "react";

// Mini dashboard component for the "SHOW" section
const DashboardPreview = () => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const barData = [
    { label: "Jan", value: 12 }, { label: "Feb", value: 19 },
    { label: "Mar", value: 28 }, { label: "Apr", value: 35 },
    { label: "May", value: 42 }, { label: "Jun", value: 54 },
  ];
  const maxVal = 54;

  return (
    <div ref={ref} style={{
      background: "#111214", border: "1px solid rgba(200,170,100,0.12)", borderRadius: 6,
      padding: 0, overflow: "hidden", maxWidth: 520, width: "100%",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid rgba(200,170,100,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5DB87E" }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8A8680", letterSpacing: 1, textTransform: "uppercase" }}>Live Dashboard</span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#3A3530" }}>grandeprairie.dev/client</span>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(200,170,100,0.08)" }}>
        {[
          { label: "Leads This Month", value: "54", change: "+28%", color: "#5DB87E" },
          { label: "Cost Per Lead", value: "$18.40", change: "-12%", color: "#5DB87E" },
          { label: "Ad Spend ROI", value: "4.2x", change: "+0.8x", color: "#C8AA64" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "18px 16px",
            borderRight: i < 2 ? "1px solid rgba(200,170,100,0.08)" : "none",
            opacity: animated ? 1 : 0,
            transform: animated ? "translateY(0)" : "translateY(10px)",
            transition: `all 0.6s ease ${i * 0.15}s`,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5A5650", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: "#E8E6E1" }}>{s.value}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: s.color }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5A5650", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Leads by Month</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
          {barData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", borderRadius: 2,
                background: `linear-gradient(to top, rgba(200,170,100,0.6), rgba(200,170,100,0.25))`,
                height: animated ? `${(d.value / maxVal) * 70}px` : "0px",
                transition: `height 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.08 + 0.3}s`,
              }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#3A3530" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Source breakdown */}
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5A5650", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Lead Sources</div>
        {[
          { source: "Google Ads", count: 28, pct: 52, color: "#C8AA64" },
          { source: "Website (Organic)", count: 14, pct: 26, color: "#5DB87E" },
          { source: "AI Chatbot", count: 8, pct: 15, color: "#3C8DD4" },
          { source: "Facebook Ads", count: 4, pct: 7, color: "#A67BC5" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 1, background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6A6560", flex: 1 }}>{s.source}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8A8680" }}>{s.count}</span>
            <div style={{ width: 60, height: 4, background: "rgba(200,170,100,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: s.color,
                width: animated ? `${s.pct}%` : "0%",
                transition: `width 1s ease ${i * 0.1 + 0.5}s`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Agency = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const s = (e.target as HTMLElement).dataset.s;
        if (e.isIntersecting && s) setVisible(p => new Set([...p, s]));
      });
    }, { threshold: 0.12 });
    Object.values(refs.current).forEach(r => { if (r) obs.observe(r); });
    return () => obs.disconnect();
  }, []);

  const v = (id: string) => visible.has(id);
  const sr = (id: string) => ({ ref: (el: HTMLElement | null) => { refs.current[id] = el; }, "data-s": id, className: `sr ${v(id) ? "sv" : ""}` });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#08090B", color: "#E8E6E1", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes fu{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        @keyframes pg{0%,100%{box-shadow:0 0 20px rgba(200,170,100,0.12)}50%{box-shadow:0 0 40px rgba(200,170,100,0.25)}}
        @keyframes mq{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes gr{0%,100%{transform:translate(0,0)}25%{transform:translate(-3%,-5%)}50%{transform:translate(5%,3%)}75%{transform:translate(-5%,5%)}}
        .sr{opacity:0;transform:translateY(36px);transition:all .85s cubic-bezier(.16,1,.3,1)}
        .sv{opacity:1;transform:translateY(0)}
        .cb{display:inline-flex;align-items:center;gap:10px;padding:17px 34px;border:none;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;cursor:pointer;transition:all .3s;text-decoration:none}
        .cp{background:#C8AA64;color:#08090B}.cp:hover{background:#D4B872;transform:translateY(-2px);box-shadow:0 8px 28px rgba(200,170,100,.25)}
        .cs{background:transparent;color:#C8AA64;border:1px solid rgba(200,170,100,.3)}.cs:hover{border-color:#C8AA64;background:rgba(200,170,100,.06)}
        .ch{transition:all .4s cubic-bezier(.16,1,.3,1)}.ch:hover{transform:translateY(-6px)}
        .grain{position:fixed;top:-50%;left:-50%;width:200%;height:200%;pointer-events:none;z-index:999;opacity:.45;animation:gr 8s steps(8) infinite;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")}
        .mtrack{display:flex;gap:48px;animation:mq 35s linear infinite;white-space:nowrap}
        .mono{font-family:'IBM Plex Mono',monospace}
        .serif{font-family:'Instrument Serif',serif}
        .tag{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#C8AA64;display:block;margin-bottom:18px}
      `}</style>
      <div className="grain"/>

      {/* NAV */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"18px 36px",
        background:scrollY>60?"rgba(8,9,11,.94)":"transparent",
        backdropFilter:scrollY>60?"blur(20px)":"none",
        borderBottom:scrollY>60?"1px solid rgba(200,170,100,.08)":"1px solid transparent",
        transition:"all .4s",display:"flex",justifyContent:"space-between",alignItems:"center",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:34,height:34,background:"#C8AA64",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span className="mono" style={{fontWeight:700,fontSize:14,color:"#08090B"}}>GP</span>
          </div>
          <span className="mono" style={{fontSize:14,fontWeight:600,letterSpacing:.5}}>grandeprairie<span style={{color:"#C8AA64"}}>.dev</span></span>
        </div>
        <div style={{display:"flex",gap:28,alignItems:"center"}}>
          {["Services","Industries","Pricing","About"].map(n=>(
            <a key={n} href={`#${n.toLowerCase()}`} style={{color:"#6A6560",textDecoration:"none",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1,textTransform:"uppercase",transition:"color .3s"}}
              onMouseEnter={e=>(e.target as HTMLElement).style.color="#E8E6E1"} onMouseLeave={e=>(e.target as HTMLElement).style.color="#6A6560"}>{n}</a>
          ))}
          <button className="cb cp" style={{padding:"10px 22px",fontSize:11}}>Free Audit →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"140px 40px 80px",position:"relative"}}>
        <div style={{position:"absolute",top:"8%",right:"-8%",width:650,height:650,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,170,100,.05) 0%,transparent 65%)",filter:"blur(80px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"10%",left:"-5%",width:450,height:450,borderRadius:"50%",background:"radial-gradient(circle,rgba(60,141,212,.03) 0%,transparent 65%)",filter:"blur(60px)",pointerEvents:"none"}}/>

        <div style={{maxWidth:880,position:"relative",zIndex:2}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"7px 15px",border:"1px solid rgba(200,170,100,.2)",borderRadius:2,marginBottom:36,animation:"fi .8s ease-out both"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#5DB87E",boxShadow:"0 0 8px rgba(93,184,126,.4)"}}/>
            <span className="mono" style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#6A6560"}}>Grande Prairie's Full-Stack Digital Partner</span>
          </div>

          <h1 className="serif" style={{fontSize:"clamp(44px,6.5vw,82px)",fontWeight:400,lineHeight:1.06,marginBottom:28,animation:"fu 1s ease-out .15s both"}}>
            Build it. Run it.<br/><span style={{color:"#C8AA64",fontStyle:"italic"}}>Show what it earned.</span>
          </h1>

          <p style={{fontSize:18,lineHeight:1.7,color:"#7A7670",maxWidth:540,marginBottom:44,animation:"fu 1s ease-out .35s both"}}>
            We build your online presence, run your advertising, and give you a dashboard that tracks every lead back to the dollar that produced it.
          </p>

          <div style={{display:"flex",gap:14,flexWrap:"wrap",animation:"fu 1s ease-out .5s both"}}>
            <button className="cb cp">Get a Free 5-Point Audit</button>
            <button className="cb cs">See a Live Dashboard</button>
          </div>

          <div style={{marginTop:44,padding:"15px 22px",background:"rgba(200,170,100,.05)",borderLeft:"3px solid #C8AA64",maxWidth:500,animation:"fu 1s ease-out .65s both"}}>
            <p className="mono" style={{fontSize:11.5,letterSpacing:.3,color:"#C8AA64",lineHeight:1.7}}>
              County of Grande Prairie offers up to <strong>$2,000 in matching funds</strong> for technology upgrades. We handle the application.
            </p>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section style={{borderTop:"1px solid rgba(232,230,225,.05)",borderBottom:"1px solid rgba(232,230,225,.05)",padding:"18px 0",overflow:"hidden"}}>
        <div className="mtrack">
          {[...Array(2)].flatMap((_,k)=>[
            "Your billboard can't tell you this","60% of GP businesses have no modern website","Paper field tickets cost 500+ hours/year",
            "Radio ads: zero click tracking","After 5pm, every missed call is a lost lead","Royal LePage GP still asks tenants to fax"
          ].map((t,i)=>(
            <span key={`${k}-${i}`} className="mono" style={{fontSize:12,color:"#3A3530",letterSpacing:.5,display:"flex",alignItems:"center",gap:20}}>
              {t}<span style={{color:"#C8AA64",fontSize:7}}>&#9670;</span>
            </span>
          )))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section {...sr("prob")} style={{padding:"110px 40px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:72}}>
          <div>
            <span className="tag">The Problem</span>
            <h2 className="serif" style={{fontSize:38,fontWeight:400,lineHeight:1.2,marginBottom:32}}>
              Grande Prairie businesses spend on advertising. <span style={{color:"#5A5650"}}>They just can't tell if it works.</span>
            </h2>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {[
                {channel:"Radio spots",cost:"$50-$150 per airing",tracking:"Zero attribution"},
                {channel:"Billboard (Pattison / CIA)",cost:"$2,500-$4,500/mo",tracking:"Zero click data"},
                {channel:"Highway digital board",cost:"$800-$2,000/mo",tracking:"Vehicle count only"},
                {channel:"Portable roadside sign",cost:"$200-$400/mo",tracking:"Zero tracking"},
                {channel:"City arena screens",cost:"$300/mo",tracking:"Foot traffic estimate"},
              ].map((r,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr .8fr .7fr",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(232,230,225,.04)",fontSize:13}}>
                  <span style={{color:"#8A8680"}}>{r.channel}</span>
                  <span className="mono" style={{color:"#6A6560",fontSize:11}}>{r.cost}</span>
                  <span className="mono" style={{color:"#C0392B",fontSize:11}}>&#10005; {r.tracking}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="tag" style={{color:"#5DB87E"}}>The Fix</span>
            <h2 className="serif" style={{fontSize:38,fontWeight:400,lineHeight:1.2,marginBottom:32}}>
              Every dollar tracked. <span style={{color:"#5A5650"}}>Every lead named. Every month reported.</span>
            </h2>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {[
                {channel:"Google Ads",cost:"$500-$1,500/mo",tracking:"Cost-per-lead tracked"},
                {channel:"Facebook / Instagram Ads",cost:"$400-$1,200/mo",tracking:"Lead source attributed"},
                {channel:"Local SEO",cost:"$300-$800/mo",tracking:"Ranking + traffic tracked"},
                {channel:"AI lead capture bot",cost:"$200-$500/mo",tracking:"Every conversation logged"},
                {channel:"Monthly dashboard",cost:"Included",tracking:"All channels unified"},
              ].map((r,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr .8fr .7fr",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(232,230,225,.04)",fontSize:13}}>
                  <span style={{color:"#8A8680"}}>{r.channel}</span>
                  <span className="mono" style={{color:"#6A6560",fontSize:11}}>{r.cost}</span>
                  <span className="mono" style={{color:"#5DB87E",fontSize:11}}>&#10003; {r.tracking}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BUILD / RUN / SHOW */}
      <section id="services" {...sr("pillars")} style={{padding:"110px 40px",borderTop:"1px solid rgba(232,230,225,.05)",background:"rgba(232,230,225,.015)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <span className="tag">How We Work</span>
          <h2 className="serif" style={{fontSize:"clamp(36px,4.5vw,54px)",fontWeight:400,lineHeight:1.12,marginBottom:70,maxWidth:650}}>
            Three pillars. <span style={{color:"#5A5650"}}>One integrated system.</span>
          </h2>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
            {[
              {
                num:"01",tag:"BUILD",accent:"#C8AA64",title:"Your Online Presence",
                desc:"We build conversion-ready websites with AI lead capture, booking systems, and workflow automation — every one wired with analytics from day one.",
                items:["Responsive website (5-8 pages)","After-hours AI chatbot","Quote routing + SMS alerts","Google Business optimization","CRM integration","GA4 + conversion tracking setup"],
              },
              {
                num:"02",tag:"RUN",accent:"#3C8DD4",title:"Your Advertising",
                desc:"We run targeted Google Ads, Facebook campaigns, and local SEO — driving qualified leads to the presence we built, with every click tracked.",
                items:["Google Ads management","Facebook / Instagram Ads","Google Local Services Ads","Local SEO + review management","Retargeting campaigns","A/B testing + optimization"],
              },
              {
                num:"03",tag:"SHOW",accent:"#5DB87E",title:"Your Results",
                desc:"We give you a branded dashboard that shows exactly what every dollar produced — leads, cost-per-lead, ad ROI, rankings, trends. No guesswork.",
                items:["Live analytics dashboard","Lead source attribution","Cost-per-lead by channel","Monthly performance report","Quarterly business review","Competitor benchmarking"],
              },
            ].map((p,i)=>(
              <div key={i} className="ch" style={{background:"rgba(232,230,225,.02)",border:"1px solid rgba(232,230,225,.05)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:3,background:p.accent}}/>
                <div style={{padding:"36px 28px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:20}}>
                    <span className="mono" style={{fontSize:40,fontWeight:700,color:"rgba(200,170,100,.07)",lineHeight:1}}>{p.num}</span>
                    <span className="mono" style={{fontSize:12,letterSpacing:2.5,color:p.accent,textTransform:"uppercase",fontWeight:600}}>{p.tag}</span>
                  </div>
                  <h3 style={{fontSize:21,fontWeight:600,marginBottom:10}}>{p.title}</h3>
                  <p style={{fontSize:13.5,lineHeight:1.65,color:"#6A6560",marginBottom:26}}>{p.desc}</p>
                  <ul style={{listStyle:"none",padding:0}}>
                    {p.items.map((item,j)=>(
                      <li key={j} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",fontSize:13,color:"#7A7670",borderBottom:j<p.items.length-1?"1px solid rgba(232,230,225,.03)":"none"}}>
                        <span style={{color:p.accent,fontSize:9,marginTop:5}}>&#9656;</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section {...sr("dash")} style={{padding:"110px 40px",borderTop:"1px solid rgba(232,230,225,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
          <div>
            <span className="tag">The Dashboard</span>
            <h2 className="serif" style={{fontSize:40,fontWeight:400,lineHeight:1.2,marginBottom:24}}>
              This is what your <span style={{color:"#C8AA64",fontStyle:"italic"}}>billboard can't show you.</span>
            </h2>
            <p style={{fontSize:15,lineHeight:1.7,color:"#6A6560",marginBottom:32}}>
              Every client gets a live dashboard. Leads by source, cost per lead, month-over-month trends, ad performance. Updated in real time. Accessible anytime.
            </p>
            <p style={{fontSize:15,lineHeight:1.7,color:"#6A6560",marginBottom:36}}>
              When you can see that Google Ads produced 28 leads at $18 each while your billboard produced zero trackable leads — the conversation about where to spend next month writes itself.
            </p>
            <button className="cb cs" style={{padding:"14px 28px",fontSize:11}}>See a Full Demo →</button>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* PRICING TIERS */}
      <section id="pricing" {...sr("price")} style={{padding:"110px 40px",background:"rgba(232,230,225,.015)",borderTop:"1px solid rgba(232,230,225,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <span className="tag">Pricing</span>
          <h2 className="serif" style={{fontSize:"clamp(36px,4.5vw,54px)",fontWeight:400,marginBottom:16,maxWidth:650}}>
            Three tiers. <span style={{color:"#5A5650"}}>Pick what fits now. Upgrade when it pays for itself.</span>
          </h2>
          <p style={{fontSize:14,color:"#5A5650",marginBottom:60,maxWidth:500}}>County tech grant covers up to $2,000 of setup costs. We handle the application.</p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
            {[
              {
                tier:"Foundation",name:"Get Found",accent:"#C8AA64",
                setup:"$2,500-$5,000",monthly:"$250-$500/mo",
                includes:["Professional website","AI lead capture bot","Google Business Profile","GA4 + conversion tracking","Basic local SEO","Monthly performance report"],
                note:"Net setup cost after grant: $500-$3,000",
                popular:false,
              },
              {
                tier:"Growth",name:"Get Leads",accent:"#3C8DD4",
                setup:"$5,000-$10,000",monthly:"$800-$1,500/mo",
                includes:["Everything in Foundation","Google Ads management","Facebook/IG ad campaigns","Advanced SEO + reviews","CRM integration","Branded analytics dashboard","Quarterly business review"],
                note:"Most popular for contractors & property managers",
                popular:true,
              },
              {
                tier:"Dominate",name:"Own Your Market",accent:"#5DB87E",
                setup:"$10,000-$20,000",monthly:"$1,500-$3,000/mo",
                includes:["Everything in Growth","Multi-channel ad management","Automated quoting systems","AI chatbot + CRM integration","Content creation & social","Competitor monitoring","Monthly strategy call"],
                note:"For oilfield GCs & multi-location businesses",
                popular:false,
              },
            ].map((t,i)=>(
              <div key={i} className="ch" style={{
                background:"rgba(232,230,225,.02)",
                border:t.popular?"1px solid rgba(60,141,212,.3)":"1px solid rgba(232,230,225,.05)",
                borderRadius:3,overflow:"hidden",position:"relative",
              }}>
                {t.popular && <div style={{position:"absolute",top:14,right:14,padding:"4px 10px",background:"rgba(60,141,212,.12)",borderRadius:2}}>
                  <span className="mono" style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#3C8DD4",fontWeight:600}}>Most Popular</span>
                </div>}
                <div style={{height:3,background:t.accent}}/>
                <div style={{padding:"36px 28px"}}>
                  <span className="mono" style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:t.accent,fontWeight:600,display:"block",marginBottom:6}}>{t.tier}</span>
                  <h3 className="serif" style={{fontSize:28,fontWeight:400,marginBottom:20}}>{t.name}</h3>

                  <div style={{marginBottom:6}}>
                    <span className="serif" style={{fontSize:24,color:"#E8E6E1"}}>{t.setup}</span>
                    <span className="mono" style={{fontSize:11,color:"#5A5650",marginLeft:8}}>setup</span>
                  </div>
                  <div style={{marginBottom:24}}>
                    <span className="serif" style={{fontSize:20,color:"#C8AA64"}}>{t.monthly}</span>
                    <span className="mono" style={{fontSize:11,color:"#5A5650",marginLeft:8}}>managed</span>
                  </div>

                  <ul style={{listStyle:"none",padding:0,marginBottom:24}}>
                    {t.includes.map((item,j)=>(
                      <li key={j} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"6px 0",fontSize:13,color:"#7A7670",borderBottom:j<t.includes.length-1?"1px solid rgba(232,230,225,.03)":"none"}}>
                        <span style={{color:t.accent,fontSize:12,marginTop:1}}>&#10003;</span>{item}
                      </li>
                    ))}
                  </ul>

                  <div style={{padding:"12px 0",borderTop:"1px solid rgba(232,230,225,.05)"}}>
                    <p className="mono" style={{fontSize:10.5,color:"#5A5650",lineHeight:1.5,fontStyle:"italic"}}>{t.note}</p>
                  </div>

                  <button className={`cb ${t.popular?"cp":"cs"}`} style={{width:"100%",justifyContent:"center",marginTop:16,padding:"14px 24px",fontSize:11}}>
                    Get Started →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section {...sr("how")} style={{padding:"110px 40px",borderTop:"1px solid rgba(232,230,225,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <span className="tag">The Process</span>
          <h2 className="serif" style={{fontSize:"clamp(36px,4vw,50px)",fontWeight:400,marginBottom:70,maxWidth:550}}>
            From audit to autopilot <span style={{color:"#5A5650"}}>in four steps.</span>
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:28}}>
            {[
              {num:"01",title:"Free Audit",desc:"We review your web presence, current ad spend, lead flow, and competitors. You see exactly where you're leaking money — and what's fixable."},
              {num:"02",title:"Scope + Grant",desc:"We scope your build, apply for the County's $2,000 tech grant on your behalf, and lock in a fixed price. No surprises."},
              {num:"03",title:"Build Sprint",desc:"Website, ads, and automation go live in 2-4 weeks. You see progress daily. Analytics tracking from day one."},
              {num:"04",title:"Run + Report",desc:"Your ads run, leads flow, dashboard updates live. Monthly report lands in your inbox. Quarterly, we sit down and plan what's next."},
            ].map((s,i)=>(
              <div key={i} style={{position:"relative"}}>
                <span className="mono" style={{fontSize:44,fontWeight:700,color:"rgba(200,170,100,.06)",lineHeight:1,display:"block",marginBottom:14}}>{s.num}</span>
                <h3 style={{fontSize:17,fontWeight:600,marginBottom:10,color:"#E8E6E1"}}>{s.title}</h3>
                <p style={{fontSize:13.5,lineHeight:1.65,color:"#5A5650"}}>{s.desc}</p>
                {i<3&&<div style={{position:"absolute",top:22,right:-14,width:28,height:1,background:"rgba(200,170,100,.1)"}}/>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" {...sr("ind")} style={{padding:"110px 40px",background:"rgba(232,230,225,.015)",borderTop:"1px solid rgba(232,230,225,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <span className="tag">Industries</span>
          <h2 className="serif" style={{fontSize:"clamp(36px,4vw,50px)",fontWeight:400,marginBottom:50,maxWidth:600}}>
            We speak your industry <span style={{color:"#5A5650"}}>because we're from here.</span>
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2}}>
            {[
              {icon:"\u{1F527}",label:"Plumbing & HVAC"},{icon:"\u26A1",label:"Electrical"},{icon:"\u{1F6E2}\uFE0F",label:"Oilfield Services"},{icon:"\u{1F3ED}",label:"Fabrication"},
              {icon:"\u{1F3E2}",label:"Property Management"},{icon:"\u{1F3E0}",label:"Real Estate"},{icon:"\u{1F9B7}",label:"Dental Clinics"},{icon:"\u2696\uFE0F",label:"Law Firms"},
              {icon:"\u{1F4CA}",label:"Accounting"},{icon:"\u{1F69B}",label:"Trucking & Logistics"},{icon:"\u{1F9BA}",label:"Safety & Training"},{icon:"\u{1F37D}\uFE0F",label:"Restaurants"},
            ].map((ind,i)=>(
              <div key={i} style={{
                padding:"20px 22px",background:"rgba(232,230,225,.02)",border:"1px solid rgba(232,230,225,.03)",
                display:"flex",alignItems:"center",gap:14,transition:"all .3s",cursor:"default",
              }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(200,170,100,.04)";e.currentTarget.style.borderColor="rgba(200,170,100,.12)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(232,230,225,.02)";e.currentTarget.style.borderColor="rgba(232,230,225,.03)"}}
              >
                <span style={{fontSize:20}}>{ind.icon}</span>
                <span style={{fontSize:13.5,fontWeight:500}}>{ind.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GRANT BANNER */}
      <section {...sr("grant")} style={{margin:"0 40px"}}>
        <div style={{
          background:"linear-gradient(135deg,rgba(200,170,100,.07) 0%,rgba(200,170,100,.02) 100%)",
          border:"1px solid rgba(200,170,100,.12)",borderRadius:4,padding:"52px 56px",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:28,position:"relative",overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:-80,right:-80,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,170,100,.08) 0%,transparent 70%)",filter:"blur(40px)"}}/>
          <div style={{maxWidth:560,position:"relative",zIndex:2}}>
            <h2 className="serif" style={{fontSize:34,fontWeight:400,marginBottom:10}}>
              Your project could cost <span style={{color:"#C8AA64"}}>half</span> what you think.
            </h2>
            <p style={{fontSize:14.5,color:"#7A7670",lineHeight:1.65}}>
              The County of Grande Prairie's Infrastructure Technology Grant offers up to $2,000 in matching funds for digital tools. We handle the paperwork.
            </p>
          </div>
          <button className="cb cp" style={{animation:"pg 3s ease-in-out infinite",position:"relative",zIndex:2}}>Check Eligibility →</button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="about" style={{padding:"130px 40px",textAlign:"center",position:"relative",borderTop:"1px solid rgba(232,230,225,.05)",marginTop:80}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:550,height:550,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,170,100,.05) 0%,transparent 55%)",filter:"blur(70px)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <h2 className="serif" style={{fontSize:"clamp(38px,5vw,60px)",fontWeight:400,lineHeight:1.1,marginBottom:22}}>
            Stop spending blind.<br/><span style={{color:"#C8AA64",fontStyle:"italic"}}>Start tracking every lead.</span>
          </h2>
          <p style={{fontSize:16,color:"#5A5650",maxWidth:460,margin:"0 auto 40px",lineHeight:1.7}}>
            Get a free 5-point audit of your website, ad spend, and lead flow. 15 minutes. No commitment. Just clarity.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center"}}>
            <button className="cb cp" style={{fontSize:12.5}}>Get Your Free Audit</button>
          </div>
          <p className="mono" style={{fontSize:10.5,color:"#2A2520",marginTop:22,letterSpacing:.5}}>
            Or call — we actually answer: (780) 555-0123
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"56px 40px 36px",borderTop:"1px solid rgba(232,230,225,.05)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:40}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:26,height:26,background:"#C8AA64",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span className="mono" style={{fontWeight:700,fontSize:10,color:"#08090B"}}>GP</span>
              </div>
              <span className="mono" style={{fontSize:12.5,fontWeight:600}}>grandeprairie<span style={{color:"#C8AA64"}}>.dev</span></span>
            </div>
            <p style={{fontSize:12.5,color:"#2A2520",maxWidth:300,lineHeight:1.6}}>
              Build. Run. Show. Full-stack digital services for Grande Prairie and the Peace Region.
            </p>
          </div>
          <div style={{display:"flex",gap:44}}>
            {[
              {title:"Services",links:["Contractor Lead Stack","Property Automation","Office Intake","Google Ads Management","Analytics Dashboards"]},
              {title:"Company",links:["About","Pricing","County Tech Grant","Blog","Contact"]},
              {title:"Community",links:["Chamber of Commerce","BILD GP","Innovate Northwest","Peace Region Energy Show"]},
            ].map((col,i)=>(
              <div key={i}>
                <div className="mono" style={{fontSize:9.5,letterSpacing:2,textTransform:"uppercase",color:"#3A3530",marginBottom:14}}>{col.title}</div>
                {col.links.map(l=>(
                  <a key={l} href="#" style={{display:"block",color:"#4A4540",textDecoration:"none",fontSize:12.5,marginBottom:7,transition:"color .3s"}}
                    onMouseEnter={e=>(e.target as HTMLElement).style.color="#E8E6E1"} onMouseLeave={e=>(e.target as HTMLElement).style.color="#4A4540"}>{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{maxWidth:1100,margin:"36px auto 0",paddingTop:20,borderTop:"1px solid rgba(232,230,225,.03)",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10.5,color:"#1A1510"}}>&copy; 2026 grandeprairie.dev — Grande Prairie, Alberta</span>
          <span style={{fontSize:10.5,color:"#1A1510"}}>Proudly local. Built in the Peace Region.</span>
        </div>
      </footer>
    </div>
  );
};

export default Agency;
