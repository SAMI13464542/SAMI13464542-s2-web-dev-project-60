/* =============================================
   KnowYourCyber - breaches.js
   Additional Requirement: Fetch breach data
   from the HaveIBeenPwned public API (v3) and
   display it with filtering, pagination.

   API used: https://haveibeenpwned.com/api/v3/breaches
   No auth key needed for the full breach list endpoint.
   ============================================= */

// -- Config --
const PER_PAGE = 12; // how many cards per page

// -- State --
let allBreaches   = [];   // raw data from API
let filtered      = [];   // after search/filter
let currentPage   = 1;

// -- DOM refs --
const grid        = document.getElementById("breach-grid");
const spinner     = document.getElementById("spinner");
const searchInput = document.getElementById("search");
const filterSel   = document.getElementById("filter-type");
const countEl     = document.getElementById("result-count");
const paginationEl= document.getElementById("pagination");
const modal       = document.getElementById("modal");
const modalBody   = document.getElementById("modal-body");

// -- Boot --
document.addEventListener("DOMContentLoaded", function () {
    fetchBreaches();

    // wire up search + filter (live)
    searchInput.addEventListener("input", handleFilter);
    filterSel.addEventListener("change", handleFilter);

    // close modal on overlay click
    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
    });

    // close modal on Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
    });
});


async function fetchBreaches() {
    showSpinner(true);

    try {
        const response = await fetch("https://haveibeenpwned.com/api/v3/breaches");

        // check the response was actually OK before trying to parse
        if (!response.ok) {
            throw new Error("API returned status " + response.status);
        }

        const data = await response.json();

        // sort newest breach first
        allBreaches = data.sort(function (a, b) {
            return new Date(b.BreachDate) - new Date(a.BreachDate);
        });

        filtered = [...allBreaches];
        renderPage(1);

    } catch (err) {
        // If the API is down or blocked (CORS etc), fall back to demo data
        console.warn("Fetch failed, using fallback data:", err.message);
        allBreaches = getFallbackData();
        filtered    = [...allBreaches];
        renderPage(1);
        showApiWarning();
    } finally {
        showSpinner(false);
    }
}


// =============================================
// FILTER
// Filters by search term (name/domain) and
// optional data-class type dropdown
// =============================================
function handleFilter() {
    const query = searchInput.value.toLowerCase().trim();
    const type  = filterSel.value;

    filtered = allBreaches.filter(function (b) {
        const nameMatch = b.Name.toLowerCase().includes(query) ||
                          b.Domain.toLowerCase().includes(query);

        const typeMatch = type === ""
            ? true
            : b.DataClasses.some(function (dc) {
                return dc.toLowerCase().includes(type.toLowerCase());
            });

        return nameMatch && typeMatch;
    });

    currentPage = 1;
    renderPage(1);
}


// =============================================
// RENDER
// Builds breach cards for the current page
// =============================================
function renderPage(page) {
    currentPage = page;
    grid.innerHTML = "";

    const start   = (page - 1) * PER_PAGE;
    const end     = start + PER_PAGE;
    const pageData = filtered.slice(start, end);

    // result count
    countEl.textContent = "Showing " + (start + 1) + "–" +
        Math.min(end, filtered.length) + " of " + filtered.length + " breaches";

    if (pageData.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No breaches found. Try a different search.</p></div>';
        paginationEl.innerHTML = "";
        return;
    }

    pageData.forEach(function (breach) {
        const card = buildCard(breach);
        grid.appendChild(card);
    });

    buildPagination(filtered.length, page);

    // scroll up slightly so user sees results
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
}


// =============================================
// BUILD CARD
// Returns a DOM element for one breach
// =============================================
function buildCard(breach) {
    const count    = breach.PwnCount;
    const severity = getSeverity(count);

    const card = document.createElement("article");
    card.className = "breach-card severity-" + severity;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "View details for " + breach.Name);

    // format date nicely
    const dateStr = formatDate(breach.BreachDate);

    // trim data classes to first 4 so card stays compact
    const shown   = breach.DataClasses.slice(0, 4);
    const extra   = breach.DataClasses.length - shown.length;

    card.innerHTML = `
        <div class="breach-card-top">
            <span class="breach-name">${escHtml(breach.Name)}</span>
            <span class="badge badge-${severity}">${severity}</span>
        </div>
        <div class="breach-meta">
            <span>📅 ${dateStr}</span>
            <span>🌐 ${escHtml(breach.Domain) || "unknown"}</span>
            <span>👤 ${formatNum(count)} accounts</span>
        </div>
        <p class="breach-desc">${stripHtml(breach.Description)}</p>
        <div class="tags">
            ${shown.map(function (dc) { return '<span class="tag">' + escHtml(dc) + '</span>'; }).join("")}
            ${extra > 0 ? '<span class="tag">+' + extra + ' more</span>' : ""}
        </div>
    `;

    // open modal on click or Enter key
    card.addEventListener("click", function () { openModal(breach); });
    card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") openModal(breach);
    });

    return card;
}


// =============================================
// PAGINATION
// =============================================
function buildPagination(total, current) {
    paginationEl.innerHTML = "";
    const totalPages = Math.ceil(total / PER_PAGE);
    if (totalPages <= 1) return;

    // Prev button
    const prev = makePageBtn("← Prev", current === 1, function () {
        renderPage(current - 1);
    });
    paginationEl.appendChild(prev);

    // Page number buttons — show up to 5 around current
    const range = pageRange(current, totalPages, 5);
    range.forEach(function (p) {
        if (p === "...") {
            const dots = document.createElement("span");
            dots.textContent = "…";
            dots.style.color = "var(--muted)";
            dots.style.padding = "0 4px";
            paginationEl.appendChild(dots);
        } else {
            const btn = makePageBtn(p, false, function () { renderPage(p); });
            if (p === current) btn.classList.add("active");
            paginationEl.appendChild(btn);
        }
    });

    // Next button
    const next = makePageBtn("Next →", current === totalPages, function () {
        renderPage(current + 1);
    });
    paginationEl.appendChild(next);
}

function makePageBtn(label, disabled, onClick) {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    btn.textContent = label;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener("click", onClick);
    return btn;
}

// Returns an array like [1, "...", 4, 5, 6, "...", 20]
function pageRange(current, total, window) {
    const half  = Math.floor(window / 2);
    let start   = Math.max(1, current - half);
    let end     = Math.min(total, start + window - 1);
    start       = Math.max(1, end - window + 1);

    const pages = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push("..."); pages.push(total); }
    return pages;
}


// =============================================
// MODAL
// =============================================
function openModal(breach) {
    const severity = getSeverity(breach.PwnCount);

    modalBody.innerHTML = `
        <button class="modal-close" onclick="closeModal()" aria-label="Close">✕</button>
        <div class="modal-name">${escHtml(breach.Name)}</div>
        <div class="modal-domain">${escHtml(breach.Domain) || "No domain listed"}</div>
        <div class="modal-grid">
            <div class="modal-field">
                <label>Breach Date</label>
                <span>${formatDate(breach.BreachDate)}</span>
            </div>
            <div class="modal-field">
                <label>Date Added to DB</label>
                <span>${formatDate(breach.AddedDate)}</span>
            </div>
            <div class="modal-field">
                <label>Accounts Compromised</label>
                <span>${breach.PwnCount.toLocaleString()}</span>
            </div>
            <div class="modal-field">
                <label>Severity</label>
                <span><span class="badge badge-${severity}">${severity}</span></span>
            </div>
            <div class="modal-field">
                <label>Verified</label>
                <span>${breach.IsVerified ? "✅ Yes" : "❌ No"}</span>
            </div>
            <div class="modal-field">
                <label>Sensitive</label>
                <span>${breach.IsSensitive ? "⚠️ Yes" : "No"}</span>
            </div>
        </div>
        <div class="modal-desc">${stripHtml(breach.Description) || "No description available."}</div>
        <div>
            <label style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);display:block;margin-bottom:6px;">Data Exposed</label>
            <div class="tags">
                ${breach.DataClasses.map(function (dc) { return '<span class="tag">' + escHtml(dc) + '</span>'; }).join("")}
            </div>
        </div>
        <div style="margin-top:1.4rem; padding-top:1.2rem; border-top:1px solid var(--border); font-size:0.82rem; color:var(--muted);">
            💡 <strong style="color:var(--text);">What to do:</strong> Change your password for any account that used the same credentials on ${escHtml(breach.Name)}. Enable two-factor authentication where possible.
        </div>
    `;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
}


// =============================================
// HELPERS
// =============================================

// Classify breach size into severity levels
function getSeverity(count) {
    if (count >= 10000000) return "high";
    if (count >= 500000)   return "med";
    return "low";
}


function formatDate(dateStr) {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Copied from main.js (avoids dependency)
function formatNum(n) {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + "B+";
    if (n >= 1000000)    return (n / 1000000).toFixed(1) + "M+";
    if (n >= 1000)       return (n / 1000).toFixed(0) + "K+";
    return n.toLocaleString();
}

function escHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function stripHtml(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function showSpinner(visible) {
    spinner.style.display = visible ? "flex" : "none";
    grid.style.display    = visible ? "none"  : "grid";
}

function showApiWarning() {
    const warn = document.createElement("p");
    warn.style.cssText = "text-align:center;font-size:0.8rem;color:var(--warn);margin-bottom:1rem;";
    warn.textContent = "⚠ Could not reach live API — showing sample data.";
    grid.parentNode.insertBefore(warn, grid);
}



function getFallbackData() {
    return [
        { Name:"LinkedIn", Domain:"linkedin.com", BreachDate:"2021-06-22", AddedDate:"2021-07-01", PwnCount:700000000, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Passwords","Phone numbers","Names"], Description:"In June 2021, data associated with 700M LinkedIn users was posted for sale online." },
        { Name:"Facebook", Domain:"facebook.com", BreachDate:"2019-04-01", AddedDate:"2021-04-04", PwnCount:533000000, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Phone numbers","Names","Dates of birth","Locations"], Description:"In April 2021, 533M Facebook records were published including phone numbers scraped in 2019." },
        { Name:"Adobe", Domain:"adobe.com", BreachDate:"2013-10-04", AddedDate:"2013-12-04", PwnCount:152445165, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Password hints","Passwords","Usernames"], Description:"In October 2013, 153M Adobe user records were exposed including encrypted passwords and unencrypted hints." },
        { Name:"Yahoo", Domain:"yahoo.com", BreachDate:"2014-01-01", AddedDate:"2016-12-14", PwnCount:500000000, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Passwords","Dates of birth","Names","Phone numbers"], Description:"In 2014, Yahoo suffered a breach exposing data of approximately 500M accounts." },
        { Name:"Canva", Domain:"canva.com", BreachDate:"2019-05-24", AddedDate:"2019-05-29", PwnCount:137272116, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Geographic locations","Names","Passwords","Usernames"], Description:"In May 2019, the design platform Canva suffered a breach exposing 137M records." },
        { Name:"Dropbox", Domain:"dropbox.com", BreachDate:"2012-07-01", AddedDate:"2016-08-31", PwnCount:68648009, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Passwords"], Description:"In mid-2012, Dropbox suffered a data breach exposing 68M user records." },
        { Name:"MySpace", Domain:"myspace.com", BreachDate:"2013-06-11", AddedDate:"2016-05-31", PwnCount:359420698, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Passwords","Usernames"], Description:"In approximately 2013, MySpace suffered a data breach exposing 360M user records." },
        { Name:"Twitter", Domain:"twitter.com", BreachDate:"2022-07-22", AddedDate:"2023-01-12", PwnCount:211524284, IsVerified:true, IsSensitive:false, DataClasses:["Email addresses","Names","Usernames"], Description:"In early 2023, 211M unique email addresses scrapped from Twitter were circulated online." },
    ];
}
