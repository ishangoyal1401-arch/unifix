// --- STATE MANAGEMENT ---
let issues = [];
let notifications = [];
const currentUser = 'Ishan';

// Initialize App
function initApp() {
    const storedIssues = localStorage.getItem('unifix_issues');
    if (storedIssues) {
        issues = JSON.parse(storedIssues);
    } else {
        loadDemoData();
    }
    
    // Auto-update priorities based on time
    issues.forEach(i => i.priority = calculatePriority(i));
    saveData();
    
    setupNavigation();
    setupEventListeners();
    updateUI();
}

function loadDemoData() {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString();
    
    issues = [
        { id: 'UX1001', title: 'Wi-Fi Not Working', category: '📶 Wi-Fi', location: 'Block B', room: '2nd Floor', desc: 'Wi-Fi connection is unavailable in the entire corridor.', severity: 'High', affected: 14, upvotes: 14, status: 'Work Started', reportedBy: currentUser, date: twoDaysAgo, history: { reported: twoDaysAgo, assigned: now.toISOString(), work: now.toISOString(), fixed: null }, image: '' },
        { id: 'UX1002', title: 'Broken Fan', category: '❄️ AC / Fan', location: 'Block A', room: 'Room 204', desc: 'Fan making loud noise and not spinning correctly.', severity: 'High', affected: 32, upvotes: 8, status: 'Assigned', reportedBy: 'Rahul', date: now.toISOString(), history: { reported: now.toISOString(), assigned: now.toISOString(), work: null, fixed: null }, image: '' },
        { id: 'UX1003', title: 'Washroom Tap Leaking', category: '🚿 Washroom', location: 'Block C', room: 'Ground Floor', desc: 'Continuous water leakage from the third tap.', severity: 'Medium', affected: 8, upvotes: 2, status: 'Reported', reportedBy: 'Priya', date: now.toISOString(), history: { reported: now.toISOString(), assigned: null, work: null, fixed: null }, image: '' },
        { id: 'UX1004', title: 'Damaged Classroom Chair', category: '🪑 Furniture', location: 'Block A', room: '1st Floor', desc: 'Chair is broken and dangerous to sit on.', severity: 'Low', affected: 3, upvotes: 0, status: 'Fixed', reportedBy: currentUser, date: twoDaysAgo, history: { reported: twoDaysAgo, assigned: twoDaysAgo, work: twoDaysAgo, fixed: now.toISOString() }, image: '' },
        { id: 'UX1005', title: 'Corridor Lights Not Working', category: '💡 Electricity', location: 'Library', room: '2nd Floor', desc: 'Pitch black in the evening.', severity: 'Critical', affected: 45, upvotes: 22, status: 'In Progress', reportedBy: 'Amit', date: twoDaysAgo, history: { reported: twoDaysAgo, assigned: twoDaysAgo, work: now.toISOString(), fixed: null }, image: '' }
    ];
}

function saveData() {
    localStorage.setItem('unifix_issues', JSON.stringify(issues));
}

// --- LOGIC & CALCULATION ---
function calculatePriority(issue) {
    const sevScores = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    const sevVal = sevScores[issue.severity] || 1;
    
    const daysSince = Math.floor((new Date() - new Date(issue.date)) / (1000 * 60 * 60 * 24));
    
    let score = (sevVal * 25) + (issue.affected * 2) + (issue.upvotes * 2) + (daysSince * 3);
    
    if (score <= 30) return { score, label: '🟢 Low Priority', class: 'text-green' };
    if (score <= 60) return { score, label: '🟡 Medium Priority', class: 'text-yellow' };
    if (score <= 100) return { score, label: '🟠 High Priority', class: 'text-orange' };
    return { score, label: '🔴 Critical Priority', class: 'text-red' };
}

function generateID() {
    return 'UX' + Math.floor(1000 + Math.random() * 9000);
}

// --- NAVIGATION & UI UPDATES ---
function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            navigateTo(target);
        });
    });

    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('nav-links').classList.toggle('active');
    });
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    const link = document.querySelector(`.nav-links a[data-target="${pageId}"]`);
    if(link) link.classList.add('active');
    
    document.getElementById('nav-links').classList.remove('active');
    updateUI();
    window.scrollTo(0,0);
}

function updateUI() {
    renderStats();
    renderIssues();
    renderMyReports();
    renderAdminTable();
    renderHeatmap();
    renderNotifications();
}

// --- RENDER FUNCTIONS ---
function renderStats() {
    const container = document.getElementById('stats-container');
    const total = issues.length;
    const inProgress = issues.filter(i => ['Assigned', 'Work Started', 'In Progress'].includes(i.status)).length;
    const fixed = issues.filter(i => i.status === 'Fixed').length;
    const critical = issues.filter(i => i.priority.label.includes('Critical') || i.priority.label.includes('High')).length;

    container.innerHTML = `
        <div class="stat-card"><h3>${total}</h3><p>Total Reports</p></div>
        <div class="stat-card"><h3>${inProgress}</h3><p>In Progress</p></div>
        <div class="stat-card"><h3>${fixed}</h3><p>Issues Fixed</p></div>
        <div class="stat-card"><h3>${critical}</h3><p>High Priority</p></div>
    `;
}

function renderIssues() {
    const container = document.getElementById('issues-container');
    const searchTerm = document.getElementById('search-issue').value.toLowerCase();
    const filterCat = document.getElementById('filter-category').value;
    const filterStatus = document.getElementById('filter-status').value;

    container.innerHTML = '';
    
    let filtered = issues.filter(i => {
        const matchesSearch = i.title.toLowerCase().includes(searchTerm) || i.desc.toLowerCase().includes(searchTerm);
        const matchesCat = filterCat === 'All' || i.category.includes(filterCat);
        // Normalize status check mapping "In Progress" to "Work Started" and "Assigned"
        let matchesStatus = filterStatus === 'All' || i.status === filterStatus;
        if(filterStatus === 'In Progress' && ['Assigned', 'Work Started'].includes(i.status)) matchesStatus = true;
        
        return matchesSearch && matchesCat && matchesStatus;
    });

    // Sort by priority score
    filtered.sort((a,b) => b.priority.score - a.priority.score);

    filtered.forEach(issue => {
        container.innerHTML += createIssueCard(issue);
    });
}

function renderMyReports() {
    const container = document.getElementById('my-reports-container');
    const myIssues = issues.filter(i => i.reportedBy === currentUser);
    container.innerHTML = myIssues.length ? myIssues.map(i => createIssueCard(i)).join('') : '<p>You have not reported any issues yet.</p>';
}

function createIssueCard(issue) {
    const statusClass = issue.status === 'Work Started' ? 'status-Work' : `status-${issue.status.replace(' ','')}`;
    const dateStr = new Date(issue.date).toLocaleDateString();
    
    // Check if current user has upvoted (using simple array in localStorage for demo)
    const upvotes = JSON.parse(localStorage.getItem('unifix_upvotes') || '[]');
    const isUpvoted = upvotes.includes(issue.id) ? 'active' : '';

    return `
        <div class="issue-card">
            <div class="issue-header">
                <span class="issue-title">${issue.category.split(' ')[0]} ${issue.title}</span>
                <span class="badge-status ${statusClass}">${issue.status}</span>
            </div>
            <div class="issue-meta">
                <span>📍 ${issue.location} - ${issue.room}</span>
                <span>📅 ${dateStr}</span>
            </div>
            <p class="issue-desc">${issue.desc}</p>
            <div class="issue-meta">
                <span>👥 ${issue.affected} affected</span>
                <span class="badge-priority">${issue.priority.label}</span>
            </div>
            <div style="display:flex; justify-content: space-between; margin-top: auto; padding-top: 1rem;">
                <button class="btn-upvote ${isUpvoted}" onclick="upvoteIssue('${issue.id}')">
                    👍 ${issue.upvotes} Upvotes
                </button>
                <button class="btn-secondary" onclick="showIssueDetails('${issue.id}')">View Details</button>
            </div>
        </div>
    `;
}

// --- ACTIONS & EVENTS ---
function setupEventListeners() {
    // Form Submit
    document.getElementById('report-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitIssue();
    });

    // Duplicate Check
    document.getElementById('issue-category').addEventListener('change', checkDuplicate);
    document.getElementById('issue-building').addEventListener('change', checkDuplicate);
    
    // Filters
    document.getElementById('search-issue').addEventListener('input', renderIssues);
    document.getElementById('filter-category').addEventListener('change', renderIssues);
    document.getElementById('filter-status').addEventListener('change', renderIssues);
    
    // Photo Preview
    document.getElementById('issue-photo').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('photo-preview');
                img.src = e.target.result;
                img.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Notifications Toggle
    document.getElementById('notif-icon').addEventListener('click', () => {
        document.getElementById('notif-dropdown').classList.toggle('show');
    });
}

function checkDuplicate() {
    const cat = document.getElementById('issue-category').value;
    const loc = document.getElementById('issue-building').value;
    
    if(!cat || !loc) return;
    
    const dup = issues.find(i => i.category === cat && i.location === loc && i.status !== 'Fixed');
    const warnDiv = document.getElementById('duplicate-warning');
    
    if (dup) {
        warnDiv.classList.remove('hidden');
        document.getElementById('duplicate-details').innerHTML = `
            <strong>Existing Issue:</strong> ${dup.title} (${dup.room}) - 👥 ${dup.affected} affected. 
            <button type="button" class="btn-secondary" style="margin-top: 0.5rem; padding: 0.3rem 0.6rem;" onclick="upvoteIssue('${dup.id}'); navigateTo('issue-board');">Upvote Existing</button>
        `;
    } else {
        warnDiv.classList.add('hidden');
    }
}

function submitIssue() {
    const photoSrc = document.getElementById('photo-preview').src;
    const now = new Date().toISOString();
    
    const newIssue = {
        id: generateID(),
        title: document.getElementById('issue-desc').value.substring(0, 25) + '...',
        category: document.getElementById('issue-category').value,
        location: document.getElementById('issue-building').value,
        room: document.getElementById('issue-room').value,
        desc: document.getElementById('issue-desc').value,
        severity: document.getElementById('issue-severity').value,
        affected: parseInt(document.getElementById('issue-affected').value),
        upvotes: 0,
        status: 'Reported',
        reportedBy: currentUser,
        date: now,
        history: { reported: now, assigned: null, work: null, fixed: null },
        image: photoSrc.length > 100 ? photoSrc : ''
    };
    
    newIssue.priority = calculatePriority(newIssue);
    issues.push(newIssue);
    saveData();
    
    document.getElementById('report-form').reset();
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('duplicate-warning').classList.add('hidden');
    
    showToast(`Issue reported successfully. ID: ${newIssue.id}`);
    navigateTo('issue-board');
}

function upvoteIssue(id) {
    let userUpvotes = JSON.parse(localStorage.getItem('unifix_upvotes') || '[]');
    if (userUpvotes.includes(id)) {
        showToast("You have already upvoted this issue.");
        return;
    }
    
    const issue = issues.find(i => i.id === id);
    if (issue) {
        issue.upvotes += 1;
        issue.priority = calculatePriority(issue);
        userUpvotes.push(id);
        localStorage.setItem('unifix_upvotes', JSON.stringify(userUpvotes));
        saveData();
        updateUI();
        showToast(`Upvoted ${issue.id}. Priority recalculated.`);
    }
}

// --- MODAL & TRACKER ---
function showIssueDetails(id) {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    
    document.getElementById('modal-title').innerText = `${issue.id} - ${issue.title}`;
    
    let html = `
        <div style="margin-bottom: 1rem;">
            <strong>Category:</strong> ${issue.category} <br>
            <strong>Location:</strong> ${issue.location} - ${issue.room} <br>
            <strong>Severity:</strong> ${issue.severity} <br>
            <strong>Affected:</strong> ${issue.affected} students <br>
            <strong>Priority:</strong> <span class="${issue.priority.class}">${issue.priority.label}</span>
        </div>
        <div style="background: var(--bg-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            ${issue.desc}
        </div>
    `;
    if(issue.image) html += `<img src="${issue.image}" style="width:100%; max-height: 200px; object-fit: cover; border-radius: 8px;">`;
    
    document.getElementById('modal-content').innerHTML = html;
    
    // Update Tracker
    const states = ['Reported', 'Assigned', 'Work Started', 'Fixed'];
    const histKeys = ['reported', 'assigned', 'work', 'fixed'];
    
    let reached = true;
    for(let i=0; i<4; i++) {
        const step = document.getElementById(`step-${histKeys[i]}`);
        const line = document.getElementById(`line-${i}`); // line-1, line-2, line-3
        const timeEl = document.getElementById(`time-${histKeys[i]}`);
        
        const timestamp = issue.history[histKeys[i]];
        if(timestamp) {
            step.classList.add('active');
            timeEl.innerText = new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            if(line) line.classList.add('active');
        } else {
            step.classList.remove('active');
            timeEl.innerText = 'Pending';
            if(line) line.classList.remove('active');
        }
    }
    
    document.getElementById('issue-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('issue-modal').classList.remove('active');
}

// --- HEATMAP ---
function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    const locations = ['Block A', 'Block B', 'Block C', 'Library', 'Cafeteria', 'Hostel', 'Sports Complex'];
    
    container.innerHTML = '';
    
    locations.forEach(loc => {
        const locIssues = issues.filter(i => i.location === loc && i.status !== 'Fixed');
        const count = locIssues.length;
        
        let heatClass = 'heat-low';
        if(count > 1 && count <= 3) heatClass = 'heat-med';
        else if (count > 3 && count <= 5) heatClass = 'heat-high';
        else if (count > 5) heatClass = 'heat-crit';
        
        if(count === 0) heatClass = 'bg-green'; // Default safe color

        container.innerHTML += `
            <div class="heat-box ${heatClass}" onclick="showToast('${loc}: ${count} active issues')">
                ${loc}
                <small style="font-weight: normal; margin-top: 0.3rem">${count} issues</small>
            </div>
        `;
    });
}

// --- ADMIN / MAINTENANCE ---
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';
    
    issues.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(issue => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${issue.id}</strong></td>
                <td>${issue.title}</td>
                <td>${issue.location}</td>
                <td>${issue.priority.label}</td>
                <td>
                    <select class="admin-select" onchange="updateStatus('${issue.id}', this.value)">
                        <option value="Reported" ${issue.status === 'Reported' ? 'selected' : ''}>Reported</option>
                        <option value="Assigned" ${issue.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="Work Started" ${issue.status === 'Work Started' ? 'selected' : ''}>Work Started</option>
                        <option value="Fixed" ${issue.status === 'Fixed' ? 'selected' : ''}>Fixed</option>
                    </select>
                </td>
                <td><button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="showIssueDetails('${issue.id}')">View</button></td>
            </tr>
        `;
    });
}

function updateStatus(id, newStatus) {
    const issue = issues.find(i => i.id === id);
    if(issue && issue.status !== newStatus) {
        issue.status = newStatus;
        const now = new Date().toISOString();
        
        // Update history tracking
        if(newStatus === 'Assigned') issue.history.assigned = now;
        if(newStatus === 'Work Started') { 
            if(!issue.history.assigned) issue.history.assigned = now; // auto fill previous
            issue.history.work = now;
        }
        if(newStatus === 'Fixed') {
            if(!issue.history.assigned) issue.history.assigned = now;
            if(!issue.history.work) issue.history.work = now;
            issue.history.fixed = now;
        }
        
        addNotification(`Status for ${id} changed to ${newStatus}`);
        saveData();
        updateUI();
        showToast(`${id} marked as ${newStatus}`);
    }
}

// --- UTILS ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function addNotification(text) {
    notifications.unshift({ text, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    renderNotifications();
}

function renderNotifications() {
    const drop = document.getElementById('notif-dropdown');
    const badge = document.getElementById('notif-badge');
    
    badge.innerText = notifications.length;
    badge.style.display = notifications.length ? 'block' : 'none';
    
    drop.innerHTML = notifications.length ? notifications.map(n => `
        <div class="notif-item">
            <strong>${n.text}</strong><br>
            <small class="text-muted">${n.time}</small>
        </div>
    `).join('') : '<div class="notif-item">No new notifications</div>';
}

// Boot up
window.onload = initApp;
// --- GENERATIVE AI INTEGRATION ---



document.getElementById('ai-magic-btn').addEventListener('click', async () => {
    const desc = document.getElementById('issue-desc').value;
    const btn = document.getElementById('ai-magic-btn');
    
    if (!desc || desc.length < 10) {
        showToast("Please write a bit more description for the AI to analyze!");
        return;
    }

    btn.innerText = "⏳ AI is analyzing...";
    btn.disabled = true;

    try {
        // We tell the AI exactly how to read the issue and what to give us back
        const prompt = `
        You are a smart campus maintenance AI. Read the following issue reported by a student:
        "${desc}"
        
        Analyze it and return ONLY a valid JSON object with these exactly 3 keys:
        1. "title": A short, clear title for the issue (max 5 words).
        2. "category": Must be exactly one of these: "🪑 Furniture", "💡 Electricity", "🚿 Washroom", "📶 Wi-Fi", "🧹 Cleaning", "❄️ AC / Fan", "🔧 Other".
        3. "severity": Must be exactly one of these based on danger/urgency: "Low", "Medium", "High", "Critical".
        Do not include markdown tags like \`\`\`json.
        `;

        // Call the Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // Extract the AI's answer
        const aiText = data.candidates[0].content.parts[0].text.trim();
        
        // Remove any accidental markdown code block formatting the AI might return
        const cleanJsonString = aiText.replace(/```json/g, '').replace(/```/g, '');
        const aiResult = JSON.parse(cleanJsonString);

        // Auto-fill the HTML form with the AI's brain power!
        document.getElementById('issue-title').value = aiResult.title;
        document.getElementById('issue-category').value = aiResult.category;
        document.getElementById('issue-severity').value = aiResult.severity;

        showToast("✨ AI successfully filled out the details!");

    } catch (error) {
        console.error(error);
        showToast("AI analysis failed. Please select manually.");
    } finally {
        btn.innerText = "✨ Use AI to Auto-Fill Details";
        btn.disabled = false;
    }
});

// Update your submitIssue() function so it grabs the new title input instead of making one up:
// Find the line inside submitIssue() that looks like: title: document.getElementById('issue-desc').value.substring(0, 25) + '...',
// Replace it with: title: document.getElementById('issue-title').value,
// ===== UnifiX AI Chatbot =====

(() => {
    const toggle = document.getElementById("chat-toggle");
    const close = document.getElementById("chat-close");
    const windowEl = document.getElementById("chat-window");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");

    if (!toggle || !close || !windowEl || !form || !input || !messages) {
        console.error("UnifiX chatbot HTML elements are missing.");
        return;
    }

    toggle.addEventListener("click", () => {
        windowEl.classList.toggle("chat-hidden");
        if (!windowEl.classList.contains("chat-hidden")) {
            input.focus();
        }
    });

    close.addEventListener("click", () => {
        windowEl.classList.add("chat-hidden");
    });

    function addMessage(text, type) {
        const message = document.createElement("div");
        message.className =
            type === "user" ? "user-message" : "bot-message";

        // textContent prevents user input from being treated as HTML.
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    function getCampusAnswer(question) {
        const q = question.toLowerCase();

        if (q.includes("report") || q.includes("submit")) {
            return "To report a campus issue, open Report Issue, describe the problem, select its category and severity, add the location, and submit it.";
        }

        if (q.includes("status") || q.includes("track")) {
            return "Open My Reports or the Issue Board to check reported issues and their displayed status.";
        }

        if (q.includes("urgent") || q.includes("emergency") ||
            q.includes("danger") || q.includes("fire")) {
            return "For immediate danger, contact campus security or the appropriate emergency service first. You can also report the issue on UnifiX.";
        }

        if (q.includes("category") || q.includes("type of issue")) {
            return "Choose the category that best describes the problem, such as electrical, plumbing, cleanliness, infrastructure, or another available category.";
        }

        if (q.includes("hello") || q.includes("hi") ||
            q.includes("hey")) {
            return "Hey! 👋 Tell me what's happening on campus, and I'll try to help.";
        }

        if (q.includes("unifix") || q.includes("unifix")) {
            return "UnifiX helps students report campus problems and follow their progress toward resolution.";
        }

        return "I can help with reporting campus issues, checking report status, choosing issue categories, and understanding how UnifiX works. What would you like to know?";
    }

    // Set this to your deployed backend URL to enable generative AI.
    // Leave empty to use the built-in campus-support answers.
    const CHAT_API_URL = "";

    async function getReply(question) {
        if (!CHAT_API_URL) {
            return getCampusAnswer(question);
        }

        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", text: question }]
            })
        });

        if (!response.ok) {
            throw new Error("Chat service returned an error.");
        }

        const data = await response.json();

        if (!data.reply) {
            throw new Error("No reply received from chat service.");
        }

        return data.reply;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = input.value.trim();
        if (!question) return;

        addMessage(question, "user");
        input.value = "";
        input.disabled = true;

        const loading = addMessage("Thinking...", "bot");

        try {
            const reply = await getReply(question);
            loading.textContent = reply;
        } catch (error) {
            console.error("Chatbot error:", error);
            loading.textContent =
                "Sorry, I couldn't connect right now. Please try again.";
        } finally {
            input.disabled = false;
            input.focus();
            messages.scrollTop = messages.scrollHeight;
        }
    });
})();
