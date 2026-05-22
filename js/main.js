/* =============================================
   KnowYourCyber - main.js
   Shared JS across all pages:
   - Sticky nav + mobile hamburger
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
        const linkPage = link.getAttribute("href").split("/").pop();
        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    // --- Mobile hamburger menu toggle ---
    const hamburger = document.getElementById("hamburger");
    const navLinks  = document.getElementById("nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", function () {
            navLinks.classList.toggle("open");
        });

        // close menu when a link is clicked
        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("open");
            });
        });
    }

    const terminalBody = document.getElementById("terminal-body");
    if (terminalBody) {
        runTerminal(terminalBody);
    }

    // --- Stat counters (only on homepage) ---
    const statNums = document.querySelectorAll(".stat-num");
    if (statNums.length > 0) {
        initCounters(statNums);
    }

});


// =============================================
// TERMINAL ANIMATION
// Shows fake scan lines one by one with delays
// =============================================
function runTerminal(container) {

    // Array of lines to display
    const lines = [
        { cls: "",        text: "$ initialising breach scanner..." },
        { cls: "t-ok",    text: "  ✔  connected to KYC database" },
        { cls: "",        text: "$ loading breach index..." },
        { cls: "t-ok",    text: "  ✔  12,400 records loaded" },
        { cls: "t-warn",  text: "  ⚠  47 new breaches this month" },
        { cls: "",        text: "$ checking recent leaks..." },
        { cls: "t-err",   text: "  ✘  Exposure detected: passwords, emails" },
        { cls: "t-warn",  text: "  ⚠  LinkedIn (2024) — 700M records" },
        { cls: "",        text: "$ generating report..." },
        { cls: "t-ok",    text: "  ✔  done. Stay safe out there." },
    ];

    lines.forEach(function (line, i) {
        // each line appears 400ms after the previous
        setTimeout(function () {
            const p = document.createElement("p");
            p.className = "t-line " + line.cls;
            p.textContent = line.text;
            container.appendChild(p);

            // small delay then fade in (CSS transition would need opacity:0 → 1)
            setTimeout(function () {
                p.style.opacity = "1";
                p.style.transition = "opacity 0.3s ease";
            }, 50);
        }, i * 400);
    });
}


// =============================================
// ANIMATED COUNTERS
// Counts up from 0 to target when scrolled into view
// =============================================
function initCounters(elements) {

    // Use IntersectionObserver so it only fires when visible
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target); // only run once
            }
        });
    }, { threshold: 0.5 });

    elements.forEach(function (el) {
        observer.observe(el);
    });
}

function animateCounter(el) {
    const target   = parseInt(el.getAttribute("data-target"), 10);
    const duration = 1800; // ms
    const steps    = 50;
    const increment = target / steps;
    let current    = 0;
    let step       = 0;

    const timer = setInterval(function () {
        step++;
        current = Math.min(Math.round(increment * step), target);
        el.textContent = formatNum(current);

        if (step >= steps) {
            clearInterval(timer);
            el.textContent = formatNum(target); // ensure exact value at end
        }
    }, duration / steps);
}

// Format large numbers: 9300000000 → "9.3B", 12400 → "12,400"
function formatNum(n) {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + "B+";
    if (n >= 1000000)    return (n / 1000000).toFixed(1) + "M+";
    return n.toLocaleString();
}
