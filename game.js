/**
 * Renewal Quest: The End-to-End Challenge — Meridian / NetEdge renewal simulation.
 */
(() => {
  const GAME_TITLE = "Renewal Quest: The End-to-End Challenge";
  const INITIAL_DAYS = 60;
  const WRONG_DAY_COST = 5;
  const BONUS_DAYS_STAGE3 = 3;
  /** Calendar window for 60-day countdown copy (July 15 minus 60 days = May 17). */
  const CLOSE_DEADLINE_LABEL = "July 15";
  const COUNTDOWN_START_LABEL = "May 17";

  const DEAL = {
    customer: "Meridian Health Systems",
    partner: "NetEdge Solutions",
    contract: "92847-MHS-661",
    atr: "$74,200",
    expiry: CLOSE_DEADLINE_LABEL,
    quote: "CCW-7821-MHS",
    quoteAuthor: "Raj Patel",
    quoteDate: "May 28",
    so: "91-MHS-44821",
    mbrNet: "$54,920",
    listNet: "$74,200",
  };

  /** Gold-standard partner opener (Stage 4 UI) — shown in success + contrasted in wrong-answer reinforcement. */
  const PARTNER_OUTREACH_GOLD =
    `Hi Raj — I'm the Renewal Manager for Meridian Health Systems. They have routing/switching and collaboration services on contract 92847-MHS-661 expiring ${CLOSE_DEADLINE_LABEL}th. I see quote CCW-7821-MHS in the system — are you working off this quote? Has it been sent to the customer? Let me know how I can help move this forward.`;

  /** Canonical MCQ rows (order here = spread of correct answer across A/B/C slots before per-run shuffle). */
  const MCQ_CANON = {
    s0q0: [
      { id: "contract", correct: true, text: "Contract # and note assets / end date" },
      { id: "phone", correct: false, text: "Customer phone + billing address only" },
      { id: "atr_only", correct: false, text: "Total ATR only — the rest lives in Salesforce" },
    ],
    s0q1: [
      { id: "all_four", correct: false, text: "All four — they’re all for the same customer" },
      { id: "three_lines", correct: true, text: "Only the first three — Catalyst 9200s expire in November (Q2 FY27), so they belong on a different opportunity" },
      { id: "webex_wrong", correct: false, text: "Only the Catalyst 9300 and ISR lines — Webex is software, not services" },
    ],
    s1q0: [
      { id: "opp1", correct: false, text: "#1 — Recent closed deal, good reference" },
      { id: "opp3", correct: false, text: "#3 — Next quarter so it must be the upcoming one" },
      { id: "opp2", correct: true, text: "#2 — Q4 FY26, $74,200 matches ATR, Stage 1" },
    ],
    s1q1: [
      { id: "flag_lead", correct: true, text: "Flag this to your team lead — the partner should already be populated and something may need correction" },
      { id: "ignore_partner", correct: false, text: "Ignore it — the partner will get added automatically when the quote is attached" },
      { id: "wrong_partner", correct: false, text: "Add any partner yourself — it doesn’t matter who’s listed" },
    ],
    s2: [
      { id: "ignore_flag", correct: false, text: "Ignore the flag — push for the PO" },
      { id: "train_cs", correct: true, text: "Share training / ATX paths, escalate BE if needed, loop CS; Sales can pitch Advisory" },
      { id: "exec_lock", correct: false, text: "Immediate senior-leadership Strategic De-Risk interlock" },
    ],
    s2interlock: [
      { id: "operational", correct: false, text: "Operational — Monthly extended account team planning session" },
      { id: "none_needed", correct: false, text: "No interlock needed — it’s 18 months away, there’s plenty of time" },
      {
        id: "strategic",
        correct: true,
        text: "Strategic — Quarterly account selection interlock with senior leadership (Sales Directors, CS Leader, Renewals Director)",
      },
    ],
    s3o: [
      {
        id: "gold_opener",
        correct: true,
        text: "Intro + customer + contract + expiry + assets + quote # — ask if active and customer-facing",
      },
      { id: "thin_opener", correct: false, text: "“Hi Raj — what’s the status on Meridian?”" },
      { id: "po_pressure", correct: false, text: "“Please send the PO ASAP — expires in July.”" },
    ],
    s4p: [
      { id: "notes_path", correct: false, text: "Notes — drop a discount request note" },
      { id: "quote_tab", correct: true, text: "Quote tab → Create Quote → pick the integrated CCWR quote" },
      { id: "activity_only", correct: false, text: "Activity — log a discount call only" },
    ],
    s4x: [
      { id: "wait_overnight", correct: false, text: "Wait overnight with no follow-up" },
      { id: "support_ticket", correct: false, text: "Open a generic support ticket first" },
      { id: "ping_finance", correct: true, text: "Ping Finance with Deal ID; gentle nudge if queue stalls ~30 min" },
    ],
    s5a: [
      { id: "fran", correct: true, text: "Fran (Webex) — subscribe to quote alerts for CCW-7821-MHS" },
      { id: "wait_poll", correct: false, text: "Wait until the 14th and poll CCWR manually" },
      { id: "email_daily", correct: false, text: "Email Raj daily for the PO" },
    ],
    s5b: [
      { id: "celebrate", correct: false, text: "Celebrate! “Order Booked” means it’s done!" },
      {
        id: "wait_convert",
        correct: true,
        text: "Wait — it can take 30 min to 2+ hours for conversion (longer at quarter-end). Monitor. If no movement in ~24 hours, investigate.",
      },
      { id: "ticket_now", correct: false, text: "Immediately open a support ticket — something is wrong" },
    ],
    s6a: [
      { id: "ask_raj", correct: false, text: "Ask Raj for the SO each time" },
      { id: "assume_sf", correct: false, text: "Assume Salesforce auto-filled it — never verify" },
      { id: "ccwr_so", correct: true, text: "CCWR quote → order details → copy SO" },
    ],
    s6b: [
      { id: "yes_mbr", correct: true, text: "Yes — partner, customer, and amount line up" },
      { id: "no_mbr", correct: false, text: "No — amount is wildly off; escalate" },
    ],
  };

  const MCQ_KEYS_BY_STAGE = [
    ["s0q0", "s0q1"],
    ["s1q0", "s1q1"],
    ["s2", "s2interlock"],
    ["s3o"],
    ["s4p", "s4x"],
    ["s5a", "s5b"],
    ["s6a", "s6b"],
  ];

  const STRIP_KEYS = [
    { id: "contract", label: "Contract" },
    { id: "opp", label: "Opp" },
    { id: "risk", label: "Risk" },
    { id: "quote", label: "Quote" },
    { id: "dsa", label: "DSA" },
    { id: "track", label: "Track" },
    { id: "close", label: "Close" },
  ];

  const QUEST_LABELS = [
    "Verify ATR (Cisco Ready)",
    "Verify opportunity (Salesforce)",
    "Assess risk (De-Risk)",
    "Partner outreach",
    "DSA & discount",
    "Track PO (Fran / CCWR)",
    "Verify & close",
  ];

  const state = {
    stageIndex: 0,
    /** Highest stage index (0–6) the player has reached via Continue; blocks opening later stages from the quest log. */
    maxReachedStageIndex: 0,
    daysLeft: INITIAL_DAYS,
    daysOnStageEnter: INITIAL_DAYS,
    timerId: null,
    runStart: Date.now(),
    achievements: new Set(),
    stageLedger: QUEST_LABELS.map(() => ({ wrong: 0, bonus: false })),
    gameOver: false,
    won: false,
    /** Per-run shuffled MCQ rows: key → array with .letter A/B/C assigned. */
    shuffledChoices: {},
    /** 'play' = stage content; 'exit' = completion summary (after win). */
    activeView: "play",
    s0: { substep: 0, choice: null, choice2: null, done: false },
    s1: { substep: 0, choice: null, choice2: null, done: false },
    s2: {
      choice: null,
      bonusTaken: false,
      postBonus: false,
      done: false,
      interlockChoice: null,
      interlockDone: false,
    },
    s3: { substep: 0, choice: null, order: null, sequenceDone: false, done: false },
    s4: { choiceA: null, substep: 0, dsaFields: {}, dsaDone: false, bonusChoice: null, bonusDone: false, done: false },
    s5: { choiceA: null, choiceB: null, substep: 0, statusPick: {}, done: false },
    s6: { choiceA: null, choiceB: null, substep: 0, order: null, orderDone: false, done: false },
  };

  const els = {
    hudDays: document.getElementById("hudDays"),
    hudTimer: document.getElementById("hudTimer"),
    hudQuote: document.getElementById("hudQuote"),
    dayMeterFill: document.getElementById("dayMeterFill"),
    dealStrip: document.getElementById("dealStrip"),
    workflowList: document.getElementById("workflowList"),
    stageEyebrow: document.getElementById("stageEyebrow"),
    stageBadge: document.getElementById("stageBadge"),
    stageTitle: document.getElementById("stageTitle"),
    stageLede: document.getElementById("stageLede"),
    missionObjective: document.getElementById("missionObjective"),
    stageBody: document.getElementById("stageBody"),
    feedback: document.getElementById("feedback"),
    btnContinue: document.getElementById("btnContinue"),
    btnHint: document.getElementById("btnHint"),
    btnRestart: document.getElementById("btnRestartStage"),
    btnSubmit: document.getElementById("btnSubmitAnswer"),
    toastHost: document.getElementById("toastHost"),
    confettiRoot: document.getElementById("confettiRoot"),
    modalMenu: document.getElementById("modalMenu"),
    btnMenu: document.getElementById("btnMenu"),
    menuClose: document.getElementById("menuClose"),
    menuRestart: document.getElementById("menuRestart"),
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    els.toastHost.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  function setFeedback(html, kind) {
    els.feedback.classList.remove("ok", "bad", "warn");
    if (kind) els.feedback.classList.add(kind);
    els.feedback.innerHTML = html;
  }

  function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.runStart = Date.now();
    state.timerId = setInterval(() => {
      els.hudTimer.textContent = formatDuration(Date.now() - state.runStart);
    }, 1000);
  }

  function updateHudDays() {
    els.hudDays.textContent = String(state.daysLeft);
    const pct = Math.max(0, Math.min(100, (state.daysLeft / INITIAL_DAYS) * 100));
    if (els.dayMeterFill) els.dayMeterFill.style.width = `${pct}%`;
  }

  function applyWrong() {
    state.stageLedger[state.stageIndex].wrong += 1;
    state.daysLeft = Math.max(0, state.daysLeft - WRONG_DAY_COST);
    updateHudDays();
    if (state.daysLeft <= 0) {
      state.gameOver = true;
      renderGameOver();
    }
  }

  function applyBonus() {
    state.daysLeft = Math.min(INITIAL_DAYS, state.daysLeft + BONUS_DAYS_STAGE3);
    state.stageLedger[2].bonus = true;
    updateHudDays();
    toast(`+${BONUS_DAYS_STAGE3} days banked`);
  }

  function isStageDone(i) {
    switch (i) {
      case 0:
        return state.s0.done;
      case 1:
        return state.s1.done;
      case 2:
        return state.s2.done && state.s2.postBonus && state.s2.interlockDone;
      case 3:
        return state.s3.done && state.s3.sequenceDone;
      case 4:
        return state.s4.done;
      case 5:
        return state.s5.done;
      case 6:
        return state.s6.done;
      default:
        return false;
    }
  }

  function renderDealStrip() {
    const cur = state.activeView === "play" ? Math.min(state.stageIndex, STRIP_KEYS.length - 1) : -1;
    els.dealStrip.innerHTML = STRIP_KEYS.map((k, i) => {
      const done = isStageDone(i);
      const here = state.activeView === "play" && i === cur && !state.gameOver;
      let cls = "deal-strip__item";
      if (done) cls += " deal-strip__item--done";
      if (here) cls += " deal-strip__item--here";
      const mark = done ? "✓" : "○";
      return `<span class="${cls}" role="listitem">${mark} ${escapeHtml(k.label)}</span>`;
    }).join("");
  }

  function renderQuestLog() {
    const stageLis = QUEST_LABELS.map((label, i) => {
      const completed = isStageDone(i);
      const current = state.activeView === "play" && i === state.stageIndex && !state.gameOver;
      const unlocked = i <= state.maxReachedStageIndex;
      const navigable = !state.gameOver && unlocked;
      let cls = "rq-wf-item";
      if (navigable) cls += " rq-wf-item--nav";
      else if (!state.gameOver && !unlocked) cls += " rq-wf-item--locked";
      if (completed) cls += " rq-wf-item--done";
      if (current) cls += " rq-wf-item--current";
      const num = i + 1;
      const mark = completed ? "✓" : current ? "→" : String(num);
      const roleAttr = navigable ? ` role="button" tabindex="0"` : ` tabindex="-1"`;
      const lockHint = unlocked ? "" : " (locked until you reach this stage)";
      return `<li class="${cls}" data-stage-nav="${i}"${roleAttr} aria-label="Go to stage ${num}: ${escapeHtml(label)}${lockHint}"><span class="rq-wf-num" aria-hidden="true">${mark}</span><span>${escapeHtml(label)}</span></li>`;
    }).join("");
    const exitLi =
      state.won && !state.gameOver
        ? `<li class="rq-wf-item rq-wf-item--nav rq-wf-item--exit${
            state.activeView === "exit" ? " rq-wf-item--current" : ""
          }" data-exit-nav="1" role="button" tabindex="0" aria-label="View completion summary and exit">
        <span class="rq-wf-num" aria-hidden="true">${state.activeView === "exit" ? "→" : "★"}</span>
        <span>Exit — completion</span>
      </li>`
        : "";
    els.workflowList.innerHTML = stageLis + exitLi;
  }

  function burstConfetti() {
    const colors = ["#82CF5F", "#06BEEF", "#00BCF5", "#fbbd23", "#6B32CA"];
    const root = els.confettiRoot;
    root.innerHTML = "";
    for (let i = 0; i < 48; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
      root.appendChild(p);
    }
    setTimeout(() => {
      root.innerHTML = "";
    }, 3000);
  }

  function scenarioCard(scenarioHtml, taskText) {
    return `<div class="scenario-card">${scenarioHtml}<p class="task-line">${escapeHtml(taskText)}</p></div>`;
  }

  function choiceGrid(choices, pickedId, gridDisabled = false) {
    const dis = state.gameOver || gridDisabled ? " disabled" : "";
    return `<div class="choice-grid">
      ${choices
        .map((c) => {
          let cls = "choice-btn";
          if (pickedId === c.id) cls += c.correct ? " choice-btn--picked-ok" : " choice-btn--picked-bad";
          return `<button type="button" class="${cls}" data-choice="${escapeHtml(c.id)}"${dis}>
            <span class="choice-btn__label">${escapeHtml(c.letter)})</span>${escapeHtml(c.text)}
          </button>`;
        })
        .join("")}
    </div>`;
  }

  function wireChoices(root, handler) {
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => handler(btn.dataset.choice));
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const DISPLAY_LETTERS = ["A", "B", "C", "D"];
  /** Stable per run (and per stage restart): shuffled order + display letters for one MCQ key. */
  function getShuffledMcq(cacheKey, rows) {
    if (!state.shuffledChoices[cacheKey]) {
      const copy = shuffle(rows.map((r) => ({ ...r })));
      copy.forEach((r, i) => {
        r.letter = DISPLAY_LETTERS[i];
      });
      state.shuffledChoices[cacheKey] = copy;
    }
    return state.shuffledChoices[cacheKey];
  }

  function clearMcqKeysForStage(stageIndex) {
    const keys = MCQ_KEYS_BY_STAGE[stageIndex];
    if (!keys) return;
    keys.forEach((k) => {
      delete state.shuffledChoices[k];
    });
  }

  function isChoiceCorrect(choices, id) {
    const row = choices.find((c) => c.id === id);
    return !!(row && row.correct);
  }

  /* ---------- Stage renders ---------- */

  function renderStage0(root) {
    if (state.s0.substep === 0) {
      const sc = `<p>IB report: <strong>${escapeHtml(DEAL.customer)}</strong> — services ATR <strong>${escapeHtml(DEAL.atr)}</strong> (Catalyst 9300, ISR 4000, Webex). Contract ends <strong>${escapeHtml(DEAL.expiry)}</strong>.</p>`;
      const task = "Click the option that best answers: before you open Salesforce, what do you grab from the IB report?";
      const choices = getShuffledMcq("s0q0", MCQ_CANON.s0q0);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s0.choice);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s0.substep !== 0) return;
        const ok = isChoiceCorrect(choices, id);
        state.s0.choice = id;
        if (ok) {
          setFeedback("<strong>Nice.</strong> You’ve got the contract anchor and context before CRM.", "ok");
          state.s0.substep = 1;
          els.btnContinue.disabled = true;
        } else {
          applyWrong();
          const msg =
            id === "phone"
              ? "<strong>Not quite.</strong> Phone and billing alone don’t anchor the renewal in contract #, assets, or end date — you’ll search blind in CRM."
              : "<strong>Not quite.</strong> ATR alone skips the contract line and dates you need to match the right opportunity and quarter.";
          setFeedback(msg, "bad");
          els.btnContinue.disabled = true;
        }
        renderStage0(root);
        refreshContinue();
      });
      if (state.s0.choice === null) {
        setFeedback("Pick the strongest option, then continue to the ATR check.", null);
        els.btnContinue.disabled = true;
      }
      return;
    }
    const recap = `<p class="nudge-line">Contract <span class="mono">${escapeHtml(DEAL.contract)}</span> is your search key — plus dates for quarter checks.</p>`;
    const table = `<div class="ib-atr-wrap"><table class="ib-atr-table"><thead><tr><th>Product</th><th>Annual List Price</th><th>End Date</th></tr></thead><tbody>
      <tr><td>Catalyst 9300 SNET (×12)</td><td>$28,800</td><td>Jul 15</td></tr>
      <tr><td>ISR 4331 SNET (×4)</td><td>$18,400</td><td>Jul 15</td></tr>
      <tr><td>Webex Meeting Suite (×50 users)</td><td>$22,000</td><td>Jul 15</td></tr>
      <tr><td>Catalyst 9200 SNET (×3)</td><td>$5,000</td><td>Nov 22</td></tr>
    </tbody></table></div>`;
    const sc2 = `${recap}<p><strong>Scenario:</strong> Your IB report shows the line items above for ${escapeHtml(DEAL.customer)}.</p>${table}`;
    const task2 =
      `Which line items belong on your renewal opportunity (Q4 FY26, expiring ${CLOSE_DEADLINE_LABEL} — same quarter as this Meridian run)?`;
    const choices2 = getShuffledMcq("s0q1", MCQ_CANON.s0q1);
    root.innerHTML =
      scenarioCard(sc2, task2) +
      choiceGrid(choices2, state.s0.choice2) +
      (state.s0.done
        ? `<p class="nudge-line">Total Q4 ATR on this opp: <strong>$69,200</strong> (${CLOSE_DEADLINE_LABEL} lines). Full opportunity ~$74,200 includes partner services margin. Webex here is services/support — match by <strong>end date</strong> to the right fiscal quarter.</p>`
        : "");
    wireChoices(root, (id) => {
      if (state.gameOver) return;
      if (state.s0.substep !== 1) return;
      if (state.s0.done && id === state.s0.choice2) return;
      const wasDone = state.s0.done;
      state.s0.choice2 = id;
      if (isChoiceCorrect(choices2, id)) {
        setFeedback(
          `<strong>Correct.</strong> Only ${CLOSE_DEADLINE_LABEL} expiries roll into this Q4 FY26 renewal; November Catalyst 9200s sit on a future-quarter opportunity.`,
          "ok"
        );
        state.s0.done = true;
        els.btnContinue.disabled = false;
      } else {
        if (wasDone) state.s0.done = false;
        applyWrong();
        const msg =
          id === "all_four"
            ? "<strong>Not quite.</strong> Same customer doesn’t mean same renewal window — split by contract end date and fiscal quarter."
            : "<strong>Not quite.</strong> Webex Meeting Suite on this IB is a services contract (support), not a separate software-only exclusion here.";
        setFeedback(msg, "bad");
        els.btnContinue.disabled = true;
      }
      renderStage0(root);
      refreshContinue();
    });
    if (!state.s0.done && state.s0.choice2 === null) {
      setFeedback("Match end dates to the opportunity quarter — then <strong>Continue</strong> when correct.", null);
      els.btnContinue.disabled = true;
    }
  }

  function renderStage1(root) {
    if (state.s1.substep === 0) {
      const sc = `<p>You searched <span class="mono">${escapeHtml(DEAL.contract)}</span> in Salesforce. Four opportunities returned.</p><ul style="margin:8px 0;padding-left:1.2rem;color:var(--muted);font-size:0.88rem"><li>#1 Meridian Health — Q2 FY26 — $12,400 — Stage 6 (Closed Won)</li><li>#2 Meridian Health — Q4 FY26 — $74,200 — Stage 1</li><li>#3 Meridian Clinics LLC — Q1 FY27 — $8,900 — Stage 1</li><li>#4 Meridian Health — Q3 FY26 — $61,000 — Stage 6 (Closed Won)</li></ul>`;
      const task = "Click the opportunity that matches your IB brief (customer, quarter, ATR, active stage).";
      const choices = getShuffledMcq("s1q0", MCQ_CANON.s1q0);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s1.choice);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s1.substep !== 0) return;
        state.s1.choice = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback("<strong>Locked in.</strong> Quarter, customer, amount, and stage line up with your IB view.", "ok");
          state.s1.substep = 1;
          els.btnContinue.disabled = true;
        } else {
          applyWrong();
          const msg =
            id === "opp1"
              ? "<strong>Look again.</strong> #1 is already Closed Won — it’s not your open renewal pipeline."
              : "<strong>Look again.</strong> #3 is a different legal entity and amount; “next quarter” isn’t a substitute for matching ATR and customer.";
          setFeedback(msg, "bad");
          els.btnContinue.disabled = true;
        }
        renderStage1(root);
        refreshContinue();
      });
      if (state.s1.choice === null) {
        setFeedback("Choose the opp that matches your brief.", null);
        els.btnContinue.disabled = true;
      }
      return;
    }
    const sc2 = `<p>You open <strong>opportunity #2</strong>. Opportunity details:</p>
      <table class="ib-atr-table"><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
        <tr><td>Customer</td><td>${escapeHtml(DEAL.customer)}</td></tr>
        <tr><td>Partner</td><td><em>[blank]</em></td></tr>
        <tr><td>Quarter</td><td>Q4 FY26</td></tr>
        <tr><td>Expected Services</td><td>$74,200</td></tr>
        <tr><td>Stage</td><td>1</td></tr>
      </tbody></table>
      <p>Your IB report shows the <strong>Services Bill-To Partner</strong> is <strong>${escapeHtml(DEAL.partner)}</strong>.</p>`;
    const task2 = "The partner field is blank. What do you do?";
    const choices2 = getShuffledMcq("s1q1", MCQ_CANON.s1q1);
    root.innerHTML =
      scenarioCard(sc2, task2) +
      choiceGrid(choices2, state.s1.choice2) +
      (state.s1.done
        ? `<p class="nudge-line">Your lead confirms a data-load fix — Partner set to <strong>${escapeHtml(DEAL.partner)}</strong>. Align SFDC to IB before quoting and outreach.</p>`
        : "");
    wireChoices(root, (id) => {
      if (state.gameOver) return;
      if (state.s1.substep !== 1) return;
      if (state.s1.done && id === state.s1.choice2) return;
      const wasDone = state.s1.done;
      state.s1.choice2 = id;
      if (isChoiceCorrect(choices2, id)) {
        setFeedback(
          "<strong>Right.</strong> Partner on the opp should match IB bill-to — fix before you lean on quoting, credit, and joint customer motion.",
          "ok"
        );
        state.s1.done = true;
        els.btnContinue.disabled = false;
      } else {
        if (wasDone) state.s1.done = false;
        applyWrong();
        const msg =
          id === "ignore_partner"
            ? "<strong>Risky assumption.</strong> Don’t count on auto-fill — misaligned partner breaks quoting and who gets looped in."
            : "<strong>Don’t guess.</strong> Random partner assignment poisons forecasting, deal credit, and partner trust.";
        setFeedback(msg, "bad");
        els.btnContinue.disabled = true;
      }
      renderStage1(root);
      refreshContinue();
    });
    if (!state.s1.done && state.s1.choice2 === null) {
      setFeedback("IB bill-to vs Salesforce partner — pick the pro move.", null);
      els.btnContinue.disabled = true;
    }
  }

  function renderStage2(root) {
    const sc = `<p>Lifecycle Dashboard: <strong>Medium</strong> risk — adoption barrier: <em>Additional training required</em> on Catalyst 9300. Deployed 6 months ago; utilization ~31%.</p>`;
    const task = "Per the De-Risk model, what’s the recommended move?";
    const choices = getShuffledMcq("s2", MCQ_CANON.s2);

    if (state.s2.done && state.s2.choice === "train_cs" && !state.s2.postBonus) {
      root.innerHTML =
        scenarioCard(sc, task) +
        `<p class="bonus-banner"><strong>Bonus beat:</strong> You ping CSE + AM about the adoption barrier. CSE schedules ATX next week. Claim the time credit?</p>
        <div class="play-actions" style="margin-top:10px">
          <button type="button" class="btn primary" id="btnBonus3">Notify CSE + AM (+${BONUS_DAYS_STAGE3} days)</button>
        </div>`;
      setFeedback("<strong>Scenario 2 nailed.</strong> Medium risk = enablement + CS loop — not exec theater.", "ok");
      els.btnContinue.disabled = true;
      root.querySelector("#btnBonus3").addEventListener("click", () => {
        if (!state.s2.bonusTaken) {
          applyBonus();
          state.s2.bonusTaken = true;
        }
        state.s2.postBonus = true;
        toast("ATX scheduled — time banked.");
        renderStage2(root);
        refreshContinue();
      });
      return;
    }

    if (state.s2.postBonus && !state.s2.interlockDone) {
      const scG = `<p>Your manager: “We also have a <strong>$1.2M software renewal</strong> for <strong>GlobalTech Industries</strong> — <strong>18 months</strong> out — flagged <strong>HIGH</strong> risk. No valid customer contact on file. The AM hasn’t engaged in over a year.”</p>`;
      const taskG = "What type of De-Risk interlock is appropriate for GlobalTech?";
      const choicesG = getShuffledMcq("s2interlock", MCQ_CANON.s2interlock);
      root.innerHTML = scenarioCard(scG, taskG) + choiceGrid(choicesG, state.s2.interlockChoice);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s2.interlockDone && id === state.s2.interlockChoice) return;
        state.s2.interlockChoice = id;
        if (isChoiceCorrect(choicesG, id)) {
          setFeedback(
            "<strong>Strategic fit.</strong> High value + HIGH risk + critical barrier + 6–24 months out → quarterly senior interlock for account selection — not default ops cadence.",
            "ok"
          );
          state.s2.interlockDone = true;
          els.btnContinue.disabled = false;
        } else {
          applyWrong();
          const msg =
            id === "operational"
              ? "<strong>Sequence matters.</strong> Operational cadence follows strategic selection — this profile needs leadership alignment first."
              : "<strong>Too passive.</strong> De-Risk explicitly targets 6–24 months out on high-risk accounts — calendar distance isn’t a free pass.";
          setFeedback(msg, "bad");
          els.btnContinue.disabled = true;
        }
        renderStage2(root);
        refreshContinue();
      });
      if (!state.s2.interlockDone && state.s2.interlockChoice === null) {
        setFeedback("Size the signal: $, risk tier, horizon, and adoption barriers.", null);
        els.btnContinue.disabled = true;
      }
      return;
    }

    if (state.s2.postBonus && state.s2.interlockDone) {
      root.innerHTML =
        scenarioCard(sc, task) +
        choiceGrid(choices, state.s2.choice, true) +
        `<p class="nudge-line">Meridian: medium-risk enablement path locked. GlobalTech: Strategic interlock selected for high-value / HIGH-risk horizon planning.</p>`;
      setFeedback("<strong>De-Risk beats.</strong> Press <strong>Continue</strong> when ready.", "ok");
      els.btnContinue.disabled = false;
      return;
    }

    root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s2.choice);
    wireChoices(root, (id) => {
      if (state.gameOver) return;
      if (state.s2.done && id === state.s2.choice) return;
      const wasDone = state.s2.done;
      state.s2.choice = id;
      if (isChoiceCorrect(choices, id)) {
        setFeedback("<strong>Good call.</strong> Train + CS + optional AS beats ignoring adoption friction.", "ok");
        state.s2.done = true;
        state.achievements.add("risk_mitigator");
        renderStage2(root);
      } else {
        if (wasDone) {
          state.s2.done = false;
          state.achievements.delete("risk_mitigator");
        }
        applyWrong();
        const msg =
          id === "ignore_flag"
            ? "<strong>Risk still matters on services.</strong> Ignoring the adoption flag invites stall and surprises at signature."
            : "<strong>Too heavy for this signal.</strong> Medium risk calls for enablement + CS — senior Strategic De-Risk interlocks are selective, not default.";
        setFeedback(msg, "bad");
        renderStage2(root);
      }
      refreshContinue();
    });
    if (!state.s2.done && state.s2.choice === null) {
      els.btnContinue.disabled = true;
      setFeedback("Pick the de-risk path that fits <strong>medium</strong> signal.", null);
    } else if (state.s2.done && !state.s2.postBonus) {
      els.btnContinue.disabled = true;
    }
  }

  const S3_SF_ORDER = ["attach", "note", "stage", "save"];
  const S3_SF_LABELS = {
    attach: `Attach quote (Quote tab → Attach by Quote Number → ${DEAL.quote})`,
    note: "Write opportunity note (partner, quote #, status, Webex questions, next steps)",
    stage: "Move Stage from 1 → Stage 3",
    save: "Save the opportunity",
  };

  function renderStage3(root) {
    const goldHtml = escapeHtml(PARTNER_OUTREACH_GOLD);
    const goldBlock = `<figure class="gold-opener"><figcaption class="muted" style="font-size:0.8rem;margin-bottom:6px">Strong opener (use as a template)</figcaption><blockquote class="gold-opener__quote">${goldHtml}</blockquote></figure><p class="nudge-line">Raj: “Yes, that quote — sent last week; Webex lines need clarity.” You move the opp to <strong>Stage 3</strong> after attach → note → stage → save.</p>`;

    if (state.s3.done && state.s3.sequenceDone) {
      root.innerHTML = goldBlock;
      setFeedback("<strong>Salesforce hygiene locked.</strong> Quote linked, progress documented, stage advanced, then saved.", "ok");
      els.btnContinue.disabled = false;
      return;
    }

    if (state.s3.substep === 2) {
      const order = state.s3.order || shuffle([...S3_SF_ORDER]);
      state.s3.order = order;
      root.innerHTML =
        scenarioCard(
          `<p><strong>Raj confirmed engagement.</strong> The quote is out with the customer. Update the opportunity to reflect current status.</p>`,
          "Put the four Salesforce actions in the correct order — drag a row onto another, or use ↑ / ↓. Then press Submit sequence."
        ) +
        `<p class="play-actions" style="margin:10px 0 0"><button type="button" class="btn ghost" id="btnS3ResetOutreach">Redo partner outreach pick</button></p>` +
        `<ol class="step-drag-list" id="s3OrderList">
        ${order
          .map(
            (key, idx) =>
              `<li class="step-drag-item" draggable="true" data-key="${key}" data-idx="${idx}">
            <strong>${idx + 1}.</strong> ${escapeHtml(S3_SF_LABELS[key])}
            <span style="float:right;display:inline-flex;gap:4px">
              <button type="button" class="btn ghost rq-move-s3" data-dir="-1" data-idx="${idx}" style="padding:4px 8px">↑</button>
              <button type="button" class="btn ghost rq-move-s3" data-dir="1" data-idx="${idx}" style="padding:4px 8px">↓</button>
            </span>
          </li>`
          )
          .join("")}
      </ol>
      <button type="button" class="btn primary" id="btnCheckS3Order">Submit sequence</button>`;

      root.querySelector("#btnS3ResetOutreach").addEventListener("click", () => {
        state.s3.substep = 0;
        state.s3.choice = null;
        state.s3.order = null;
        state.s3.sequenceDone = false;
        state.s3.done = false;
        state.achievements.delete("partner_whisperer");
        delete state.shuffledChoices.s3o;
        toast("Outreach choice reset.");
        renderStage3(root);
        refreshContinue();
      });

      function paintS3() {
        const list = root.querySelector("#s3OrderList");
        if (!list) return;
        list.innerHTML = order
          .map(
            (key, idx) =>
              `<li class="step-drag-item" draggable="true" data-key="${key}" data-idx="${idx}">
            <strong>${idx + 1}.</strong> ${escapeHtml(S3_SF_LABELS[key])}
            <span style="float:right;display:inline-flex;gap:4px">
              <button type="button" class="btn ghost rq-move-s3" data-dir="-1" data-idx="${idx}" style="padding:4px 8px">↑</button>
              <button type="button" class="btn ghost rq-move-s3" data-dir="1" data-idx="${idx}" style="padding:4px 8px">↓</button>
            </span>
          </li>`
          )
          .join("");
        wireS3(list);
      }

      function swapS3(i, j) {
        if (j < 0 || j >= order.length) return;
        [order[i], order[j]] = [order[j], order[i]];
        state.s3.order = order;
        paintS3();
      }

      function wireS3(list) {
        let dragKey = null;
        list.querySelectorAll(".step-drag-item").forEach((li) => {
          li.addEventListener("dragstart", (e) => {
            dragKey = li.dataset.key;
            li.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
          });
          li.addEventListener("dragend", () => li.classList.remove("dragging"));
          li.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          });
          li.addEventListener("drop", (e) => {
            e.preventDefault();
            const targetKey = li.dataset.key;
            if (!dragKey || dragKey === targetKey) return;
            const i = order.indexOf(dragKey);
            const j = order.indexOf(targetKey);
            swapS3(i, j);
          });
        });
        list.querySelectorAll(".rq-move-s3").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const idx = Number(btn.dataset.idx);
            const dir = Number(btn.dataset.dir);
            swapS3(idx, idx + dir);
          });
        });
      }

      paintS3();
      wireS3(root.querySelector("#s3OrderList"));

      root.querySelector("#btnCheckS3Order").addEventListener("click", () => {
        const ok = S3_SF_ORDER.every((k, i) => order[i] === k);
        if (ok) {
          state.s3.sequenceDone = true;
          setFeedback("<strong>Sequence correct.</strong> Attach first, document status, advance stage, then save.", "ok");
          renderStage3(root);
          refreshContinue();
        } else {
          applyWrong();
          setFeedback(
            "<strong>Order matters.</strong> Target: <strong>Attach quote → Note → Stage 1→3 → Save</strong> — then Submit sequence again.",
            "bad"
          );
          refreshContinue();
        }
      });

      els.btnSubmit.hidden = true;
      els.btnContinue.disabled = true;
      setFeedback("Reorder the four steps, then <strong>Submit sequence</strong>.", null);
      refreshContinue();
      return;
    }

    if (state.s3.substep === 1) {
      root.innerHTML =
        scenarioCard(
          `<p>Quote <span class="mono">${escapeHtml(DEAL.quote)}</span> is in CCWR (by ${escapeHtml(DEAL.quoteAuthor)}, ${escapeHtml(DEAL.quoteDate)}). You picked the outreach that gives Raj everything he needs in one pass.</p>`,
          "Review the answer below — then continue to the Salesforce sequence activity."
        ) +
        goldBlock +
        `<p class="play-actions" style="margin-top:14px"><button type="button" class="btn primary" id="btnS3ToSequence">Continue to Salesforce sequence</button></p>`;
      root.querySelector("#btnS3ToSequence").addEventListener("click", () => {
        state.s3.substep = 2;
        if (!state.s3.order) state.s3.order = shuffle([...S3_SF_ORDER]);
        renderStage3(root);
        refreshContinue();
      });
      els.btnSubmit.hidden = true;
      els.btnContinue.disabled = true;
      setFeedback(
        "<strong>Partner-ready context.</strong> Role, customer, contract, expiry, services scope, quote in system, and asks — fewer round-trips.",
        "ok"
      );
      refreshContinue();
      return;
    }

    const sc = `<p>Quote <span class="mono">${escapeHtml(DEAL.quote)}</span> is in CCWR (by ${escapeHtml(DEAL.quoteAuthor)}, ${escapeHtml(DEAL.quoteDate)}). You’re drafting first partner touch.</p>`;
    const task = "Click the outreach that opens the cleanest thread with Raj.";
    const choices = getShuffledMcq("s3o", MCQ_CANON.s3o);
    root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s3.choice);
    wireChoices(root, (id) => {
      if (state.gameOver) return;
      if (state.s3.done && id === state.s3.choice) return;
      const wasDone = state.s3.done;
      state.s3.choice = id;
      if (isChoiceCorrect(choices, id)) {
        setFeedback(
          "<strong>Partner-ready context.</strong> Role, customer, contract, expiry, services scope, quote in system, and asks — fewer round-trips.",
          "ok"
        );
        state.achievements.add("partner_whisperer");
        state.s3.done = true;
        state.s3.substep = 1;
        els.btnContinue.disabled = true;
        renderStage3(root);
      } else {
        if (wasDone) {
          state.s3.done = false;
          state.achievements.delete("partner_whisperer");
        }
        applyWrong();
        const contrast = ` Compare a <strong>full</strong> opener: role, <strong>${escapeHtml(DEAL.customer)}</strong>, routing/switching + collaboration scope, contract <span class="mono">${escapeHtml(DEAL.contract)}</span>, expiry <strong>${escapeHtml(DEAL.expiry)}</strong>, quote <span class="mono">${escapeHtml(DEAL.quote)}</span> in system, and crisp asks (working this quote? customer-facing?).`;
        setFeedback(
          (id === "thin_opener"
            ? "<strong>Too thin.</strong> “Status on Meridian?” doesn’t give contract, expiry, assets, or quote anchor — partners juggle dozens of deals."
            : "<strong>Too early / sharp.</strong> PO pressure before confirming the working quote and customer-facing state burns trust.") + contrast,
          "bad"
        );
        els.btnContinue.disabled = true;
        renderStage3(root);
      }
      refreshContinue();
    });
    if (!state.s3.done && state.s3.choice === null) {
      setFeedback("Write like someone who wants a fast, accurate reply.", null);
      els.btnContinue.disabled = true;
    }
  }

  const DSA_CORRECT = {
    justification: "pf",
    validity: "30",
    reason: "sat",
    competitor: "any",
    renewalType: "renewal",
    prevId: "0",
  };

  function dsaFieldFailures(v) {
    const failures = [];
    if (v.justification !== DSA_CORRECT.justification) failures.push("justification (PF / pull-forward)");
    if (v.validity !== DSA_CORRECT.validity) failures.push("validity (30 days / 1 month)");
    if (v.reason !== DSA_CORRECT.reason) failures.push("reason for request (customer satisfaction)");
    if (v.competitor === "" || v.competitor === "skip") failures.push("competitor (pick a listed row, not blank)");
    if (v.renewalType !== DSA_CORRECT.renewalType) failures.push("new vs renewal");
    if (v.prevId !== DSA_CORRECT.prevId) failures.push("previously approved deal ID (0 if none)");
    return failures;
  }

  function renderStage4(root) {
    if (state.s4.substep === 0) {
      const sc = `<p><strong>July 7 — Raj comes back:</strong> “Customer says they’ll sign this week <strong>if</strong> we can get them a better price. They’re comparing against a competitor’s collaboration offering. Can you get me a discount?”</p>
        <p>Standard renewal discount is <strong>23%</strong>. Raj needs <strong>26%</strong> — a <strong>3-point</strong> bump — so the deal pulls forward before ${CLOSE_DEADLINE_LABEL}. That extra 3% is the minimum move that matches “sign this week” without blowing past instant-approval rails on a 1-year renewal.</p>
        <p>You’re documenting the ask properly: a <strong>DSA</strong> from the integrated CCWR quote captures pull-forward (<strong>PF</strong>) and competitive pressure so approvers see a clean story.</p>`;
      const task = "In Salesforce, click the path where you start the DSA.";
      const choices = getShuffledMcq("s4p", MCQ_CANON.s4p);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s4.choiceA);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s4.substep !== 0) return;
        if (state.s4.choiceA === "quote_tab" && id === "quote_tab") return;
        state.s4.choiceA = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback(
            "<strong>Right entry.</strong> DSA starts from the quote workspace — that’s how you document PF plus competitive pressure within policy, not notes-only shadow requests.",
            "ok"
          );
          state.s4.substep = 1;
          els.btnSubmit.hidden = false;
          renderStage4(root);
          refreshContinue();
        } else {
          applyWrong();
          const msg =
            id === "notes_path"
              ? "<strong>Wrong door.</strong> Notes don’t attach structured justification to the CCWR line approvers read."
              : "<strong>Wrong door.</strong> Activity-only doesn’t open the integrated quote path Finance and Deal Desk expect.";
          setFeedback(`${msg} Discounting flows through <strong>Quote → Create Quote</strong> on the attached CCWR line.`, "bad");
          renderStage4(root);
          refreshContinue();
        }
      });
      els.btnContinue.disabled = true;
      els.btnSubmit.hidden = true;
      if (state.s4.choiceA === null) setFeedback("Pick the Salesforce click-path.", null);
      return;
    }
    if (state.s4.substep === 1) {
      const sc = `<p>Justification page — 26% on a 1-year renewal (auto-approves at +3 points). Fill the fields, then <strong>Submit</strong> below.</p>`;
      const f = state.s4.dsaFields;
      root.innerHTML =
        scenarioCard(sc, "Select the combo that matches policy for this PF request.") +
        `<p class="play-actions" style="margin:10px 0 0"><button type="button" class="btn ghost" id="btnS4ChangePath">Change my earlier answer</button></p>` +
        `<form class="dsa-form" id="dsaForm">
          <div><label>Justification comment</label><select name="justification">
            <option value="">Choose…</option>
            <option value="pf">PF (Pull forward)</option>
            <option value="misc">“Please approve”</option>
          </select></div>
          <div><label>Validity period</label><select name="validity">
            <option value="">Choose…</option>
            <option value="30">30 days / 1 month</option>
            <option value="90">12 months open-ended</option>
          </select></div>
          <div><label>Reason for request</label><select name="reason">
            <option value="">Choose…</option>
            <option value="sat">Customer satisfaction</option>
            <option value="none">No reason selected</option>
          </select></div>
          <div><label>Competitor name</label><select name="competitor">
            <option value="">Choose…</option>
            <option value="compA">Listed competitor A (required field)</option>
            <option value="skip">Leave blank</option>
          </select></div>
          <div><label>New service or renewal?</label><select name="renewalType">
            <option value="">Choose…</option>
            <option value="renewal">Renewal</option>
            <option value="new">New service</option>
          </select></div>
          <div><label>Previously approved deal ID</label><select name="prevId">
            <option value="">Choose…</option>
            <option value="0">0 (none)</option>
            <option value="999">999-DRAFT</option>
          </select></div>
        </form>
        <p class="muted" style="font-size:0.85rem">Instant approval applies here — fields still need to be honest and complete.</p>`;
      const form = root.querySelector("#dsaForm");
      ["justification", "validity", "reason", "competitor", "renewalType", "prevId"].forEach((k) => {
        const sel = form.querySelector(`[name="${k}"]`);
        if (!sel) return;
        sel.value = f[k] || "";
        sel.addEventListener("change", () => {
          state.s4.dsaFields[k] = sel.value;
        });
      });
      root.querySelector("#btnS4ChangePath").addEventListener("click", () => {
        state.s4.substep = 0;
        state.s4.choiceA = null;
        state.s4.dsaFields = {};
        els.btnSubmit.hidden = true;
        toast("Salesforce path reset — pick again.");
        renderStage4(root);
        refreshContinue();
      });
      els.btnSubmit.hidden = false;
      els.btnSubmit.textContent = "Qualify & submit DSA";
      if (state.s4.choiceA === "quote_tab") setFeedback("Lock the DSA form fields.", null);
      els.btnContinue.disabled = true;
      return;
    }
    if (state.s4.substep === 2) {
      const sc = `<p><strong>Bonus:</strong> If you had asked for <strong>4 points</strong> (27%) and Finance owned the approval — what’s the pro move?</p>`;
      const choices = getShuffledMcq("s4x", MCQ_CANON.s4x);
      root.innerHTML = scenarioCard(sc, "Pick the best escalation hygiene.") + choiceGrid(choices, state.s4.bonusChoice);
      els.btnSubmit.hidden = true;
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s4.bonusDone && id === state.s4.bonusChoice) return;
        const wasDone = state.s4.bonusDone;
        state.s4.bonusChoice = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback("<strong>Queue-aware.</strong> Finance can clear fast — help them see the Deal ID quickly.", "ok");
          state.s4.bonusDone = true;
          state.s4.done = true;
          state.achievements.add("finance_ping");
          els.btnContinue.disabled = false;
        } else {
          if (wasDone) {
            state.s4.bonusDone = false;
            state.s4.done = false;
            state.achievements.delete("finance_ping");
          }
          applyWrong();
          const msg =
            id === "wait_overnight"
              ? "<strong>Passive isn’t professional.</strong> Finance queues move when owners have Deal IDs and context."
              : "<strong>Wrong channel.</strong> A generic ticket adds noise — route respectfully to the approver with the Deal ID.";
          setFeedback(`${msg} <strong>Best:</strong> ping Finance with the Deal ID; gentle nudge if the queue stalls ~30 minutes.`, "bad");
          els.btnContinue.disabled = true;
        }
        renderStage4(root);
        refreshContinue();
      });
      if (!state.s4.bonusDone && state.s4.bonusChoice === null) {
        setFeedback("One-tap best practice.", null);
        els.btnContinue.disabled = true;
      }
      return;
    }
  }

  const CCWR_STATUS_KEYS = ["in_progress", "submitted", "booked", "conversion", "complete"];
  const CCWR_STATUS_LABELS = {
    in_progress: "Order In Progress",
    submitted: "Order Submitted",
    booked: "Order Booked",
    conversion: "Conversion in Progress",
    complete: "Order Complete",
  };
  const CCWR_STATUS_ANSWER = {
    in_progress: "v",
    submitted: "i",
    booked: "iv",
    conversion: "ii",
    complete: "iii",
  };

  function renderStage5(root) {
    if (state.s5.substep === 0) {
      const sc = `<p>July 10 — Raj: “PO by July 14.” Quote is integrated; DSA is active. You want proactive visibility.</p>`;
      const task = "Click what you do <strong>right now</strong> to track the order (without spamming the partner).";
      const choices = getShuffledMcq("s5a", MCQ_CANON.s5a);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s5.choiceA);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s5.substep !== 0) return;
        if (state.s5.choiceA === "fran" && id === "fran") return;
        state.s5.choiceA = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback("<strong>Fran fan move.</strong> Subscription alerts beat manual refresh or nag mail.", "ok");
          state.achievements.add("fran_fan");
          state.s5.substep = 1;
          renderStage5(root);
          refreshContinue();
        } else {
          applyWrong();
          const msg =
            id === "wait_poll"
              ? "<strong>Too passive.</strong> Waiting until the due date leaves you blind to CCWR state changes."
              : "<strong>Wrong lever.</strong> Daily email nags the partner but doesn’t instrument the quote pipeline.";
          setFeedback(`${msg} <strong>Best:</strong> Fran — subscribe to quote alerts for <span class="mono">${escapeHtml(DEAL.quote)}</span>.`, "bad");
          renderStage5(root);
          refreshContinue();
        }
      });
      els.btnContinue.disabled = true;
      if (state.s5.choiceA === null) setFeedback("Stay ahead of the PO without spamming the partner.", null);
      return;
    }

    if (state.s5.substep === 1) {
      const meaningOpts = [
        { value: "", label: "Choose…" },
        { value: "i", label: "(i) Partner has entered and sent the order into the system" },
        { value: "ii", label: "(ii) Order is being processed and converted on the back end" },
        { value: "iii", label: "(iii) Order is fully fulfilled — should appear in MBR within a couple hours" },
        { value: "iv", label: "(iv) Order has been accepted into the system but is NOT yet complete" },
        { value: "v", label: "(v) The order process has initiated" },
      ];
      const rowsHtml = CCWR_STATUS_KEYS.map((key) => {
        const opts = meaningOpts
          .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
          .join("");
        return `<div class="s5-match-row"><label>${escapeHtml(CCWR_STATUS_LABELS[key])}</label><select id="s5-match-${escapeHtml(key)}" class="s5-match-select">${opts}</select></div>`;
      }).join("");
      root.innerHTML =
        scenarioCard(
          `<p>July 14th: Raj hasn’t responded to your follow-up. Your CCWR Subscription Alerts room lights up:</p><div class="order-log">${escapeHtml(
            "2:47 PM — Order In Progress\n2:53 PM — Order Submitted\n3:01 PM — Order Booked"
          )}</div><p>Silence until 5:30 PM — 2.5 hours since <strong>Order Booked</strong> with no further update.</p>`,
          "Match each CCWR status to its meaning (use the dropdown per row), then press Submit matches."
        ) +
        `<form class="s5-match-form" id="s5MatchForm">${rowsHtml}</form>
        <p class="play-actions" style="margin-top:12px">
          <button type="button" class="btn primary" id="btnS5MatchSubmit">Submit matches</button>
        </p>
        <p class="play-actions" style="margin-top:8px"><button type="button" class="btn ghost" id="btnS5ChangeFirst">Change my earlier answer</button></p>`;
      root.querySelector("#btnS5ChangeFirst").addEventListener("click", () => {
        state.s5.substep = 0;
        state.s5.choiceA = null;
        state.s5.choiceB = null;
        state.achievements.delete("fran_fan");
        toast("Tracking choice reset — pick again.");
        renderStage5(root);
        refreshContinue();
      });
      root.querySelector("#btnS5MatchSubmit").addEventListener("click", () => {
        if (state.gameOver) return;
        let wrong = [];
        CCWR_STATUS_KEYS.forEach((key) => {
          const sel = root.querySelector(`#s5-match-${key}`);
          const v = sel ? sel.value : "";
          if (v !== CCWR_STATUS_ANSWER[key]) wrong.push(CCWR_STATUS_LABELS[key]);
        });
        if (wrong.length === 0) {
          setFeedback("<strong>Status literacy locked.</strong> Next: what to do at 5:30 PM when Booked hasn’t moved.", "ok");
          state.s5.substep = 2;
          renderStage5(root);
          refreshContinue();
        } else {
          applyWrong();
          setFeedback(
            `<strong>Recheck the ladder.</strong> Fix: ${escapeHtml(wrong.join("; "))}.`,
            "bad"
          );
          refreshContinue();
        }
      });
      els.btnContinue.disabled = true;
      setFeedback("Map each status to the right meaning, then <strong>Submit matches</strong>.", null);
      return;
    }

    const log = `2:47 PM — Order In Progress\n2:53 PM — Order Submitted\n3:01 PM — Order Booked\n… silence …\n5:30 PM — still no “Complete”`;
    const sc = `<p>CCWR Subscription Alerts room lights up, then stalls after <strong>Order Booked</strong>.</p><div class="order-log">${escapeHtml(log)}</div>`;
    const task = "What do you do at 5:30 PM with Order Booked but no further movement?";
    const choices = getShuffledMcq("s5b", MCQ_CANON.s5b);
    root.innerHTML =
      scenarioCard(sc, task) +
      `<p class="play-actions" style="margin:10px 0 0"><button type="button" class="btn ghost" id="btnS5ChangeFirst">Change my earlier answer</button></p>` +
      choiceGrid(choices, state.s5.choiceB);
    root.querySelector("#btnS5ChangeFirst").addEventListener("click", () => {
      state.s5.substep = 0;
      state.s5.choiceA = null;
      state.s5.choiceB = null;
      state.achievements.delete("fran_fan");
      toast("Tracking choice reset — pick again.");
      renderStage5(root);
      refreshContinue();
    });
    wireChoices(root, (id) => {
      if (state.gameOver) return;
      if (state.s5.done && id === state.s5.choiceB) return;
      const wasDone = state.s5.done;
      state.s5.choiceB = id;
      if (isChoiceCorrect(choices, id)) {
        setFeedback(
          "<strong>Pipeline literacy.</strong> Booked ≠ Complete — conversion can take hours (longer at quarter-end). Then press <strong>Continue</strong>.",
          "ok"
        );
        state.s5.done = true;
        els.btnContinue.disabled = false;
      } else {
        if (wasDone) state.s5.done = false;
        applyWrong();
        const msg =
          id === "celebrate"
            ? "<strong>Premature win.</strong> Booked is a milestone — you still want Conversion → Complete before you relax."
            : "<strong>Over-rotation.</strong> Support tickets burn goodwill when the happy path is often patience + a clock.";
        setFeedback(`${msg} Expect <strong>Conversion → Complete</strong>; investigate if stuck ~24h.`, "bad");
        els.btnContinue.disabled = true;
      }
      renderStage5(root);
      refreshContinue();
    });
    if (!state.s5.done && state.s5.choiceB === null) {
      els.btnContinue.disabled = true;
      setFeedback("Recall the CCWR happy path after Booked — then <strong>Continue</strong> when correct.", null);
    }
  }

  const CLOSE_ORDER = ["so", "amt", "note", "stage", "save"];
  const CLOSE_LABELS = {
    so: `Enter SO ${DEAL.so} on the opportunity (pencil icon to edit)`,
    amt: "Verify Expected Services amount shows ~$54,900",
    note: "Add final opportunity note (Booked date, SO#, DSA %, Deal ID, PO#, partner)",
    stage: "Change Stage from Stage 3 → Closed Won",
    save: "Click Save",
  };
  /** Shown only via Get hint on Stage 7 reorder substep (state.s6.substep >= 2). */
  const SPOILER_STAGE7_SF_ORDER =
    "Correct order: enter SO → verify Expected Services → add final opportunity note → Stage 3 → Closed Won → Save.";

  function renderStage6(root) {
    if (state.s6.substep === 0) {
      const sc = `<p>Order Complete. You need the SO for MBR, then sanity-check booking, then Salesforce hygiene.</p>`;
      const task = "Click where you grab the SO number first (source of truth before Salesforce).";
      const choices = getShuffledMcq("s6a", MCQ_CANON.s6a);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s6.choiceA);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s6.substep !== 0) return;
        if (state.s6.choiceA === "ccwr_so" && id === "ccwr_so") return;
        state.s6.choiceA = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback("<strong>Source of truth.</strong> CCWR order details first — Salesforce may lag.", "ok");
          state.s6.substep = 1;
          renderStage6(root);
          refreshContinue();
        } else {
          applyWrong();
          const msg =
            id === "ask_raj"
              ? "<strong>Partner isn’t the system of record.</strong> Raj can mistype or round-trip slowly — pull from CCWR first."
              : "<strong>Never assume.</strong> Auto-fill can be wrong or stale — verify from the quote’s order block.";
          setFeedback(msg, "bad");
          renderStage6(root);
          refreshContinue();
        }
      });
      els.btnContinue.disabled = true;
      if (state.s6.choiceA === null) setFeedback("MBR search starts with a verified SO.", null);
      return;
    }
    if (state.s6.substep === 1) {
      const sc = `<div class="mbr-check"><p style="margin:0 0 10px;font-weight:600">MBR row for <span class="mono">${escapeHtml(DEAL.so)}</span></p>
        <dl>
          <dt>Sales Node</dt><dd>Commercial Central - Mid Size</dd>
          <dt>Booking date</dt><dd>July 14</dd>
          <dt>Bill-To</dt><dd>${escapeHtml(DEAL.partner)}</dd>
          <dt>End customer</dt><dd>${escapeHtml(DEAL.customer)}</dd>
          <dt>Net booking</dt><dd>${escapeHtml(DEAL.mbrNet)}</dd>
        </dl></div>`;
      const task = `Click whether this MBR row looks booking-ready (net after ~26% on ${escapeHtml(DEAL.listNet)} ≈ $54,9xx).`;
      const choices = getShuffledMcq("s6b", MCQ_CANON.s6b);
      root.innerHTML = scenarioCard(sc, task) + choiceGrid(choices, state.s6.choiceB);
      wireChoices(root, (id) => {
        if (state.gameOver) return;
        if (state.s6.substep !== 1) return;
        if (state.s6.choiceB === "yes_mbr" && id === "yes_mbr") return;
        state.s6.choiceB = id;
        if (isChoiceCorrect(choices, id)) {
          setFeedback(
            "<strong>Matches expectation.</strong> Next: <strong>reorder</strong> the five Salesforce close-out steps, press <strong>Submit sequence</strong>, then <strong>Continue</strong>.",
            "ok"
          );
          state.s6.substep = 2;
          if (!state.s6.order) state.s6.order = shuffle([...CLOSE_ORDER]);
          renderStage6(root);
          refreshContinue();
        } else {
          applyWrong();
          setFeedback("<strong>Recheck the math.</strong> $54,920 aligns with discounted net — don’t stall a good booking.", "bad");
          renderStage6(root);
          refreshContinue();
        }
      });
      els.btnContinue.disabled = true;
      if (state.s6.choiceB === null) setFeedback("Trust but verify the trio: partner, customer, dollars.", null);
      return;
    }
    /** drag order */
    const order = state.s6.order || shuffle([...CLOSE_ORDER]);
    state.s6.order = order;
    root.innerHTML =
      scenarioCard(
        `<p><strong>Everything checks out in MBR.</strong> Time to close this deal in Salesforce.</p><p><strong>Your action:</strong> (1) Put the <strong>five</strong> Salesforce close-out actions in the correct order — drag a row onto another, or use <strong>↑</strong>/<strong>↓</strong>. (2) Press <strong>Submit sequence</strong> to validate. (3) If correct, press <strong>Continue</strong> to finish the run.</p>`,
        "Reorder the five Salesforce close-out actions, then press Submit sequence to validate."
      ) +
      `<p class="play-actions" style="margin:10px 0 0"><button type="button" class="btn ghost" id="btnS6ChangeMbr">Change my earlier answer</button></p>` +
      `<ol class="step-drag-list" id="orderList">
        ${order
          .map(
            (key, idx) =>
              `<li class="step-drag-item" draggable="true" data-key="${key}" data-idx="${idx}">
            <strong>${idx + 1}.</strong> ${escapeHtml(CLOSE_LABELS[key])}
            <span style="float:right;display:inline-flex;gap:4px">
              <button type="button" class="btn ghost rq-move" data-dir="-1" data-idx="${idx}" style="padding:4px 8px">↑</button>
              <button type="button" class="btn ghost rq-move" data-dir="1" data-idx="${idx}" style="padding:4px 8px">↓</button>
            </span>
          </li>`
          )
          .join("")}
      </ol>
      <button type="button" class="btn primary" id="btnCheckOrder">Submit sequence</button>`;

    root.querySelector("#btnS6ChangeMbr").addEventListener("click", () => {
      state.s6.substep = 1;
      state.s6.choiceB = null;
      state.s6.order = null;
      state.s6.orderDone = false;
      state.s6.done = false;
      state.achievements.delete("first_close");
      state.achievements.delete("speed_demon");
      toast("Back to MBR check — re-answer if needed.");
      renderStage6(root);
      refreshContinue();
    });

    function paintOrder() {
      const list = root.querySelector("#orderList");
      if (!list) return;
      list.innerHTML = order
        .map(
          (key, idx) =>
            `<li class="step-drag-item" draggable="true" data-key="${key}" data-idx="${idx}">
            <strong>${idx + 1}.</strong> ${escapeHtml(CLOSE_LABELS[key])}
            <span style="float:right;display:inline-flex;gap:4px">
              <button type="button" class="btn ghost rq-move" data-dir="-1" data-idx="${idx}" style="padding:4px 8px">↑</button>
              <button type="button" class="btn ghost rq-move" data-dir="1" data-idx="${idx}" style="padding:4px 8px">↓</button>
            </span>
          </li>`
        )
        .join("");
      wireOrderList(list);
    }

    function swap(i, j) {
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      state.s6.order = order;
      paintOrder();
    }

    function wireOrderList(list) {
      let dragKey = null;
      list.querySelectorAll(".step-drag-item").forEach((li) => {
        li.addEventListener("dragstart", (e) => {
          dragKey = li.dataset.key;
          li.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", () => li.classList.remove("dragging"));
        li.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });
        li.addEventListener("drop", (e) => {
          e.preventDefault();
          const targetKey = li.dataset.key;
          if (!dragKey || dragKey === targetKey) return;
          const i = order.indexOf(dragKey);
          const j = order.indexOf(targetKey);
          swap(i, j);
        });
      });
      list.querySelectorAll(".rq-move").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const idx = Number(btn.dataset.idx);
          const dir = Number(btn.dataset.dir);
          swap(idx, idx + dir);
        });
      });
    }

    paintOrder();
    wireOrderList(root.querySelector("#orderList"));

    const btnCheck = root.querySelector("#btnCheckOrder");
    const checkOrder = () => {
      const ok = CLOSE_ORDER.every((k, i) => order[i] === k);
      if (ok) {
        state.s6.orderDone = true;
        state.s6.done = true;
        state.achievements.add("first_close");
        if (state.daysLeft >= 30) state.achievements.add("speed_demon");
        setFeedback(
          "<strong>Closed clean.</strong> SO → verify amount → <strong>note before Closed Won</strong> → stage → Save — permanent record while you still have the opp open.",
          "ok"
        );
        els.btnContinue.disabled = false;
      } else {
        applyWrong();
        setFeedback(
          "<strong>Order matters.</strong> Reorder until: <strong>SO → amount → note → Closed Won → Save</strong>, then press <strong>Submit sequence</strong> again.",
          "bad"
        );
      }
      refreshContinue();
    };

    if (btnCheck) btnCheck.addEventListener("click", checkOrder);
    els.btnSubmit.hidden = true;
    els.btnContinue.disabled = true;
    setFeedback(
      "<strong>Reorder the five steps</strong> (drag or ↑↓), then press <strong>Submit sequence</strong>. When it validates, press <strong>Continue</strong>.",
      null
    );
    refreshContinue();
  }

  function renderGameOver() {
    clearInterval(state.timerId);
    state.timerId = null;
    state.won = false;
    state.activeView = "play";
    const shellGo = document.querySelector(".play-shell--arena");
    if (shellGo) shellGo.classList.remove("play-shell--exit");
    els.stageBody.innerHTML = `<div class="loss-hero"><h3 style="margin:0 0 8px">Time’s up</h3><p class="muted" style="margin:0">The renewal countdown (${COUNTDOWN_START_LABEL} → ${CLOSE_DEADLINE_LABEL}) hit zero before you reached Closed Won. Restart and protect those five-day slips.</p></div>
      <div class="play-actions"><button type="button" class="btn primary" id="btnLossRestart">Restart run</button></div>`;
    els.stageTitle.textContent = "Run ended";
    els.stageLede.textContent = "";
    els.stageEyebrow.textContent = "";
    els.missionObjective.textContent = "";
    els.stageBadge.textContent = "";
    document.getElementById("btnLossRestart").addEventListener("click", () => resetRun());
    els.btnContinue.disabled = true;
    els.btnHint.disabled = true;
    els.btnRestart.disabled = true;
    els.btnSubmit.hidden = true;
    setFeedback("", null);
    renderDealStrip();
    renderQuestLog();
  }

  function renderExitView(fromCompletion) {
    state.activeView = "exit";
    if (fromCompletion) burstConfetti();
    const used = INITIAL_DAYS - state.daysLeft;
    const spare = state.daysLeft;
    const rows = QUEST_LABELS.map((label, i) => {
      const w = state.stageLedger[i].wrong * WRONG_DAY_COST;
      return `<tr><td>${escapeHtml(label)}</td><td>${w || "0"}</td></tr>`;
    }).join("");
    els.stageEyebrow.textContent = "Quest complete";
    els.stageBadge.textContent = "DONE";
    els.stageTitle.textContent = "Congratulations";
    els.stageLede.textContent = "You closed Meridian clean — renewal muscle memory earned.";
    els.missionObjective.textContent = "";
    els.stageBody.innerHTML = `
      <div class="results-hero exit-hero">
        <h3 style="margin:0 0 10px">${escapeHtml(GAME_TITLE)}</h3>
        <p class="exit-congrats" style="margin:0 0 12px;font-size:1.05rem;font-weight:600;color:var(--green)">Outstanding work — you finished every stage before the clock ran out.</p>
        <p class="muted" style="margin:0">Meridian is booked and aligned in Salesforce. Use the quest log anytime to revisit a stage and tune your answers.</p>
      </div>
      <div class="panel exit-stat-panel">
        <h3 style="margin-top:0">Days on the clock</h3>
        <p style="margin:0;font-size:1.35rem;font-weight:700;color:var(--cyan-light)">${spare} <span style="font-size:0.95rem;font-weight:600;color:var(--text)">days saved</span></p>
        <p class="muted" style="margin:8px 0 0;font-size:0.9rem">You still have <strong>${spare}</strong> of your starting <strong>${INITIAL_DAYS}</strong> days left toward ${CLOSE_DEADLINE_LABEL} — that is how much runway you preserved. Wrong turns cost <strong>${used}</strong> day${used === 1 ? "" : "s"} total this run.</p>
        ${state.stageLedger[2].bonus ? '<p class="muted" style="margin:10px 0 0;font-size:0.88rem">Stage 3 bonus: <strong>+3 days</strong> banked on the clock.</p>' : ""}
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Achievements</h3>
        <ul class="ach-list">${[...state.achievements].map((a) => `<li>${escapeHtml(achievementLabel(a))}</li>`).join("") || '<li class="muted">None this run.</li>'}</ul>
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Stage recap</h3>
        <table class="results-table"><thead><tr><th>Stage</th><th>Days lost (wrong)</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="rq-ref">
        <details><summary>Quick reference</summary>
          <ul style="margin:8px 0;padding-left:1.1rem;font-size:0.88rem">
            <li>IB → contract + assets + dates; ATR lines → match <strong>end date</strong> to opp quarter</li>
            <li>SFDC opp + Partner field must match IB Services Bill-To</li>
            <li>Medium risk → training / CS / AS path; Strategic interlock for high-$ HIGH-risk horizon accounts</li>
            <li>Partner mail → context + quote # + asks; SFDC → attach → note → stage → save</li>
            <li>DSA → Quote tab → Create Quote → fields honest → submit</li>
            <li>Fran → <span class="mono">subscribe &lt;quote&gt;</span> → CCWR status meanings → Booked ≠ Complete (~24h watch)</li>
            <li>MBR trio check → five-step close (note before Closed Won) → Submit sequence → Continue</li>
          </ul>
        </details>
      </div>
      <div class="play-actions exit-actions">
        <button type="button" class="btn secondary" id="shareBtn">Copy summary</button>
        <button type="button" class="btn secondary" id="againBtn">New run</button>
      </div>`;
    document.getElementById("againBtn").addEventListener("click", () => resetRun());
    document.getElementById("shareBtn").addEventListener("click", async () => {
      const text = `${GAME_TITLE} — ${spare} days remaining — Meridian closed`;
      try {
        await navigator.clipboard.writeText(text);
        toast("Copied summary.");
      } catch {
        prompt("Copy:", text);
      }
    });
    els.btnContinue.disabled = true;
    els.btnHint.disabled = true;
    els.btnRestart.disabled = true;
    els.btnSubmit.hidden = true;
    els.btnSubmit.textContent = "Submit";
    setFeedback("<strong>You made it.</strong> Rhythm beats heroics — repeat until it’s muscle memory.", "ok");
    clearInterval(state.timerId);
    state.timerId = null;
    const shell = document.querySelector(".play-shell--arena");
    if (shell) shell.classList.add("play-shell--exit");
  }

  function achievementLabel(id) {
    const map = {
      partner_whisperer: "Partner Whisperer — context-rich first touch",
      fran_fan: "Fran Fan — subscribed to quote alerts",
      deal_maker: "Deal Maker — DSA submitted with instant-approval hygiene",
      finance_ping: "Finance aware — Deal ID ping when queue owns the approval",
      first_close: "First Close — finished all seven stages",
      speed_demon: "Speed Demon — 30+ days to spare",
      risk_mitigator: "Risk Mitigator — chose the medium-risk enablement path",
    };
    return map[id] || id;
  }

  const stageRenderers = [
    renderStage0,
    renderStage1,
    renderStage2,
    renderStage3,
    renderStage4,
    renderStage5,
    renderStage6,
  ];

  function mountStage() {
    if (state.gameOver) return;
    if (state.activeView === "exit") return;
    state.maxReachedStageIndex = Math.max(state.maxReachedStageIndex, state.stageIndex);
    const shell = document.querySelector(".play-shell--arena");
    if (shell) shell.classList.remove("play-shell--exit");
    state.daysOnStageEnter = state.daysLeft;
    els.stageBody.classList.remove("play-body--enter");
    void els.stageBody.offsetWidth;
    els.stageBody.classList.add("play-body--enter");
    const i = state.stageIndex;
    els.stageEyebrow.textContent = `Stage ${i + 1} of 7`;
    els.stageBadge.textContent = `STAGE ${i + 1}`;
    const titles = [
      "Verify ATR in Cisco Ready",
      "Match the Salesforce opportunity",
      "De-risk before you push",
      "Partner outreach",
      "DSA & discount",
      "Track the PO",
      "Verify booking & close",
    ];
    const ledes = [
      "IB → Salesforce handoff",
      "Search results, one winner",
      "Lifecycle signal → action",
      "First email that moves work",
      "Path + fields + finance edge case",
      "Fran + CCWR ladder",
      "MBR truth → Closed Won hygiene",
    ];
    els.stageTitle.textContent = titles[i];
    els.stageLede.textContent = ledes[i];
    els.missionObjective.textContent = [
      `IB anchors, then validate which IB lines roll into this renewal by end date (Q4 FY26 / ${CLOSE_DEADLINE_LABEL}).`,
      "Pick the right opp, then reconcile blank Partner vs IB bill-to.",
      "Medium-risk Meridian path + bonus; then size GlobalTech for Strategic interlock.",
      "Arrange the Salesforce activities in the correct sequence.",
      "Click-path, DSA fields, finance queue habit.",
      "Fran subscribe → map CCWR statuses → 5:30 PM playbook (Booked ≠ Complete).",
      "SO from CCWR, MBR check, then five-step close (note before Closed Won) → Submit sequence.",
    ][i];
    els.hudQuote.textContent = i >= 3 ? DEAL.quote : "—";
    renderQuestLog();
    renderDealStrip();
    stageRenderers[i](els.stageBody);
    if (!(i === 4 && state.s4.substep === 1)) {
      els.btnSubmit.hidden = true;
    }
    if (!state.gameOver) {
      els.btnHint.disabled = false;
      els.btnRestart.disabled = false;
    }
    updateHudDays();
    refreshContinue();
  }

  function validateStage() {
    if (state.gameOver) return false;
    switch (state.stageIndex) {
      case 0:
        return state.s0.done;
      case 1:
        return state.s1.done;
      case 2:
        return state.s2.done && state.s2.postBonus && state.s2.interlockDone;
      case 3:
        return state.s3.done && state.s3.sequenceDone;
      case 4:
        return state.s4.done;
      case 5:
        return state.s5.done;
      case 6:
        return state.s6.done;
      default:
        return false;
    }
  }

  function resetStageState() {
    state.shuffledChoices = {};
    state.s0 = { substep: 0, choice: null, choice2: null, done: false };
    state.s1 = { substep: 0, choice: null, choice2: null, done: false };
    state.s2 = {
      choice: null,
      bonusTaken: false,
      postBonus: false,
      done: false,
      interlockChoice: null,
      interlockDone: false,
    };
    state.s3 = { substep: 0, choice: null, order: null, sequenceDone: false, done: false };
    state.s4 = { choiceA: null, substep: 0, dsaFields: {}, dsaDone: false, bonusChoice: null, bonusDone: false, done: false };
    state.s5 = { choiceA: null, choiceB: null, substep: 0, statusPick: {}, done: false };
    state.s6 = { choiceA: null, choiceB: null, substep: 0, order: null, orderDone: false, done: false };
  }

  function resetRun() {
    clearInterval(state.timerId);
    state.stageIndex = 0;
    state.maxReachedStageIndex = 0;
    state.daysLeft = INITIAL_DAYS;
    state.gameOver = false;
    state.won = false;
    state.activeView = "play";
    state.achievements.clear();
    state.stageLedger = QUEST_LABELS.map(() => ({ wrong: 0, bonus: false }));
    resetStageState();
    els.btnHint.disabled = false;
    els.btnRestart.disabled = false;
    els.btnSubmit.hidden = true;
    els.btnSubmit.textContent = "Submit";
    els.btnSubmit.onclick = null;
    startTimer();
    mountStage();
    refreshContinue();
    toast("New run");
  }

  function refreshContinue() {
    const ok = validateStage();
    els.btnContinue.disabled = !ok || state.gameOver || state.won || state.activeView === "exit";
  }

  function restartCurrentStage() {
    if (state.activeView === "exit") {
      toast("Open a stage from the quest log to restart it.");
      return;
    }
    state.daysLeft = state.daysOnStageEnter;
    updateHudDays();
    /** reset ledger wrong counts for this stage */
    state.stageLedger[state.stageIndex] = { wrong: 0, bonus: state.stageLedger[state.stageIndex].bonus };
    switch (state.stageIndex) {
      case 0:
        clearMcqKeysForStage(0);
        state.s0 = { substep: 0, choice: null, choice2: null, done: false };
        break;
      case 1:
        clearMcqKeysForStage(1);
        state.s1 = { substep: 0, choice: null, choice2: null, done: false };
        break;
      case 2:
        clearMcqKeysForStage(2);
        state.s2 = {
          choice: null,
          bonusTaken: false,
          postBonus: false,
          done: false,
          interlockChoice: null,
          interlockDone: false,
        };
        break;
      case 3:
        clearMcqKeysForStage(3);
        state.s3 = { substep: 0, choice: null, order: null, sequenceDone: false, done: false };
        break;
      case 4:
        clearMcqKeysForStage(4);
        state.s4 = { choiceA: null, substep: 0, dsaFields: {}, dsaDone: false, bonusChoice: null, bonusDone: false, done: false };
        break;
      case 5:
        clearMcqKeysForStage(5);
        state.s5 = { choiceA: null, choiceB: null, substep: 0, statusPick: {}, done: false };
        break;
      case 6:
        clearMcqKeysForStage(6);
        state.s6 = { choiceA: null, choiceB: null, substep: 0, order: null, orderDone: false, done: false };
        break;
      default:
        break;
    }
    if (state.stageIndex === 6 && state.won) {
      state.won = false;
      state.activeView = "play";
    }
    state.gameOver = false;
    els.btnHint.disabled = false;
    els.btnSubmit.hidden = true;
    els.btnSubmit.onclick = null;
    mountStage();
    toast("Stage restarted");
  }

  /* ---------- Init wiring ---------- */
  els.btnContinue.addEventListener("click", () => {
    if (!validateStage() || state.gameOver || state.won) return;
    if (state.stageIndex < 6) {
      state.stageIndex += 1;
      mountStage();
    } else {
      state.won = true;
      renderExitView(true);
      renderQuestLog();
      renderDealStrip();
    }
  });

  els.btnSubmit.addEventListener("click", () => {
    if (state.stageIndex === 4 && state.s4.substep === 1) {
      const form = els.stageBody.querySelector("#dsaForm");
      if (!form) return;
      const v = {
        justification: form.justification.value,
        validity: form.validity.value,
        reason: form.reason.value,
        competitor: form.competitor.value,
        renewalType: form.renewalType.value,
        prevId: form.prevId.value,
      };
      const ok =
        v.justification === DSA_CORRECT.justification &&
        v.validity === DSA_CORRECT.validity &&
        v.reason === DSA_CORRECT.reason &&
        v.competitor !== "" &&
        v.competitor !== "skip" &&
        v.renewalType === DSA_CORRECT.renewalType &&
        v.prevId === DSA_CORRECT.prevId;
      if (ok) {
        setFeedback("<strong>Instant approval.</strong> PF + 30d + satisfaction + competitor picked + renewal + prior 0 = clean submit.", "ok");
        state.s4.dsaDone = true;
        state.s4.substep = 2;
        state.achievements.add("deal_maker");
        els.btnSubmit.hidden = true;
        mountStage();
      } else {
        applyWrong();
        const fails = dsaFieldFailures(v);
        const hint =
          fails.length > 0
            ? `<br/><span class="muted">Re-check: ${escapeHtml(fails.join("; "))}.</span>`
            : "";
        setFeedback(`<strong>Fields incomplete or off-policy.</strong> Walk each dropdown against policy.${hint}`, "bad");
      }
      refreshContinue();
    }
  });

  els.btnHint.addEventListener("click", () => {
    if (state.activeView === "exit") return;
    if (state.stageIndex === 6) {
      if (state.s6 && state.s6.substep < 2) {
        setFeedback(
          "<strong>Hint:</strong> Answer the SO source question, then confirm the MBR row. After the five-step reorder appears, use <strong>Get hint</strong> again for the exact Salesforce sequence.",
          "warn"
        );
      } else {
        setFeedback(`<strong>Hint:</strong> ${SPOILER_STAGE7_SF_ORDER}`, "warn");
      }
      toast("Hint shown");
      return;
    }
    const hints = [
      `Thomas’ tip: contract # + assets + dates — then only ${CLOSE_DEADLINE_LABEL} lines on this Q4 FY26 opp (not Nov).`,
      "Opp #2 + Q4 FY26 + $74,200; blank Partner → flag lead (IB bill-to = NetEdge).",
      "Meridian: medium = train/CS; bonus ping. GlobalTech: HIGH $ + barrier + 18mo = Strategic interlock.",
      "Outreach with context; then attach quote → note → Stage 1→3 → Save.",
      "DSA starts under Quote → Create Quote on the CCWR line.",
      "Fran subscribe. Status ladder: In Progress→initiated; Submitted→partner sent; Booked→accepted not done; Conversion→backend; Complete→MBR. Booked at 5:30 PM → wait / ~24h.",
    ];
    setFeedback(`<strong>Hint:</strong> ${hints[state.stageIndex]}`, "warn");
    toast("Hint shown");
  });

  els.btnRestart.addEventListener("click", () => restartCurrentStage());

  els.btnMenu.addEventListener("click", () => {
    els.modalMenu.hidden = false;
  });
  els.menuClose.addEventListener("click", () => {
    els.modalMenu.hidden = true;
  });
  els.menuRestart.addEventListener("click", () => {
    els.modalMenu.hidden = true;
    resetRun();
  });
  els.modalMenu.addEventListener("click", (e) => {
    if (e.target === els.modalMenu) els.modalMenu.hidden = true;
  });

  els.workflowList.addEventListener("click", (e) => {
    const exitEl = e.target.closest("[data-exit-nav]");
    const stageEl = e.target.closest("[data-stage-nav]");
    if (state.gameOver) return;
    if (exitEl && state.won) {
      renderExitView(false);
      renderQuestLog();
      renderDealStrip();
      refreshContinue();
      return;
    }
    if (stageEl) {
      const idx = Number(stageEl.dataset.stageNav);
      if (Number.isNaN(idx)) return;
      if (idx > state.maxReachedStageIndex) {
        toast("Reach each stage in order with Continue — later stages stay locked until then.");
        return;
      }
      state.activeView = "play";
      state.stageIndex = idx;
      mountStage();
      renderQuestLog();
      renderDealStrip();
      refreshContinue();
    }
  });

  els.workflowList.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const li = e.target.closest("[data-stage-nav], [data-exit-nav]");
    if (!li || state.gameOver) return;
    e.preventDefault();
    li.click();
  });

  updateHudDays();
  startTimer();
  mountStage();
  refreshContinue();
})();
