document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("xR78ZybyHTFUyBXZ8");

    const textarea = document.getElementById("contactMessage");
    const objectiveBlock = document.getElementById("objectiveBlock");
    const objectiveButtons = document.querySelectorAll(".objective-btn");
    const form = document.getElementById("contactForm");
    const submitBtn = document.getElementById("submitBtn");
    const btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
    const btnLoading = submitBtn ? submitBtn.querySelector(".btn-loading") : null;
    const errorBox = document.getElementById("formError");

    // Clear status message when user edits the form again
    const status = document.getElementById("formStatus");

    function clearStatus() {
        if (status) {
            status.style.display = "none";
            status.textContent = "";
        }
    }

    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');

    if (nameInput) nameInput.addEventListener("input", clearStatus);
    if (emailInput) emailInput.addEventListener("input", clearStatus);
    if (textarea) textarea.addEventListener("input", clearStatus);

    objectiveButtons.forEach(btn => {
        btn.addEventListener("click", clearStatus);
    });
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (errorBox) errorBox.style.display = "none";

            // const submitBtn = form.querySelector("button[type='submit']");  <-- Removed this line

            const status = document.getElementById("formStatus");

            // Reset status message
            if (status) {
                status.style.display = "none";
                status.textContent = "";
            }

            // Detect selected objective
            let objectiveText = "";
            const activeObjective = document.querySelector(".objective-btn.is-active");
            // Require objective selection
            if (!activeObjective) {
                if (status) {
                    status.style.display = "block";
                    status.textContent = "Please choose a project mode before continuing.";
                }
                return;
            }

            if (activeObjective) {
                const type = activeObjective.dataset.objective;

                if (type === "direction") {
                    objectiveText = "Objective: Direction-first (Clarity before design)\n";
                }

                if (type === "execution") {
                    objectiveText = "Objective: Execution-first (Design translation)\n";
                }
            }

            const name = form.querySelector('input[name="name"]').value || "";
            const email = form.querySelector('input[name="email"]').value || "";
            let message = textarea ? textarea.value : "";

            // Basic validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!name.trim()) {
                if (status) {
                    status.style.display = "block";
                    status.textContent = "Please enter your name.";
                }
                return;
            }

            if (!emailPattern.test(email)) {
                if (status) {
                    status.style.display = "block";
                    status.textContent = "Please enter a valid email address.";
                }
                return;
            }

            // Include diagnosis summary only if it is not already present in the message
            const report = document.getElementById("diagnosisReport");
            let diagnosisText = "";

            if (
                report &&
                report.innerText.trim() &&
                !message.includes("Diagnosis:") &&
                !message.includes("Interpretation:")
            ) {
                diagnosisText = "\n\n--- Diagnosis Summary ---\n" + report.innerText.trim() + "\n";
            }

            message = "Reply email: " + email + "\n\n" + objectiveText + diagnosisText + message;

            if (submitBtn) {
                submitBtn.disabled = true;
            }

            if (btnLabel) btnLabel.style.display = "none";
            if (btnLoading) btnLoading.style.display = "inline";

            emailjs.send("service_vgrfa1p", "template_prfwr6p", {
                    name: name,
                    email: email,
                    reply_to: email,
                    message: message
                })
                .then(function () {

                    if (btnLoading) btnLoading.style.display = "none";
                    if (btnLabel) {
                        btnLabel.style.display = "inline";
                        btnLabel.textContent = "Message sent";
                    }

                    if (status) {
                        status.style.display = "block";
                        status.textContent =
                            "Message received. Your inquiry has been delivered successfully.";

                        // Scroll to status message for visibility
                        status.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                        // Accessibility focus
                        status.setAttribute("tabindex", "-1");
                        status.focus();
                    }

                    form.reset();

                    // Re-enable form after success so another message can be sent
                    setTimeout(function () {
                        if (submitBtn) submitBtn.disabled = false;
                        if (btnLabel) btnLabel.textContent = "Start the working conversation";
                    }, 2000);

                }, function (error) {

                    console.error("EmailJS error:", error);
                    if (errorBox) {
                        errorBox.style.display = "block";
                        errorBox.textContent = "Sending failed. Please try again in a moment.";
                    }

                    if (submitBtn) submitBtn.disabled = false;
                    if (btnLoading) btnLoading.style.display = "none";
                    if (btnLabel) btnLabel.style.display = "inline";

                    if (status) {
                        status.style.display = "block";
                        status.textContent =
                            "Sending failed. Please try again in a moment.";

                        status.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                    }

                });
        });
    }
    // Objective selector logic
    if (objectiveButtons && textarea) {
        objectiveButtons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                const type = btn.dataset.objective;

                objectiveButtons.forEach(b => b.classList.remove("is-active"));
                btn.classList.add("is-active");

                let prefill = "";

                if (type === "direction") {
                    prefill = "Objective: Direction-first (Clarity before design)\n" +
                        "(I need to align the concept, priorities, and constraints so the design doesn’t drift.)\n\n";
                }

                if (type === "execution") {
                    prefill = "Objective: Execution-first (Design translation)\n" +
                        "(The direction is already defined. I need design execution: identity / website / materials.)\n\n";
                }

                if (!textarea.value.trim()) {
                    textarea.value = prefill;
                }
            });
        });
    }

    const report = document.getElementById("diagnosisReport");
    if (!textarea) return;

    const stored = sessionStorage.getItem("diagnosisResult");
    if (!stored) return;
    if (objectiveBlock) {
        objectiveBlock.style.display = "none";
    }

    try {
        const data = JSON.parse(stored);
        const firstLine = (data && data.text ? String(data.text).split("\n")[0] : "").trim();

        if (report) {
            report.innerHTML = `
      <strong>Diagnosis</strong><br>
      ${data && data.title ? data.title : ""}
      <br><br>
      <strong>Interpretation</strong><br>
      ${firstLine}
      `;
        }

        // Prefill textarea (only if user hasn't started typing)
        if (textarea && !textarea.value.trim()) {
            const prefill = [
                `Diagnosis: ${data && data.title ? data.title : ""}`,
                `Interpretation: ${firstLine}`,
                "",
                "(Optional) Add context below:",
                ""
            ].join("\n");

            textarea.value = prefill;
        }

    } catch (e) {
        console.warn("Diagnosis prefill failed", e);
    }

});