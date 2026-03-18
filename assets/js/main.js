// /assets/js/main.js
(function () {
    "use strict";

    // =========================================================
    // Helpers
    // =========================================================
    function smoothScrollTo(el) {
        if (!el) return;
        el.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // =========================================================
    // HERO: line reveal + "decisions" alignment (±8px)
    // =========================================================
    function initHeroAnimation() {
        const heroLines = document.querySelectorAll(".hero-line");
        const heroSub = document.querySelector(".hero-sub");
        const decisionWord = document.querySelector(".decisions");

        // ---- Line reveal (あなたのCSS is-active を前提)
        heroLines.forEach((line, index) => {
            setTimeout(() => line.classList.add("is-active"), index * 500);
        });

        if (heroSub) {
            setTimeout(() => heroSub.classList.add("is-active"), 1000);
        }

        // ---- Decision word: split to spans and align
        if (decisionWord && !decisionWord.dataset.splitDone) {
            decisionWord.dataset.splitDone = "1";

            const original = decisionWord.textContent || "";
            decisionWord.textContent = "";

            // 初期は完全透明（フラッシュ防止）
            decisionWord.style.opacity = "0";

            original.split("").forEach((ch, i) => {
                const s = document.createElement("span");
                s.textContent = ch;
                s.style.display = "inline-block";

                // ここが「左右±8pxだけズレている」
                const dir = i % 2 === 0 ? -18 : 18;
                s.style.transform = `translateX(${dir}px)`;
                s.style.opacity = "0";

                decisionWord.appendChild(s);
            });

            // 読めるテンポで開始（あなたの現在の見た目に合わせて）
            setTimeout(() => {
                decisionWord.style.opacity = "1";
                const spans = decisionWord.querySelectorAll("span");

                spans.forEach((s) => {
                    // 完全透明→フェード→整列
                    s.style.transition =
                        "transform 2600ms cubic-bezier(.2,.8,.2,1), opacity 2000ms cubic-bezier(.2,.8,.2,1)";
                    s.style.transform = "translateX(0px)";
                    s.style.opacity = "1";
                });
            }, 1200);
        }
    }

    // =========================================================
    // DIAGNOSIS: Q1/Q2 standard flow
    // =========================================================
    function initDiagnosisFlow() {
        const buttons = document.querySelectorAll("[data-next]");
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const nextId = btn.getAttribute("data-next");
                if (!nextId) return;

                const nextEl = document.getElementById(nextId);
                if (!nextEl) return;

                // Q3以外は通常どおり（Q3は別で制御）
                // ※ただし「q3 card内の decision遷移」だけは後述のQ3ハンドラで上書きする
                nextEl.classList.remove("is-hidden");
                smoothScrollTo(nextEl);
            });
        });
    }

    // =========================================================
    // Q3: bridge -> delay -> decision (data-q3 / data-next="decision" 両対応)
    // =========================================================
    function initQ3Flow() {
        // 1) data-q3 が付いている場合
        const q3ButtonsA = Array.from(document.querySelectorAll("[data-q3]"));

        // 2) HTMLが data-next="decision" のままの場合（あなたのIndexはこれ）
        const q3Card = document.getElementById("q3");
        const q3ButtonsB = q3Card ?
            Array.from(q3Card.querySelectorAll('[data-next="decision"]')) : [];

        const q3Buttons = [...new Set([...q3ButtonsA, ...q3ButtonsB])];
        if (!q3Buttons.length) return;

        q3Buttons.forEach((btn) => {
            // 既存の [data-next] ハンドラより優先させる
            btn.addEventListener(
                "click",
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const bridge = document.getElementById("q3Bridge");
                    const decision = document.getElementById("decision");

                    // 連打防止
                    q3Buttons.forEach((b) => (b.disabled = true));

                    // ブリッジ表示（存在すれば）
                    if (bridge) bridge.classList.remove("is-hidden");

                    // 読了の間（あなたは 1.0 秒にしている）
                    setTimeout(() => {
                        if (decision) smoothScrollTo(decision);
                    }, 1000);
                },
                true
            );
        });
    }

    // =========================================================
    // EMAIL GATE -> RESULT
    // =========================================================
    function initEmailGate() {
        const gateForm = document.getElementById("gateForm");
        if (!gateForm) return;

        gateForm.addEventListener("submit", (e) => {
            // Prevent native submit so the page does not reload.
            // Actual processing is handled by the submit button click logic below.
            e.preventDefault();
        });
    }

    // =========================================================
    // HEADER AUTO HIDE
    // =========================================================
    function initHeaderAutoHide() {
        const header = document.getElementById("siteHeader");
        if (!header) return;

        let lastY = window.scrollY;
        let ticking = false;

        function onScroll() {
            const y = window.scrollY;

            if (y < 80) {
                header.classList.remove("is-hidden");
                lastY = y;
                ticking = false;
                return;
            }

            const goingDown = y > lastY;
            if (goingDown) header.classList.add("is-hidden");
            else header.classList.remove("is-hidden");

            lastY = y;
            ticking = false;
        }

        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(onScroll);
                ticking = true;
            }
        });
    }

    // =========================================================
    // Boot
    // =========================================================
    window.addEventListener("load", () => {
        initHeroAnimation();
        initDiagnosisFlow();
        initQ3Flow();
        initEmailGate();
        initHeaderAutoHide();
        initContactPrefill();
        // =========================================
        // LOAD SHARED FOOTER COMPONENT
        // =========================================
        const footerContainer = document.getElementById("footer");
        if (footerContainer) {
            fetch("components/footer.html")
                .then(res => res.text())
                .then(data => {
                    footerContainer.innerHTML = data;
                })
                .catch(err => console.error("Footer load failed:", err));
        }
        // =========================================
        // STOP GRID AFTER 5 SECONDS
        // =========================================

        const heroGrid = document.querySelector(".hero-grid");

        if (heroGrid) {
            setTimeout(() => {
                heroGrid.style.animation = "none";
            }, 5000);
        }
    });
})();

function scrollToElement(el) {
    if (!el) return;
    el.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// =========================================================
// CONTACT PAGE: Prefill message from diagnosis result
// =========================================================
function initContactPrefill() {

    const stored = sessionStorage.getItem("diagnosisResult");
    const ctaStored = sessionStorage.getItem("ctaContext");

    let cta;
    try {
        cta = JSON.parse(ctaStored);
    } catch (e) {
        cta = null;
    }
    if (!stored) return;

    let data;
    try {
        data = JSON.parse(stored);
    } catch (e) {
        return;
    }

    const textarea =
        document.querySelector("#message") ||
        document.querySelector('textarea[name="message"]');

    if (!textarea) return;
    const prefillText =
        `Diagnosis reference

Diagnosis:
${data.title}

Summary:
${data.text}

Recommended Direction:
${cta ? cta.primary : ""}

Context:
${cta ? cta.micro : ""}

Objective:
I would like to begin a working conversation regarding the structural condition of the concept.`;

    if (!textarea.value.trim()) {
        textarea.value = prefillText;
    }

    textarea.placeholder = "Add anything specific about your project, timeline, or priorities.";

    // UX improvement: guide the user directly to the message field
    setTimeout(() => {
        scrollToElement(textarea);
        textarea.focus();
    }, 300);
}

/* ===============================
   Diagnosis Logic
================================= */

const answers = [];
let step = 1;

// -------------------------------
// Question flow
// -------------------------------
document.querySelectorAll(".answer").forEach((btn) => {

    btn.addEventListener("click", () => {

        // store answer
        answers.push(btn.dataset.value || "A");

        // hide current question
        const current = document.querySelector(`[data-step="${step}"]`);
        if (current) current.classList.add("is-hidden");

        step++;

        // show next question or email gate
        if (step <= 3) {

            const next = document.querySelector(`[data-step="${step}"]`);
            if (next) next.classList.remove("is-hidden");

        } else {

            const gate = document.getElementById("emailGate");
            if (gate) gate.classList.remove("is-hidden");

        }

    });

});


// -------------------------------
// Email submit → show result
// -------------------------------
const submitBtn = document.getElementById("submitDiagnosis");
const resultBox = document.getElementById("diagnosisResult");

if (submitBtn) {
    submitBtn.addEventListener("click", () => {

        // Prevent double‑submission
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;

        const emailInput = document.getElementById("diagnosisEmail");
        const email = emailInput ? emailInput.value.trim() : "";
        // UX feedback
        submitBtn.textContent = "Analyzing...";
        submitBtn.classList.add("is-processing");

        if (!email || !email.includes("@")) {
            if (emailInput) emailInput.focus();
            return;
        }

        const resultData = calculateResult();

        const title = document.getElementById("resultTitle");
        const text = document.getElementById("resultText");

        const analysisSteps = [
            "Define the core decision sequence.",
            "Identify structural friction in operations.",
            "Trace impact on spatial and workflow design.",
            "Evaluate nonlinear cost implications."
        ];

        let stepIndex = 0;

        // Show result box early (for analysis display)
        if (resultBox) resultBox.classList.remove("is-hidden");
        smoothScrollTo(resultBox);

        function runAnalysisSteps() {
            if (!text) return;

            if (stepIndex < analysisSteps.length) {
                text.textContent = analysisSteps[stepIndex];
                stepIndex++;
                setTimeout(runAnalysisSteps, 700); // ~0.7s per step
            } else {
                // Final result rendering
                if (title) title.textContent = resultData.title;
                if (text) text.textContent = resultData.text;
            }
        }

        runAnalysisSteps();

        // =========================================================
        // DYNAMIC CTA BUTTON (Result-based)
        // =========================================================
        const ctaButton = document.querySelector("#resultCTA");
        const ctaMicro = document.querySelector("#resultCTAMicro");

        const ctaMap = {
            "Foundational Blur": {
                primary: "Resolve the foundational structure.",
                micro: "Begin a working conversation to clarify your core concept before visual execution."
            },
            "Sequence Drift": {
                primary: "Lock the decision sequence.",
                micro: "Begin a working conversation to clarify your architecture before committing design capital."
            },
            "Misaligned Momentum": {
                primary: "Realign the core structure.",
                micro: "Pause execution and begin a working conversation to realign before further capital is deployed."
            },
            "Strategic Coherence": {
                primary: "Translate the structure without deviation.",
                micro: "Begin a working conversation to ensure physical execution strictly serves your strategy."
            }
        };

        const dynamicCTA = ctaMap[resultData.title];

        if (dynamicCTA) {
            if (ctaButton) ctaButton.textContent = dynamicCTA.primary;
            if (ctaMicro) ctaMicro.textContent = dynamicCTA.micro;
        }

        // =========================================================
        // CTA CLICK → CONTACT PAGE (Context Carryover)
        // =========================================================
        if (ctaButton) {
            ctaButton.addEventListener("click", () => {
                window.location.href = "contact.html";
            });
        }

        sessionStorage.setItem("diagnosisResult", JSON.stringify(resultData));

        // CTA CONTEXT CARRYOVER (reuse existing mapping)
        if (dynamicCTA) {
            sessionStorage.setItem("ctaContext", JSON.stringify(dynamicCTA));
        }
        resultBox.classList.remove("is-hidden");
        smoothScrollTo(resultBox);

        emailjs.send("service_vgrfa1p", "template_485fu3o", {
                email: email,
                title: resultData.title,
                result: resultData.text
            })
            .then(function (response) {

                console.log("SUCCESS", response.status, response.text);

                // Restore button state
                submitBtn.textContent = "Continue";
                submitBtn.classList.remove("is-processing");
                submitBtn.disabled = false;

            })
            .catch(function (error) {

                console.error("FAILED", error);

                // Restore button state so the user can retry
                submitBtn.textContent = "Continue";
                submitBtn.classList.remove("is-processing");
                submitBtn.disabled = false;

            });

    });
}


// -------------------------------
// Result calculation
// -------------------------------
function calculateResult() {

    const score = answers.reduce((acc, val) => {

        if (val === "A") return acc + 1;
        if (val === "B") return acc + 2;
        if (val === "C") return acc + 3;
        if (val === "D") return acc + 4;

        return acc;

    }, 0);

    if (score <= 5) {
        return {
            title: "Foundational Blur",
            text: `Your diagnostic pattern indicates that the core structure of the concept has not yet been defined with sufficient clarity.

Without a fixed foundation, decisions cannot follow a stable sequence. Concept, operations, and design begin to move forward independently, without a governing structure. This creates a condition where each new decision is based on assumptions, rather than a locked strategic baseline.

In food and beverage environments, this lack of definition produces immediate structural friction. If the menu direction is not fully established, the kitchen layout cannot be finalized. An unresolved layout forces ongoing adjustments in spatial flow, guest movement, and service clarity. These changes are not isolated. Each one compounds the previous, and costs do not stay linear.

The issue is not execution, but the absence of a defined structure guiding it. Without that foundation, progress introduces instability rather than coherence.

All physical and visual execution must be paused until the structure is clarified. The core concept and operational logic must be defined and locked first. Only then can design and operations function as precise translations, rather than iterative corrections of an unresolved idea.`
        };
    }

    if (score <= 7) {
        return {
            title: "Sequence Drift",
            text: `Your current diagnostic pattern indicates that key decisions within the concept are not following a stable sequence.

When decision order becomes inconsistent, execution loses a reliable reference point. Concept, operations, and design begin to evolve independently, without a fixed structural baseline. This creates conditions where each new decision forces a reinterpretation of what should have already been resolved.

In food and beverage environments, this misalignment produces a cascading effect. A change in menu direction alters operational requirements. That shift impacts spatial layout. Adjustments to layout then disrupt flow, guest movement, and service clarity. These changes are not isolated. Each one compounds the previous, and costs do not stay linear.

The issue is not the quality of individual decisions, but the absence of a fixed sequence governing them. Without that structure, progress generates friction rather than clarity.

Execution must follow a defined order. Before advancing further, the decision sequence must be clarified and locked. Only then can design and operations function as precise extensions of the concept, rather than continuous corrections of it.`
        };
    }

    if (score <= 9) {
        return {
            title: "Misaligned Momentum",
            text: `Your diagnostic pattern indicates that the project is advancing, but key components are not structurally aligned.

Execution is progressing across concept, operations, and design, yet these elements are not governed by a unified decision sequence. As a result, physical and visual choices are being made before their dependencies are fully resolved.

In food and beverage environments, this misalignment produces compounding friction. Because costs do not stay linear, forward movement under incorrect assumptions increases financial exposure. A shift in menu direction requires immediate changes to operational setup. That change impacts spatial layout. Layout adjustments then disrupt flow, guest experience, and service clarity. Each step compounds the previous, creating structural debt rather than progress.

The issue is not a lack of progress, but progress occurring without alignment. Without a synchronized structure, execution scales inconsistency.

Execution must be paused and realigned. The operational framework and brand logic must be brought into structural agreement before further capital is committed. Only then can momentum translate into a coherent physical and operational system, rather than a series of costly corrections.`
        };
    }

    return {
        title: "Strategic Coherence",
        text: `Your diagnostic pattern indicates that the concept is structurally coherent and properly sequenced.

The relationship between concept, operations, and design is clearly defined. Decisions are being made within a stable framework, allowing each layer of the project to reinforce the same underlying logic. The primary challenge is no longer definition, but preserving this structure through execution.

In food and beverage environments, even a well-defined structure is vulnerable to execution drift. Costs do not stay linear if translation introduces inconsistencies. A minor change in spatial flow can force adjustments in kitchen layout. That adjustment can restrict menu capabilities, gradually destabilizing the operational system. These changes compound over time, introducing friction into what was previously a coherent structure.

The risk is not structural failure, but gradual misalignment during implementation. Without strict control, execution can begin to diverge from the original logic.

Execution must strictly follow the defined structure. Every spatial, operational, and visual decision must map directly to the established framework. Only through controlled translation can the concept maintain its integrity, ensuring that the final environment performs exactly as intended, without introducing new structural friction.`
    };

}