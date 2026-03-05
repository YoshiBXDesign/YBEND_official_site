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

// =========================================================
// CONTACT PAGE: Prefill message from diagnosis result
// =========================================================
function initContactPrefill() {

    const stored = sessionStorage.getItem("diagnosisResult");
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

Objective:
I would like to begin a working conversation regarding the structural condition of the concept.`;

    textarea.placeholder = prefillText;
    // UX improvement: guide the user directly to the message field
    setTimeout(() => {
        smoothScrollTo(textarea);
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

        if (title) title.textContent = resultData.title;
        if (text) text.textContent = resultData.text;

        sessionStorage.setItem("diagnosisResult", JSON.stringify(resultData));
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
            text: `Your responses indicate that the underlying structure of the concept is not yet fully defined.

At this stage, the relationship between concept, positioning, and operational reality remains partially unresolved.

When a restaurant concept advances without structural definition, decisions tend to occur in isolation. Menu development, interior direction, brand language, and operational planning begin to move forward independently.

Each element may appear reasonable on its own, yet the absence of an integrated structure gradually introduces friction between them.

Clarifying the structural foundation resolves this condition.

The appropriate next step is to formalize the concept structure before committing further resources to execution.`
        };
    }

    if (score <= 7) {
        return {
            title: "Sequence Drift",
            text: `Your responses suggest that the project is progressing, yet the order in which key decisions are being made may not be fully aligned.

In restaurant development, the sequence of decisions determines the stability of the project. Concept definition typically informs operational structure, which then informs spatial design, service systems, and brand expression. When this order becomes inverted, components begin to develop without a shared structural reference.

The result is gradual drift between layers of the project. A design direction may emerge before operational logic is finalized. A brand narrative may develop before positioning is fully defined. Operational systems may evolve independently from the guest experience they are meant to support.

When these elements advance out of sequence, later stages of the project require structural correction. These corrections increase complexity and frequently introduce delays during implementation.

Realigning the decision sequence restores coherence. By reconnecting concept, operations, and design within a single structural framework, the project can continue forward without accumulating additional friction.

The next step is to re-establish the structural order of the project’s core decisions.`
        };
    }

    if (score <= 9) {
        return {
            title: "Misaligned Momentum",
            text: `Your responses indicate that the concept has progressed beyond early definition and that several components of the project are already taking shape.

At this stage, development momentum is present. However, momentum alone does not guarantee structural alignment. When multiple elements of a project advance simultaneously, differences in their underlying logic can begin to appear.

Concept positioning, operational systems, spatial design, and brand expression must ultimately reinforce the same structural intent. If these elements evolve under different assumptions, inconsistencies appear between the idea of the restaurant and the way it functions in practice.

These inconsistencies often remain hidden during early development. They become visible when operational planning, service flow, or spatial constraints force the concept to translate into real conditions.

Resolving this condition requires structural alignment rather than additional momentum. By clarifying how each component of the project supports the core concept, the development process regains coherence.

The next step is to align the existing components of the project under a unified structural framework before moving deeper into execution.`
        };
    }

    return {
        title: "Strategic Coherence",
        text: `Your responses indicate a high degree of alignment between concept, operational thinking, and decision structure.

In structurally coherent restaurant concepts, decisions follow a clear hierarchy. The concept defines the intent of the project. Operational systems translate that intent into repeatable processes. Spatial design and brand expression then communicate the structure to guests through physical experience.

When these layers reinforce one another, the concept becomes stable. Design decisions occur with clear constraints. Operational planning follows the logic of the concept rather than reacting to it. Brand expression reflects the underlying structure instead of compensating for its absence.

This alignment allows the project to move into implementation with minimal structural revision. The primary work shifts from defining the concept to translating it into operational systems, spatial experience, and brand expression.

The next step is controlled execution: converting the defined structure into a functioning restaurant environment.`
    };

}