import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Award, MessageSquare, BookOpen, Layers, Trophy, PlayCircle, RefreshCcw, Settings as SettingsIcon, BarChart2, Home, ChevronRight, ChevronLeft } from "lucide-react";

/**
 * IB ECONOMICS INTERACTIVE TUTOR (Single-file React artifact)
 * - Tailwind CSS classes
 * - lucide-react icons
 * - LocalStorage progress & settings
 * - Embedded AI Assistant (heuristic fallback; optional OpenAI key)
 * - Section tests with MCQ + Short Answer (rubrics)
 * - Master Final Exam with recommendations
 *
 * HOW TO USE
 *  - Drop this file into a React project (Vite/CRA/Next) with Tailwind set up.
 *  - Ensure `lucide-react` is available.
 *  - Render <IbEconTutor /> as default export on a page.
 *  - Optional: enter an OpenAI API key in Settings to enable AI grading/tutor.
 */

// ----------------------------- Utility: Local Storage -----------------------------
const LS_KEY = "ibecon_tutor_progress_v1";
const LS_SETTINGS_KEY = "ibecon_tutor_settings_v1";

function loadLS(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ----------------------------- Curriculum Data -----------------------------
// Structure: 6 Sections (3–4 lessons each). Lessons ~3–5 min read (concise here but structured).
// Content aligned to IB Econ: Foundations, Micro (Markets & Elasticities), Micro (Gov & Failure), Macro, Global Economy, Development.

/** Types */
/** @typedef {{ id:string, type:"mcq"|"short", prompt:string, options?:string[], answer?:number, rubric?:{criteria:string[], guidance:string}, maxScore:number }} Question */
/** @typedef {{ id:string, title:string, md:string }} Lesson */
/** @typedef {{ id:string, title:string, lessons:Lesson[], test:{ questions:Question[] } }} Section */

const curriculum /**: Section[] */ = [
  {
    id: "foundations",
    title: "Foundations: Economic Thinking & Models",
    lessons: [
      {
        id: "scarcity-choice",
        title: "Scarcity, Choice, and Opportunity Cost",
        md: `# Scarcity, Choice, Opportunity Cost\n\n**Scarcity** means resources are limited while wants are unlimited. Because of scarcity, **choice** is necessary and every choice implies an **opportunity cost**—the next best alternative forgone.\n\n**Key Ideas**\n- Economic goods vs. free goods; factors of production (land, labour, capital, entrepreneurship).\n- Production possibilities curve (PPC): shows trade-offs; points inside (inefficiency), on (efficient), outside (unattainable given resources/tech).\n- Economic growth shifts the PPC outward (more/better resources, technology).\n\n**Example**\nA government decides between spending on healthcare vs. defense. More of one typically means less of the other today. Investing in education can shift the PPC outward over time by improving labour quality.\n\n**Practice**\nSketch a simple PPC and label an efficient point, an inefficient point, and a potential growth shift.`
      },
      {
        id: "positive-normative",
        title: "Positive vs Normative & Economic Systems",
        md: `# Positive vs Normative & Systems\n\n- **Positive statements**: factual, testable (\"An increase in minimum wage will raise firm costs\").\n- **Normative statements**: value judgments (\"The minimum wage should be higher\").\n- **Economic systems**: market, command, mixed. Most modern economies are **mixed**, combining market allocation with government intervention.\n\n**Institutions & Incentives**\nProperty rights, rule of law, and incentives influence productivity and innovation.\n\n**Application**\nExplain why purely command economies struggle with information and incentives, and how mixed systems try to balance efficiency with equity.`
      },
      {
        id: "models-methods",
        title: "Models, Ceteris Paribus, and Data",
        md: `# Models, Ceteris Paribus, and Data\n\nEconomists build simplified **models** to explain/predict outcomes. **Ceteris paribus** (holding other factors constant) helps isolate relationships.\n\n**Data & Evidence**\nUse time series, cross-section, and panel data; beware of correlation vs. causation. Natural experiments and randomized trials (where feasible) improve causal inference.\n\n**Example**\nEvaluating a tax on sugary drinks: compare pre/post consumption while controlling for income changes and substitutes.`
      }
    ],
    test: {
      questions: [
        { id: "f1", type: "mcq", prompt: "Which best defines opportunity cost?", options: ["The total monetary cost of a choice","The benefit from all alternatives","The value of the next best alternative forgone","The utility gained from consumption"], answer: 2, maxScore: 1 },
        { id: "f2", type: "short", prompt: "Using a PPC, explain how investment in technology affects a country's production possibilities over time.", rubric: { criteria: ["Outward shift of PPC","Link to capital/tech improving productivity","Time dimension (long run)"], guidance: "Mention outward shift, productivity gains, and long-run growth." }, maxScore: 3 },
        { id: "f3", type: "mcq", prompt: "A positive statement is:", options: ["The central bank should cut rates","Rent control is unfair","Raising taxes reduces disposable income","The minimum wage ought to be raised"], answer: 2, maxScore: 1 },
        { id: "f4", type: "short", prompt: "Contrast market and command systems in terms of information and incentives.", rubric: { criteria: ["Price signals vs central planning","Incentives for efficiency/innovation","Equity/coordination trade-offs"], guidance: "Discuss price signals, incentive alignment, and planning issues." }, maxScore: 3 },
        { id: "f5", type: "mcq", prompt: "Ceteris paribus means:", options: ["After taxes","Other things equal","Before interest","Ignoring opportunity cost"], answer: 1, maxScore: 1 }
      ]
    }
  },
  {
    id: "micro-markets",
    title: "Micro I: Competitive Markets & Elasticities",
    lessons: [
      { id: "demand-supply", title: "Demand & Supply Basics", md: `# Demand & Supply\n\n**Demand**: inverse relation between price and quantity demanded (law of demand), driven by income effect and substitution effect. Shifters: income, tastes, prices of related goods, expectations, number of buyers.\n\n**Supply**: direct relation between price and quantity supplied (law of supply). Shifters: input costs, technology, taxes/subsidies, expectations, number of sellers.\n\n**Equilibrium**: where Qd = Qs; surpluses put downward pressure on price; shortages push price up.\n\n**Applications**: harvest shocks, tech improvements, and policy changes.` },
      { id: "elasticities", title: "Elasticities (PED, PES, XED, YED)", md: `# Elasticities\n\n- **Price Elasticity of Demand (PED)**: responsiveness of Qd to price; depends on substitutes, necessity, income share, time horizon.\n- **Price Elasticity of Supply (PES)**: responsiveness of Qs; depends on spare capacity, factor mobility, time.\n- **Cross Elasticity (XED)**: substitutes (+) vs complements (−).\n- **Income Elasticity (YED)**: normal (+) vs inferior (−).\n\n**Policy**: tax revenue depends on elasticity; with inelastic demand, consumers bear more incidence.` },
      { id: "consumer-producer-surplus", title: "Welfare: Consumer & Producer Surplus", md: `# Welfare\n\n**Consumer surplus**: difference between willingness-to-pay and price. **Producer surplus**: price minus marginal cost. Total surplus maximized at competitive equilibrium (ignoring externalities).\n\n**Shifts** change surpluses; taxes create deadweight loss depending on elasticities.` }
    ],
    test: { questions: [
      { id: "m1", type:"mcq", prompt: "If PED is elastic (>1), a price increase will:", options:["Raise total revenue","Lower total revenue","Not change revenue","Increase producer surplus"], answer:1, maxScore:1 },
      { id: "m2", type:"short", prompt: "Explain how the availability of close substitutes affects PED, using an example.", rubric:{criteria:["Substitutes increase elasticity","Consumer switching rationale","Concrete example"], guidance:"Use a brand vs. generic example or transport modes."}, maxScore:3 },
      { id: "m3", type:"mcq", prompt: "A positive XED implies:", options:["Inferior goods","Complements","Normal goods","Substitutes"], answer:3, maxScore:1 },
      { id: "m4", type:"short", prompt: "Why is PES typically more elastic in the long run?", rubric:{criteria:["Time to adjust inputs","Capacity/factor mobility","Investment response"], guidance:"Mention planning and capacity expansion."}, maxScore:3 },
      { id: "m5", type:"mcq", prompt: "At equilibrium in a competitive market:", options:["CS + PS is maximized (no externalities)","There is always a shortage","Price equals average cost","Government revenue is maximized"], answer:0, maxScore:1 }
    ]}
  },
  {
    id: "micro-failure",
    title: "Micro II: Government, Market Failure, & Firms",
    lessons: [
      { id: "intervention", title: "Taxes, Subsidies, and Price Controls", md: `# Intervention\n\n- **Indirect taxes** (specific/ad valorem): raise price, reduce Q; incidence depends on elasticities.\n- **Subsidies**: lower price to consumers, raise received price for producers; increase Q; fiscal cost.\n- **Price ceiling** (max): below equilibrium → shortage, non-price rationing. **Price floor** (min): above equilibrium → surplus, e.g., minimum wages/agricultural supports.\n\n**Evaluation**: efficiency vs equity trade-offs, unintended consequences.` },
      { id: "failure", title: "Market Failure & Externalities", md: `# Market Failure\n\nTypes: externalities (consumption/production; positive/negative), public goods (non-rival, non-excludable), common access resources, information asymmetry, market power.\n\n**Externalities**: MSC/MSB vs MPC/MPB. Taxes for negative externalities; subsidies for positive; permits, standards, nudges.\n\n**Public goods**: free-rider problem → government provision.\n\n**Information**: regulation, warranties, signaling/screening.` },
      { id: "firms", title: "Firms, Costs, and Market Structures", md: `# Firms & Structures\n\n**Costs**: fixed vs variable; ATC, AVC, MC; short-run vs long-run, economies/diseconomies of scale.\n\n**Structures**: perfect competition, monopolistic competition, oligopoly, monopoly; pricing power, efficiency, non-price competition; game theory basics (prisoner’s dilemma).` }
    ],
    test: { questions: [
      { id:"g1", type:"mcq", prompt:"A binding price ceiling creates:", options:["Surplus","Shortage","No change","Higher equilibrium price"], answer:1, maxScore:1 },
      { id:"g2", type:"short", prompt:"Using MSC and MPC, explain how a carbon tax can reduce deadweight loss from a negative production externality.", rubric:{criteria:["MSC>MPC pre-tax","Tax internalizes external cost (MPC→MSC)","DWL reduction via moving toward social optimum"], guidance:"Diagram language acceptable."}, maxScore:3 },
      { id:"g3", type:"mcq", prompt:"Public goods are characterized by:", options:["Rivalry and excludability","Non-rivalry and non-excludability","Non-rivalry and excludability","Rivalry and non-excludability"], answer:1, maxScore:1 },
      { id:"g4", type:"short", prompt:"Give one policy to address information asymmetry in used-car markets and evaluate a limitation.", rubric:{criteria:["Policy named (warranty, inspection, disclosure)","Mechanism explained","Limitation/offset"], guidance:"Be specific."}, maxScore:3 },
      { id:"g5", type:"mcq", prompt:"In the long run, economies of scale typically:", options:["Raise ATC","Lower ATC up to a point","Have no effect","Guarantee monopoly"], answer:1, maxScore:1 }
    ]}
  },
  {
    id: "macro",
    title: "Macroeconomics: AD/AS, Objectives, and Policy Mix",
    lessons: [
      { id:"adas", title:"Aggregate Demand & Supply", md:`# AD & AS\n\n**AD** = C + I + G + (X−M). Shifts: income, confidence, interest rates, fiscal stance, external demand. **AS** (SRAS/LRAS) driven by costs/productivity and potential output.\n\n**Gaps**: recessionary vs inflationary; output vs price-level effects.\n\n**Shocks**: supply shocks (oil), demand shocks (housing/credit).` },
      { id:"objectives", title:"Macro Objectives", md:`# Objectives\n\nGrowth, low and stable inflation, low unemployment, external balance, income distribution. Trade-offs (e.g., Phillips curve short-run).` },
      { id:"policy", title:"Policy Toolkit: Fiscal, Monetary, Supply-side", md:`# Policies\n\n**Fiscal**: government spending/taxes; multipliers; crowding out (context-specific). **Monetary**: interest rates, open-market ops; lags. **Supply-side**: education, R&D, labour market reforms; time horizons differ.\n\n**Evaluation**: depends on output gaps, expectations, constraints.` }
    ],
    test: { questions: [
      { id:"ma1", type:"mcq", prompt:"An increase in interest rates is most likely to:", options:["Raise investment","Lower investment and AD","Raise government spending","Increase net exports"], answer:1, maxScore:1 },
      { id:"ma2", type:"short", prompt:"Explain how a negative supply shock affects inflation and output in the short run.", rubric:{criteria:["SRAS leftward shift","Higher price level (cost-push)","Lower output (stagflation risk)"], guidance:"Use AD–AS language."}, maxScore:3 },
      { id:"ma3", type:"mcq", prompt:"Which is a supply-side policy?", options:["Cutting VAT temporarily","Lowering the policy rate","Apprenticeship and training subsidies","One-off stimulus cheques"], answer:2, maxScore:1 },
      { id:"ma4", type:"short", prompt:"Under what conditions might expansionary fiscal policy be more effective than monetary policy?", rubric:{criteria:["Liquidity trap/zero lower bound","Weak monetary transmission","High fiscal multipliers"], guidance:"Relate to expectations and slack."}, maxScore:3 },
      { id:"ma5", type:"mcq", prompt:"The components of AD are:", options:["C+S+T+G","C+I+G+(X−M)","W+R+I+P","Y=C+S+T"], answer:1, maxScore:1 }
    ]}
  },
  {
    id: "global",
    title: "Global Economy: Trade, Exchange Rates, and BoP",
    lessons: [
      { id:"trade-theory", title:"Trade Theory & Protection", md:`# Trade Theory & Protection\n\n**Comparative advantage** drives gains from specialization and trade.\n\n**Protection**: tariffs, quotas, subsidies—motives include infant industry, strategic sectors, anti-dumping; costs include DWL, retaliation, consumer loss.\n\n**WTO**: rules-based system; exceptions exist (safeguards).` },
      { id:"fx", title:"Exchange Rates & Policies", md:`# Exchange Rates\n\nDemand/supply of a currency in FX markets; factors: interest rate differentials, trade balance, expectations. **Regimes**: fixed, managed float, freely floating.\n\n**Policies**: reserves intervention, capital controls (rare in IB contexts).` },
      { id:"bop", title:"Balance of Payments & ToT", md:`# BoP & Terms of Trade\n\n**BoP**: current account (goods, services, income, transfers), capital/financial account.\n\n**Terms of Trade (ToT)**: index of export prices relative to import prices; implications for income and sustainability, especially for primary-commodity exporters.` }
    ],
    test: { questions: [
      { id:"gl1", type:"mcq", prompt:"A tariff generally:", options:["Raises consumer surplus","Lowers domestic price","Creates deadweight loss","Has no effect on imports"], answer:2, maxScore:1 },
      { id:"gl2", type:"short", prompt:"Explain two factors that can cause a currency to appreciate in a floating regime.", rubric:{criteria:["Higher interest rates/capital inflows","Stronger net exports/terms of trade","Expectations/confidence"], guidance:"Name any two and explain."}, maxScore:3 },
      { id:"gl3", type:"mcq", prompt:"The current account includes:", options:["FDI inflows","Portfolio flows","Goods and services trade","Official reserves transactions"], answer:2, maxScore:1 },
      { id:"gl4", type:"short", prompt:"What are the consequences of a persistent current account deficit?", rubric:{criteria:["External debt/financing need","Exchange rate pressure","Adjustment via policy or income"], guidance:"Short and specific."}, maxScore:3 },
      { id:"gl5", type:"mcq", prompt:"An improvement in ToT means:", options:["Export prices fall relative to imports","Import prices rise faster than exports","Export prices rise relative to imports","No real income effect"], answer:2, maxScore:1 }
    ]}
  },
  {
    id: "development",
    title: "Development Economics: Measures & Strategies",
    lessons: [
      { id:"measures", title:"Measuring Development", md:`# Measuring Development\n\nBeyond GDP: **GNI per capita**, **PPP**, **Human Development Index (HDI)**, multidimensional poverty, inequality (Gini).\n\n**Limitations**: data quality, non-market activity, distribution, sustainability.` },
      { id:"strategies", title:"Strategies: Markets, Intervention, and Institutions", md:`# Strategies\n\n**Market-led**: trade liberalization, microfinance, property rights. **Interventionist**: public goods, health/education, industrial policy.\n\n**Institutions**: rule of law, governance, corruption control, infrastructure.\n\n**Evaluation**: context matters; sequencing and capacity are crucial.` },
      { id:"aid-debt", title:"Aid, Debt, and Sustainability", md:`# Aid, Debt, Sustainability\n\n**Aid**: humanitarian vs development; tied vs untied; effectiveness debates. **Debt**: burden, restructuring; **Sustainability**: SDGs, environmental constraints.\n\n**Case Lens**: commodity dependence and vulnerability to shocks.` }
    ],
    test: { questions: [
      { id:"dv1", type:"mcq", prompt:"HDI combines:", options:["Income, inflation, unemployment","Income, health, education","GDP, Gini, life expectancy","GNI, FX reserves, literacy"], answer:1, maxScore:1 },
      { id:"dv2", type:"short", prompt:"Explain why PPP adjustments are useful when comparing living standards across countries.", rubric:{criteria:["Price level differences","Real purchasing power","Cross-country comparability"], guidance:"Mention tradables vs non-tradables effects."}, maxScore:3 },
      { id:"dv3", type:"mcq", prompt:"A potential drawback of tied aid is:", options:["Higher efficiency","Greater choice for recipients","Lower cost to donors","Distortion toward donor goods/services"], answer:3, maxScore:1 },
      { id:"dv4", type:"short", prompt:"Give one institutional reform that can promote development and explain the channel.", rubric:{criteria:["Specific reform (property rights, judiciary, anti-corruption)","Mechanism for investment/productivity","Feasibility or constraint"], guidance:"One solid example suffices."}, maxScore:3 },
      { id:"dv5", type:"mcq", prompt:"Commodity dependence often implies:", options:["Lower volatility","Stable export revenues","Exposure to terms-of-trade shocks","Faster diversification"], answer:2, maxScore:1 }
    ]}
  }
];

// ----------------------------- Master Final Exam -----------------------------
const finalExam = {
  questions: [
    { id:"E1", type:"mcq", prompt:"If a government subsidizes positive externality goods, the likely effect is:", options:["Lower quantity and higher price","Higher quantity and lower effective price","No change in quantity","Higher deadweight loss from underconsumption"], answer:1, maxScore:1 },
    { id:"E2", type:"short", prompt:"Using AD–AS, analyze the short-run and potential long-run effects of a large fiscal stimulus during a recession.", rubric:{criteria:["AD shift right; output gap closes","Inflation/price level effects","Long-run: crowding in/out, LRAS if supply-side","Context on slack and multipliers"], guidance:"Be balanced; mention conditions."}, maxScore:4 },
    { id:"E3", type:"mcq", prompt:"A currency depreciation tends to:", options:["Worsen net exports immediately with no J-curve","Improve price competitiveness, possibly improving NX","Lower domestic inflation instantly","Eliminate current account deficits"], answer:1, maxScore:1 },
    { id:"E4", type:"short", prompt:"Explain with an example how information asymmetry can lead to market failure and one corrective policy.", rubric:{criteria:["Mechanism (adverse selection/moral hazard)","Concrete example","Policy and limitation"], guidance:"Used-cars, insurance or labor markets are fine."}, maxScore:4 },
    { id:"E5", type:"mcq", prompt:"Which set correctly pairs measure with theme?", options:["GNI per capita – inflation","HDI – health/education/income","PES – demand responsiveness","XED – income responsiveness"], answer:1, maxScore:1 },
    { id:"E6", type:"short", prompt:"Evaluate the case for a carbon tax versus tradable permits to address negative production externalities.", rubric:{criteria:["Internalization mechanism","Efficiency & certainty trade-off (price vs quantity)","Administrative feasibility & politics"], guidance:"Reference elasticity/uncertainty."}, maxScore:4 },
    { id:"E7", type:"mcq", prompt:"In monopolistic competition, in the long run firms:", options:["Earn positive economic profit","Produce at minimum ATC","Face zero economic profit due to entry","Set P=MC"], answer:2, maxScore:1 },
    { id:"E8", type:"short", prompt:"Why might PPP adjustments change rankings of living standards relative to market-exchange-rate comparisons?", rubric:{criteria:["Tradables vs non-tradables prices","Balassa-Samuelson intuition","Comparability"], guidance:"Concise analytical explanation."}, maxScore:3 },
    { id:"E9", type:"mcq", prompt:"The primary trade-off of a binding minimum wage is between:", options:["Equity and efficiency (possible unemployment)","Inflation and growth","Exports and imports","Fiscal and monetary policy"], answer:0, maxScore:1 },
    { id:"E10", type:"short", prompt:"Discuss one reason why expansionary monetary policy may be weak when banks are capital constrained.", rubric:{criteria:["Transmission via lending\n","Capital adequacy constraints","Lending channel impairments"], guidance:"Mention credit supply frictions."}, maxScore:3 },
    { id:"E11", type:"mcq", prompt:"A persistent current account surplus can lead to:", options:["Currency depreciation","Upward pressure on the currency","Immediate recession","Falling reserves"], answer:1, maxScore:1 },
    { id:"E12", type:"short", prompt:"Using welfare areas, explain how a tariff affects CS, PS, government revenue, and DWL.", rubric:{criteria:["CS falls","PS rises","Gov revenue rectangles","DWL triangles"], guidance:"Use standard partial-equilibrium analysis."}, maxScore:4 }
  ]
};

// ----------------------------- Heuristic Grader & Helpers -----------------------------
function scoreShortAnswer(text, rubric) {
  if (!text) return 0;
  const t = text.toLowerCase();
  let score = 0;
  const keywords = rubric?.criteria || [];
  keywords.forEach((k) => {
    const parts = k.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const hit = parts.some(p => t.includes(p));
    if (hit) score += 1;
  });
  // Normalize to rubric criteria count
  const max = keywords.length || 3;
  const ratio = Math.min(score / max, 1);
  const maxScore = rubric?.maxScore || 3; // not provided; we pass separately in question
  return Math.round(ratio * maxScore);
}

async function openAIGrade({ prompt, answer, rubric, apiKey }) {
  // Fallback to heuristic if no key
  if (!apiKey) {
    return { score: scoreShortAnswer(answer, rubric), feedback: "Heuristic feedback based on rubric coverage." };
  }
  try {
    const sys = `You are a careful IB Economics marker. Score the student's short answer out of the max indicated. Use the rubric criteria. Provide 2-3 bullet feedback points.`;
    const user = `Rubric criteria: ${rubric?.criteria?.join("; ") || ""}\nMax score: ${rubric?.maxScore || 3}\nQuestion: ${prompt}\nStudent answer: ${answer}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [ { role: "system", content: sys }, { role: "user", content: user } ],
        temperature: 0.2,
      })
    });
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || "";
    // Extract a score by regex; fallback to heuristic
    const m = content.match(/(\d+\.?\d*)\s*\/\s*(\d+)/);
    const max = rubric?.maxScore || 3;
    let score = scoreShortAnswer(answer, rubric);
    if (m) {
      const got = parseFloat(m[1]);
      const denom = parseFloat(m[2]) || max;
      score = Math.min(Math.round((got / denom) * max), max);
    }
    return { score, feedback: content || "AI feedback provided." };
  } catch (e) {
    return { score: scoreShortAnswer(answer, rubric), feedback: "Network error: used heuristic grading." };
  }
}

// ----------------------------- Assistant (Tutor) -----------------------------
async function assistantReply({ apiKey, context, question }) {
  const sys = `You are a Socratic IB Economics tutor. Encourage learning with hints and questions first, then gently reveal answers. Keep replies under 200 words.`;
  const user = `Context:\n${context}\n\nStudent: ${question}`;
  if (!apiKey) {
    // Heuristic: simple hinting engine
    const hints = [
      "Start by defining key terms in the question.",
      "Sketch a quick diagram if relevant (PPC, AD–AS, MSC/MPC).",
      "State the direction of shifts and the intuition before calculation.",
      "Conclude with a brief evaluation: assumptions, time horizon, stakeholders."
    ];
    return `Here are some nudges:\n• ${hints.join("\n• ")}\nIf you share your attempt, I can pinpoint what to adjust.`;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [ { role: "system", content: sys }, { role: "user", content: user } ], temperature: 0.4 })
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || "(No response)";
  } catch {
    return "I had trouble reaching the AI service, so here are heuristics: define terms, diagram, explain the mechanism, then evaluate trade-offs.";
  }
}

// ----------------------------- Progress Model -----------------------------
/** @typedef {{ lessonsCompleted: Record<string, boolean>, sectionScores: Record<string, { attempts:number, best:number }>, exam:{ attempts:number, best:number } }} Progress */
const defaultProgress = { lessonsCompleted: {}, sectionScores: {}, exam: { attempts: 0, best: 0 } };

// ----------------------------- UI Components -----------------------------
function Pill({ children }) { return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>; }

function Header({ onNav, onOpenDashboard, onOpenExam, onOpenSettings, onOpenHome }) {
  return (
    <div className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <button className="p-2 rounded hover:bg-gray-100" onClick={onOpenHome} title="Home"><Home className="w-5 h-5"/></button>
        <BookOpen className="w-5 h-5"/>
        <div className="font-semibold">IB Economics Interactive Tutor</div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onOpenDashboard} className="flex items-center gap-1 rounded px-3 py-1.5 hover:bg-gray-100"><BarChart2 className="w-4 h-4"/> Dashboard</button>
          <button onClick={onOpenExam} className="flex items-center gap-1 rounded px-3 py-1.5 hover:bg-gray-100"><Trophy className="w-4 h-4"/> Final Exam</button>
          <button onClick={onOpenSettings} className="flex items-center gap-1 rounded px-3 py-1.5 hover:bg-gray-100"><SettingsIcon className="w-4 h-4"/> Settings</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ sections, current, onSelect, progress }) {
  return (
    <aside className="w-full md:w-64 border-r bg-white/60">
      <div className="p-3 text-xs uppercase tracking-wide text-gray-500">Curriculum</div>
      <ul>
        {sections.map((s, i) => {
          const ps = progress.sectionScores[s.id]?.best ?? 0;
          return (
            <li key={s.id}>
              <button onClick={() => onSelect(i)} className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 ${current===i?"bg-gray-50": ""}`}>
                <Layers className="w-4 h-4 mt-0.5"/>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">{s.title} {ps>0 && <Pill><Award className="w-3 h-3 mr-1"/> {ps}%</Pill>}</div>
                  <div className="text-sm text-gray-600">{s.lessons.length} lessons · 1 test</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60"/>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Markdown({ md }) {
  // minimal markdown: # headings, **bold**, lists, paragraphs
  const html = useMemo(() => {
    let out = md
      .replace(/^###\s(.+)$/gm, '<h3 class="text-lg font-semibold mt-4">$1</h3>')
      .replace(/^##\s(.+)$/gm, '<h2 class="text-xl font-semibold mt-4">$1</h2>')
      .replace(/^#\s(.+)$/gm, '<h1 class="text-2xl font-semibold mt-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^-\s(.+)$/gm, '<li>$1</li>')
      .replace(/(\n){2,}/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    out = `<p>${out}</p>`;
    out = out.replace(/<p><li>/g, '<ul class="list-disc pl-6"><li>').replace(/<\/li><\/p>/g, '</li></ul>');
    return out;
  }, [md]);
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

function LessonView({ section, lesson, onMarkComplete, completed }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">{section.title}</h1>
        <Pill>Lesson</Pill>
      </div>
      <div className="mb-2 text-gray-600">{lesson.title}</div>
      <div className="rounded-xl border p-4 bg-white">
        <Markdown md={lesson.md} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={onMarkComplete} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">
          <CheckCircle className="w-4 h-4"/> Mark lesson complete {completed && <span className="text-green-600">(completed)</span>}
        </button>
      </div>
    </div>
  );
}

function SectionNavigator({ section, lessonIndex, onPrev, onNext, onOpenTest }) {
  return (
    <div className="px-6 pb-6 flex items-center gap-2">
      <button onClick={onPrev} className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40" disabled={lessonIndex===0}><ChevronLeft className="w-4 h-4"/></button>
      <div className="text-sm text-gray-600">Lesson {lessonIndex+1} of {section.lessons.length}</div>
      <button onClick={onNext} className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40" disabled={lessonIndex===section.lessons.length-1}><ChevronRight className="w-4 h-4"/></button>
      <div className="ml-auto"/>
      <button onClick={onOpenTest} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"><PlayCircle className="w-4 h-4"/> Take Section Test</button>
    </div>
  );
}

function MCQ({ q, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="font-medium">{q.prompt}</div>
      <div className="mt-2 grid gap-2">
        {q.options.map((opt, i) => (
          <label key={i} className={`flex items-center gap-2 rounded-xl border p-2 cursor-pointer ${value===i?"bg-gray-50 border-gray-400":""}`}>
            <input type="radio" className="accent-black" checked={value===i} onChange={() => onChange(i)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ShortAnswer({ q, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="font-medium">{q.prompt}</div>
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border p-3 min-h-[120px]" placeholder="Write 4–6 sentences…"/>
      <div className="text-xs text-gray-500 mt-1">Rubric: {q.rubric?.criteria?.join("; ")}</div>
    </div>
  );
}

function SectionTest({ section, settings, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (qid, val) => setAnswers(a=>({ ...a, [qid]: val }));

  const grade = async () => {
    setSubmitting(true);
    let points = 0; let max = 0; const feedback = {};
    for (const q of section.test.questions) {
      max += q.maxScore;
      if (q.type === "mcq") {
        const correct = (answers[q.id]===q.answer);
        points += correct ? q.maxScore : 0;
        feedback[q.id] = correct ? "Correct" : "Check the definition/mechanism and try again.";
      } else {
        const res = await openAIGrade({ prompt: q.prompt, answer: answers[q.id] || "", rubric: { criteria: q.rubric?.criteria || [], maxScore: q.maxScore }, apiKey: settings.apiKey });
        points += res.score; feedback[q.id] = res.feedback;
      }
    }
    const percent = Math.round((points / max) * 100);
    setSubmitting(false);
    onSubmit({ percent, feedback });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">{section.title} — Section Test</h2>
        <Pill>5 questions • 70% to pass</Pill>
      </div>
      <div className="rounded-xl border bg-white p-4">
        {section.test.questions.map((q) => (
          <div key={q.id} className="mb-6">
            {q.type === "mcq" ? (
              <MCQ q={q} value={answers[q.id]} onChange={v=>handleChange(q.id, v)} />
            ) : (
              <ShortAnswer q={q} value={answers[q.id]} onChange={v=>handleChange(q.id, v)} />
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Cancel</button>
          <button onClick={grade} disabled={submitting} className="rounded-xl border px-4 py-2 hover:bg-gray-50 inline-flex items-center gap-2">
            {submitting ? <RefreshCcw className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4"/>} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ sections, progress }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Progress Dashboard</h2>
        <Pill><Award className="w-3 h-3 mr-1"/> Passing score ≥ 70%</Pill>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s) => {
          const best = progress.sectionScores[s.id]?.best ?? 0;
          const completedLessons = s.lessons.filter(L => progress.lessonsCompleted[`${s.id}_${L.id}`]).length;
          const percentLessons = Math.round((completedLessons / s.lessons.length) * 100);
          return (
            <div key={s.id} className="rounded-xl border p-4 bg-white">
              <div className="font-semibold mb-1">{s.title}</div>
              <div className="text-sm text-gray-600 mb-2">Lessons: {completedLessons}/{s.lessons.length} ({percentLessons}%)</div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-black" style={{ width: `${percentLessons}%`}}/></div>
              <div className="text-sm">Best test score: <span className={`font-medium ${best>=70?"text-green-600":"text-gray-800"}`}>{best}%</span></div>
            </div>
          );
        })}
        <div className="rounded-xl border p-4 bg-white">
          <div className="font-semibold mb-1">Master Final Exam</div>
          <div className="text-sm text-gray-600 mb-2">Best score: {progress.exam.best}% · Attempts: {progress.exam.attempts}</div>
        </div>
      </div>
    </div>
  );
}

function FinalExam({ settings, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const handleChange = (id, val) => setAnswers(a=>({ ...a, [id]: val }));

  const grade = async () => {
    setLoading(true);
    let points = 0; let max = 0; const perQuestion = {};
    for (const q of finalExam.questions) {
      max += q.maxScore;
      if (q.type === "mcq") { const ok = (answers[q.id]===q.answer); points += ok? q.maxScore:0; perQuestion[q.id] = ok? q.maxScore:0; }
      else { const res = await openAIGrade({ prompt: q.prompt, answer: answers[q.id] || "", rubric: { criteria: q.rubric?.criteria || [], maxScore: q.maxScore }, apiKey: settings.apiKey }); points += res.score; perQuestion[q.id] = res.score; }
    }
    const percent = Math.round((points / max) * 100);
    setLoading(false);
    // Recommendations: map weak areas back to sections by simple tags
    const recs = generateRecommendations({ perQuestion, percent });
    onSubmit({ percent, perQuestion, recommendations: recs });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Master Final Exam</h2>
        <Pill>12 questions • Comprehensive</Pill>
      </div>
      <div className="rounded-xl border bg-white p-4">
        {finalExam.questions.map((q) => (
          <div key={q.id} className="mb-6">
            {q.type === "mcq" ? (
              <MCQ q={q} value={answers[q.id]} onChange={v=>handleChange(q.id, v)} />
            ) : (
              <ShortAnswer q={q} value={answers[q.id]} onChange={v=>handleChange(q.id, v)} />
            )}
          </div>
        ))}
        <button onClick={grade} disabled={loading} className="rounded-xl border px-4 py-2 hover:bg-gray-50 inline-flex items-center gap-2">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-4 h-4"/>} Submit Exam
        </button>
      </div>
    </div>
  );
}

function generateRecommendations({ perQuestion, percent }) {
  // Map exam questions to sections (simple mapping by index ranges)
  const map = {
    foundations: ["E2"],
    "micro-markets": ["E1", "E7"],
    "micro-failure": ["E6", "E12", "E4"],
    macro: ["E2", "E10"],
    global: ["E3", "E11"],
    development: ["E5", "E8"],
  };
  const scoresBySection = {};
  for (const [sec, ids] of Object.entries(map)) {
    const got = ids.reduce((s,id)=> s + (perQuestion[id] || 0), 0);
    const max = ids.reduce((s,id)=> s + (finalExam.questions.find(q=>q.id===id)?.maxScore || 0), 0);
    scoresBySection[sec] = max>0? Math.round((got/max)*100): 100;
  }
  const weak = Object.entries(scoresBySection).filter(([,v])=> v<70).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k,v])=>({ sectionId:k, score:v }));
  return { overall: percent, weakSections: weak };
}

function Settings({ settings, onChange }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [name, setName] = useState(settings.name || "");
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-3">Settings</h2>
      <div className="rounded-xl border bg-white p-4 flex flex-col gap-3 max-w-xl">
        <label className="text-sm">Display name
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-2" placeholder="Your name"/>
        </label>
        <label className="text-sm">OpenAI API Key (optional)
          <input value={apiKey} onChange={e=>setApiKey(e.target.value)} className="mt-1 w-full rounded-xl border p-2" placeholder="sk-..."/>
          <div className="text-xs text-gray-500 mt-1">Used for enhanced grading and the AI assistant. If empty, a local heuristic is used.</div>
        </label>
        <div className="flex items-center gap-2">
          <button onClick={()=>onChange({ apiKey, name })} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Save</button>
        </div>
      </div>
    </div>
  );
}

function ChatDock({ open, onToggle, context, settings }) {
  const [messages, setMessages] = useState([{ role:"system", content:"Hi! Ask me about this lesson or test. I’ll guide you." }]);
  const [input, setInput] = useState("");
  const boxRef = useRef(null);
  useEffect(()=>{ if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [messages, open]);
  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages(m => [...m, { role:"user", content: question }]);
    setInput("");
    const reply = await assistantReply({ apiKey: settings.apiKey, context, question });
    setMessages(m => [...m, { role:"assistant", content: reply }]);
  };
  return (
    <div className={`fixed right-4 bottom-4 z-30 ${open?"":""}`}>
      {open && (
        <div className="w-[360px] h-[460px] rounded-2xl border bg-white shadow-xl flex flex-col">
          <div className="p-3 border-b flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Tutor</div>
          <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-2">
            {messages.map((m,i)=> (
              <div key={i} className={`rounded-xl p-2 ${m.role==='user'?"bg-black text-white ml-10":"bg-gray-100 mr-10"}`}>{m.content}</div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 rounded-xl border px-3 py-2" placeholder="Ask for a hint…"/>
            <button onClick={send} className="rounded-xl border px-3 py-2 hover:bg-gray-50">Send</button>
          </div>
        </div>
      )}
      <button onClick={onToggle} className="mt-2 w-[360px] rounded-2xl border bg-white px-4 py-2 shadow inline-flex items-center gap-2"><MessageSquare className="w-4 h-4"/>{open?"Hide Tutor":"Ask the Tutor"}</button>
    </div>
  );
}

// ----------------------------- Root App -----------------------------
export default function IbEconTutor() {
  const [progress, setProgress] = useState(loadLS(LS_KEY, defaultProgress));
  const [settings, setSettings] = useState(loadLS(LS_SETTINGS_KEY, { apiKey: "", name: "" }));

  const [view, setView] = useState({ mode: "home" /* home|section|test|exam|dashboard|settings */, sectionIndex: 0, lessonIndex: 0 });
  const [tutorOpen, setTutorOpen] = useState(true);

  useEffect(()=> saveLS(LS_KEY, progress), [progress]);
  useEffect(()=> saveLS(LS_SETTINGS_KEY, settings), [settings]);

  const currentSection = curriculum[view.sectionIndex];
  const currentLesson = currentSection?.lessons?.[view.lessonIndex];

  const markLessonComplete = () => {
    const key = `${currentSection.id}_${currentLesson.id}`;
    setProgress(p => ({ ...p, lessonsCompleted: { ...p.lessonsCompleted, [key]: true } }));
  };

  const onSectionTestSubmit = ({ percent, feedback }) => {
    setProgress(p => ({
      ...p,
      sectionScores: {
        ...p.sectionScores,
        [currentSection.id]: {
          attempts: (p.sectionScores[currentSection.id]?.attempts || 0) + 1,
          best: Math.max(p.sectionScores[currentSection.id]?.best || 0, percent)
        }
      }
    }));
    setView(v=>({ ...v, mode: "section", }));
    alert(`Section score: ${percent}%. ${percent>=70?"Pass":"Below 70% (you can retake)"}`);
    console.log("Feedback:", feedback);
  };

  const onFinalExamSubmit = ({ percent, perQuestion, recommendations }) => {
    setProgress(p => ({
      ...p, exam: { attempts: p.exam.attempts + 1, best: Math.max(p.exam.best, percent) }
    }));
    setView(v=>({ ...v, mode: "dashboard" }));
    const weakList = recommendations.weakSections.map(w=> `${titleForSectionId(w.sectionId)} (${w.score}%)`).join(", ");
    alert(`Final exam: ${percent}%. Weak areas: ${weakList || "None"}. Check dashboard for details.`);
    console.log({ perQuestion, recommendations });
  };

  const contextForTutor = useMemo(() => {
    if (view.mode === "section") {
      return `${currentSection.title} → ${currentLesson.title}\nKey points: ${currentLesson.md.substring(0, 800)}…`;
    } else if (view.mode === "test") {
      return `${currentSection.title} test (5 Qs). Topics: ${currentSection.lessons.map(l=>l.title).join(", ")}.`;
    } else if (view.mode === "exam") {
      return `Master Final Exam across Foundations, Micro (markets/failure), Macro, Global, Development.`;
    }
    return `Course overview: ${curriculum.length} sections`;
  }, [view, currentSection, currentLesson]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <Header
        onOpenHome={()=>setView({ mode:"home", sectionIndex: 0, lessonIndex: 0 })}
        onNav={()=>setView(v=>({ ...v, mode: "section" }))}
        onOpenDashboard={()=>setView(v=>({ ...v, mode: "dashboard" }))}
        onOpenExam={()=>setView(v=>({ ...v, mode: "exam" }))}
        onOpenSettings={()=>setView(v=>({ ...v, mode: "settings" }))}
      />

      <div className="mx-auto max-w-6xl grid md:grid-cols-[16rem_1fr]">
        <Sidebar
          sections={curriculum}
          current={view.sectionIndex}
          onSelect={(i)=>setView({ mode: "section", sectionIndex: i, lessonIndex: 0 })}
          progress={progress}
        />

        <main>
          {view.mode === "home" && (
            <div className="p-8">
              <h1 className="text-3xl font-semibold mb-2">Welcome{settings.name?`, ${settings.name}`:""}!</h1>
              <p className="text-gray-600 mb-6">A focused IB Economics course with short lessons, end-of-section tests, a master exam, and an always-on tutor. Your progress saves automatically.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {curriculum.map((s, idx)=> (
                  <div key={s.id} className="rounded-2xl border bg-white p-5">
                    <div className="font-semibold mb-1">{s.title}</div>
                    <div className="text-sm text-gray-600 mb-3">{s.lessons.length} lessons · 1 test</div>
                    <button onClick={()=>setView({ mode: "section", sectionIndex: idx, lessonIndex: 0 })} className="rounded-xl border px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2">
                      Start <ChevronRight className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view.mode === "section" && (
            <>
              <LessonView
                section={currentSection}
                lesson={currentLesson}
                completed={progress.lessonsCompleted[`${currentSection.id}_${currentLesson.id}`]}
                onMarkComplete={markLessonComplete}
              />
              <SectionNavigator
                section={currentSection}
                lessonIndex={view.lessonIndex}
                onPrev={()=> setView(v=>({ ...v, lessonIndex: Math.max(0, v.lessonIndex-1) }))}
                onNext={()=> setView(v=>({ ...v, lessonIndex: Math.min(currentSection.lessons.length-1, v.lessonIndex+1) }))}
                onOpenTest={()=> setView(v=>({ ...v, mode: "test" }))}
              />
            </>
          )}

          {view.mode === "test" && (
            <SectionTest
              section={currentSection}
              settings={settings}
              onSubmit={onSectionTestSubmit}
              onCancel={()=> setView(v=>({ ...v, mode: "section" }))}
            />
          )}

          {view.mode === "dashboard" && (
            <Dashboard sections={curriculum} progress={progress} />
          )}

          {view.mode === "exam" && (
            <FinalExam settings={settings} onSubmit={onFinalExamSubmit} />
          )}

          {view.mode === "settings" && (
            <Settings settings={settings} onChange={(s)=> setSettings(s)} />
          )}
        </main>
      </div>

      <ChatDock open={tutorOpen} onToggle={()=>setTutorOpen(o=>!o)} context={contextForTutor} settings={settings} />

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">
        <div className="flex items-center gap-2"><Award className="w-4 h-4"/> Tests require 70% to pass · Retake anytime for fresh feedback</div>
      </footer>
    </div>
  );
}

function titleForSectionId(id){ return (curriculum.find(s=>s.id===id)?.title) || id; }
