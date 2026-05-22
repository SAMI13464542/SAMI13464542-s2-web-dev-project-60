/* =============================================
   KnowYourCyber - tips.js
   Handles:
   - Password strength checker widget
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    initAccordions();
    initPasswordChecker();
});



function initAccordions() {
    const items = document.querySelectorAll(".accord-item");

    items.forEach(function (item) {
        const btn  = item.querySelector(".accord-btn");
        const body = item.querySelector(".accord-body");

        btn.addEventListener("click", function () {
            const isOpen = item.classList.contains("open");

            // close all others first
            items.forEach(function (other) {
                other.classList.remove("open");
                other.querySelector(".accord-body").style.maxHeight = null;
            });

            // if it wasn't open, open it
            if (!isOpen) {
                item.classList.add("open");
                body.style.maxHeight = body.scrollHeight + "px";
            }
        });
    });

    // open the first item by default
    if (items.length > 0) {
        items[0].classList.add("open");
        items[0].querySelector(".accord-body").style.maxHeight =
            items[0].querySelector(".accord-body").scrollHeight + "px";
    }
}


// =============================================
// PASSWORD STRENGTH CHECKER
// Checks against a set of rules and shows
// a strength bar + hint badges
// =============================================
function initPasswordChecker() {
    const pwInput   = document.getElementById("pw-input");
    const pwToggle  = document.getElementById("pw-toggle");
    const bar       = document.getElementById("strength-bar");
    const label     = document.getElementById("strength-label");
    const hintsEl   = document.getElementById("strength-hints");

    if (!pwInput) return;

    // Rules to check — each has a test function and a label
    const rules = [
        { id: "len",    label: "12+ chars",  test: function (p) { return p.length >= 12; } },
        { id: "upper",  label: "Uppercase",  test: function (p) { return /[A-Z]/.test(p); } },
        { id: "lower",  label: "Lowercase",  test: function (p) { return /[a-z]/.test(p); } },
        { id: "num",    label: "Number",     test: function (p) { return /[0-9]/.test(p); } },
        { id: "sym",    label: "Symbol",     test: function (p) { return /[^A-Za-z0-9]/.test(p); } },
    ];

    // Build hint badges once
    rules.forEach(function (rule) {
        const span = document.createElement("span");
        span.id = "hint-" + rule.id;
        span.className = "hint-badge";
        span.textContent = rule.label;
        hintsEl.appendChild(span);
    });

    // Toggle show/hide password
    pwToggle.addEventListener("click", function () {
        if (pwInput.type === "password") {
            pwInput.type = "text";
            pwToggle.textContent = "🙈";
        } else {
            pwInput.type = "password";
            pwToggle.textContent = "👁";
        }
    });

    // Check on every keystroke
    pwInput.addEventListener("input", function () {
        const pw    = pwInput.value;
        const score = rules.filter(function (r) { return r.test(pw); }).length;

        // Update hint badges
        rules.forEach(function (rule) {
            const badge = document.getElementById("hint-" + rule.id);
            if (rule.test(pw)) {
                badge.classList.add("pass");
            } else {
                badge.classList.remove("pass");
            }
        });

        // Strength levels based on score 0-5
        const levels = [
            { label: "",          color: "",                      pct: 0   },
            { label: "Very weak", color: "#ff4d6d",              pct: 20  },
            { label: "Weak",      color: "#ff7043",              pct: 40  },
            { label: "Fair",      color: "var(--warn)",           pct: 60  },
            { label: "Strong",    color: "#69d14f",              pct: 80  },
            { label: "Very strong", color: "var(--success)",     pct: 100 },
        ];

        const lvl = pw.length === 0 ? levels[0] : levels[score];
        bar.style.width      = lvl.pct + "%";
        bar.style.background = lvl.color;
        label.textContent    = lvl.label;
        label.style.color    = lvl.color;
    });
}
