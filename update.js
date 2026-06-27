const fs = require('fs');
const file = '/opt/chatzi/app/src/components/landing/landing-page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Backgrounds updates
content = content.replace(/className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-\[#6119E6\]\/10 dark:bg-\[#06030e\] dark:text-white dark:selection:bg-\[#E13382\]\/20"/, 
'className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-[#6119E6]/10 dark:bg-[#06030e] dark:text-white dark:selection:bg-[#E13382]/20 relative"');

content = content.replace(/className="bg-slate-50 py-20 dark:bg-\[#06030e\] sm:py-24"/g, 'className="relative z-10 py-20 sm:py-24"');
content = content.replace(/className="relative z-20 py-20 shadow-\[0_-20px_40px_rgba\(0,0,0,0\.05\)\] dark:shadow-\[0_-20px_40px_rgba\(0,0,0,0\.5\)\] sm:py-24"/g, 'className="relative z-20 py-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.6)] sm:py-24"');
content = content.replace(/className="bg-white py-20 dark:bg-primary-950 sm:py-24"/g, 'className="relative z-10 py-20 sm:py-24"');
content = content.replace(/className="bg-slate-50 py-20 dark:bg-primary-900 sm:py-24"/g, 'className="relative z-10 py-20 sm:py-24"');
content = content.replace(/className="bg-slate-50 py-16 dark:bg-\[#06030e\] sm:py-20"/g, 'className="relative z-10 py-16 sm:py-20"');
content = content.replace(/className="bg-white py-16 dark:bg-primary-950 sm:py-20"/g, 'className="relative z-10 py-16 sm:py-20"');

// Add glow effects
content = content.replace(/<section id="workflow" className="([^"]+)">/, '<section id="workflow" className="$1">\n        <div className="absolute left-0 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6119E6]/10 blur-[120px] pointer-events-none" />');
content = content.replace(/<section id="channels" className="([^"]+)">/, '<section id="channels" className="$1">\n        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-[#E13382]/10 blur-[120px] pointer-events-none" />');

// 2. Fix the Hero grid
const oldGrid = `{Array.from({ length: 24 }).map((_, i) => {
              const x2 = (i / 23) * 100;
              return (
                <line
                  key={i}
                  x1="50%"
                  y1="20%"
                  x2={\`\${x2}%\`}
                  y2="100%"
                  stroke="url(#line-glow)"
                  strokeWidth="0.75"
                />
              );
            })}`;

const newGrid = `{Array.from({ length: 48 }).map((_, i) => {
              const x2 = (i / 47) * 200 - 50;
              return (
                <line
                  key={i}
                  x1="50%"
                  y1="-30%"
                  x2={\`\${x2}%\`}
                  y2="100%"
                  stroke="url(#line-glow)"
                  strokeWidth="1"
                />
              );
            })}`;
content = content.replace(oldGrid, newGrid);

// 3. Update Pricing/Contact Section
const pricingStartIdx = content.indexOf('<section className="relative z-10 py-20 sm:py-24">\\n        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">\\n          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">');
// Since regex replace might use standard newlines let's do a more robust indexOf
const pricingSearchStr = '<section className="relative z-10 py-20 sm:py-24">\\n        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">\\n          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">'.replace(/\\\\n/g, '\\n');
const idx = content.indexOf(pricingSearchStr);

if (idx !== -1) {
  let depth = 1;
  let closingIdx = -1;
  let scanIdx = idx + '<section'.length;
  while(scanIdx < content.length) {
    if (content.startsWith('<section', scanIdx)) depth++;
    if (content.startsWith('</section>', scanIdx)) {
      depth--;
      if (depth === 0) {
        closingIdx = scanIdx + '</section>'.length;
        break;
      }
    }
    scanIdx++;
  }

  if (closingIdx !== -1) {
    const newPricingHtml = \`      <section className="relative z-10 py-20 sm:py-24">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6119E6]/10 blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-5xl">{copy.pricingTitle}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">{copy.pricing}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 mb-24">
            {[
              {
                name: isEnglish ? "Essential" : "الأساسية",
                price: isEnglish ? "$49" : "49$",
                period: isEnglish ? "/month" : "/شهر",
                description: isEnglish ? "Perfect for small teams getting started with AI support." : "مثالية للفرق الصغيرة للبدء في الدعم الذكي.",
                features: isEnglish 
                  ? ["1 AI Agent", "Up to 500 conversations/mo", "Website Chat integration", "Basic Inbox", "Email support"] 
                  : ["وكيل ذكي واحد", "حتى 500 محادثة شهرياً", "ربط مع شات الموقع", "صندوق بريد أساسي", "دعم عبر البريد"],
                button: isEnglish ? "Get Started" : "ابدأ الآن",
                highlighted: false,
              },
              {
                name: isEnglish ? "Growth" : "النمو",
                price: isEnglish ? "$99" : "99$",
                period: isEnglish ? "/month" : "/شهر",
                description: isEnglish ? "For growing businesses needing omnichannel support." : "للشركات النامية التي تحتاج إلى دعم متعدد القنوات.",
                features: isEnglish 
                  ? ["3 AI Agents", "Up to 2000 conversations/mo", "WhatsApp & Messenger", "Advanced Inbox & CRM", "Priority support"] 
                  : ["3 وكلاء ذكاء اصطناعي", "حتى 2000 محادثة شهرياً", "ربط واتساب وماسنجر", "صندوق متقدم و CRM", "دعم أولوية"],
                button: isEnglish ? "Start Free Trial" : "ابدأ التجربة المجانية",
                highlighted: true,
              },
              {
                name: isEnglish ? "Enterprise" : "الشركات",
                price: isEnglish ? "Custom" : "مخصص",
                period: "",
                description: isEnglish ? "Full-scale automation with custom workflows." : "أتمتة شاملة مع سير عمل مخصص بالكامل.",
                features: isEnglish 
                  ? ["Unlimited AI Agents", "Unlimited conversations", "All channels & Webhooks", "Dedicated account manager", "Custom integrations"] 
                  : ["وكلاء غير محدودين", "محادثات غير محدودة", "كل القنوات و Webhooks", "مدير حساب مخصص", "تكامل مخصص"],
                button: isEnglish ? "Contact Sales" : "تواصل مع المبيعات",
                highlighted: false,
              }
            ].map((plan, i) => (
              <div key={i} className={\\\`relative flex flex-col rounded-2xl border \\\${plan.highlighted ? 'border-[#6119E6] dark:border-[#E13382] shadow-2xl shadow-[#6119E6]/20' : 'border-slate-200 dark:border-white/10'} bg-white/50 dark:bg-[#0c081c]/50 p-8 backdrop-blur-xl\\\`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6119E6] to-[#E13382] px-4 py-1 text-xs font-bold text-white">
                    {isEnglish ? "Most Popular" : "الأكثر شهرة"}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-slate-900 dark:text-white">
                  {plan.price}
                  <span className="ml-1 text-xl font-medium text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                <ul className="mt-8 flex-1 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={18} className="text-[#6119E6] dark:text-[#E13382]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className={\\\`mt-8 block rounded-xl px-6 py-3 text-center text-sm font-bold transition \\\${plan.highlighted ? 'bg-[#6119E6] text-white hover:opacity-90 dark:bg-[#E13382]' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'}\\\`}
                >
                  {plan.button}
                </Link>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-4xl">
             <div className="rounded-2xl border border-slate-200 bg-white/50 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0c081c]/50">
               <div className="text-center">
                 <p className="text-sm font-extrabold uppercase tracking-wide text-[#6119E6] dark:text-[#E13382]">{copy.contact?.title}</p>
                 <h3 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">{copy.contact?.subtitle}</h3>
               </div>
               
               <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
                 <div className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-white/5 sm:w-auto">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                     <FaWhatsapp size={22} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp</p>
                     <a href={\\\`https://wa.me/\\\${copy.contact?.phone?.replace(/\\\\D/g, '')}\\\`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-[#25D366] dark:text-slate-400" dir="ltr">{copy.contact?.phone}</a>
                   </div>
                 </div>
                 
                 <div className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-white/5 sm:w-auto">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0084FF]/15 text-[#0084FF]">
                     <FaFacebookMessenger size={22} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">Messenger</p>
                     <a href="https://m.me/chatzi.io" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-[#0084FF] dark:text-slate-400" dir="ltr">@chatzi.io</a>
                   </div>
                 </div>

                 <div className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-white/5 sm:w-auto">
                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                     <FaEnvelope size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">Email</p>
                     <a href={\\\`mailto:\\\${copy.contact?.email}\\\`} className="text-sm text-slate-500 hover:text-rose-500 dark:text-slate-400">{copy.contact?.email}</a>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>\`;
    
    content = content.slice(0, idx) + newPricingHtml + content.slice(closingIdx);
    console.log('Replaced pricing section.');
  } else {
    console.log('Found pricing start but not end.');
  }
} else {
  console.log('Pricing section not found.');
}

fs.writeFileSync(file, content);
console.log('Modifications done successfully');
