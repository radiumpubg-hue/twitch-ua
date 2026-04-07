const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; 
let accessToken = localStorage.getItem('twitch_access_token');
let favorites = JSON.parse(localStorage.getItem('twitch_favorites') || '[]');

// Повні дані переможців зі скріншотів
const awardsData = [
    {
        year: 2025,
        winners: [
            { nom: "Стример року", name: "roolex9" },
            { nom: "Стримерка року", name: "sheisfoxy" },
            { nom: "Дебют року", name: "valentinopradagucci" },
            { nom: "Non-gaming стример", name: "Leb1ga" },
            { nom: "Кращий стример з CS2", name: "Leb1ga" },
            { nom: "Кращий стример з Dota 2", name: "Ghostik" },
            { nom: "VTuber року", name: "luma_rum" },
            { nom: "Завжди в етері", name: "guthriee" },
            { nom: "Вибір спільноти", name: "thetremba" }
        ]
    },
    {
        year: 2024,
        winners: [
            { nom: "Стример року", name: "Leb1ga" },
            { nom: "Стримерка року", name: "Dobra_Divka" },
            { nom: "Дебют року", name: "OTOYSOUNDS" },
            { nom: "Стример IRL", name: "Leb1ga" },
            { nom: "Кращий стример з CS2", name: "Leniniw" },
            { nom: "Кращий стример з Dota 2", name: "Ghostik" },
            { nom: "VTuber року", name: "luma_rum" }
        ]
    }
];

window.onload = function() {
    const mainContent = document.getElementById('main-content');
    const hallOfFame = document.getElementById('hall-of-fame');
    const showMain = document.getElementById('show-main');
    const showHall = document.getElementById('show-hall');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    showMain.onclick = () => {
        mainContent.style.display = 'block'; hallOfFame.style.display = 'none';
        showMain.style.color = 'white'; showHall.style.color = '#adadb8';
    };

    showHall.onclick = () => {
        mainContent.style.display = 'none'; hallOfFame.style.display = 'block';
        showHall.style.color = 'white'; showMain.style.color = '#adadb8';
        renderHall();
    };

    // Авторизація
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const newToken = params.get('access_token');
    if (newToken) {
        accessToken = newToken;
        localStorage.setItem('twitch_access_token', newToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken) { loadUserProfile(); loadInitialStreams(); renderHistory(); }
    else { statusText.textContent = "Будь ласка, авторизуйтесь через Twitch"; }

    document.getElementById('login-btn').onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    async function loadInitialStreams() {
        statusText.textContent = "Завантаження...";
        try {
            const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            onlineStreams = data.data || [];
            applyFilters();
        } catch (e) { statusText.textContent = "Помилка API."; }
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        if (query) searchTwitch(query);
        else {
            const category = categoryFilter.value;
            const filtered = onlineStreams.filter(s => (category === "all") || (s.game_name === category));
            render(filtered);
        }
    }

    async function searchTwitch(query) {
        saveToHistory(query);
        try {
            const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=40`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            renderSearchResults(data.data || []);
        } catch (e) {}
    }

    function render(streams) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        statusText.textContent = `В ефірі: ${streams.length}`;
        streams.sort((a, b) => {
            const aFav = favorites.includes(a.user_login);
            const bFav = favorites.includes(b.user_login);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return b.viewer_count - a.viewer_count;
        }).forEach(s => {
            const isFav = favorites.includes(s.user_login);
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="window.toggleFav('${s.user_login}')">${isFav ? '❤️' : '🤍'}</button>
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}">
                    <div class="info">
                        <div style="font-weight:bold; height:40px; overflow:hidden;">${s.title}</div>
                        <div style="color:#adadb8; font-size:0.85em; margin-top:5px;">${s.user_name}</div>
                        <div style="color:#eb0400; font-weight:bold; margin-top:8px;">🔴 ${s.viewer_count.toLocaleString()}</div>
                    </div>
                </a>`;
            grid.appendChild(card);
        });
    }

    // Рендер Залу Слави
    function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '';
        awardsData.forEach(section => {
            const yearSec = document.createElement('div');
            yearSec.className = 'hall-year-section';
            yearSec.innerHTML = `<h3 class="hall-year-title">${section.year} РІК</h3><div class="hall-grid"></div>`;
            const hallGrid = yearSec.querySelector('.hall-grid');
            
            section.winners.forEach(w => {
                hallGrid.innerHTML += `
                    <a href="https://twitch.tv/${w.name.toLowerCase()}" target="_blank" class="award-card">
                        <span class="award-nomination">${w.nom}</span>
                        <div class="award-winner">${w.name}</div>
                    </a>`;
            });
            container.appendChild(yearSec);
        });
    }

    // Інші допоміжні функції... (toggleFav, saveToHistory, renderHistory, loadUserProfile)
    window.toggleFav = (login) => {
        if (favorites.includes(login)) favorites = favorites.filter(f => f !== login);
        else favorites.push(login);
        localStorage.setItem('twitch_favorites', JSON.stringify(favorites));
        applyFilters();
    };

    function saveToHistory(q) {
        if(q.length < 2) return;
        let h = JSON.parse(localStorage.getItem('search_history') || '[]');
        h = [q, ...h.filter(x => x !== q)].slice(0, 5);
        localStorage.setItem('search_history', JSON.stringify(h));
        renderHistory();
    }

    function renderHistory() {
        const box = document.getElementById('search-history');
        const h = JSON.parse(localStorage.getItem('search_history') || '[]');
        box.innerHTML = h.map(x => `<span onclick="document.getElementById('search-input').value='${x}'; window.dispatchEvent(new Event('input'));" style="background:#1f1f23; padding:5px 12px; border-radius:15px; font-size:0.8em; cursor:pointer; border:1px solid #333;">${x}</span>`).join('');
    }

    async function loadUserProfile() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', { headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` } });
            const data = await res.json();
            if (data.data && data.data[0]) {
                const u = data.data[0];
                document.getElementById('auth-container').innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><img src="${u.profile_image_url}" style="width:32px; border-radius:50%;"><span style="font-weight:bold; font-size:0.85em;">${u.display_name}</span></div>`;
            }
        } catch (e) {}
    }

    searchInput.oninput = () => { clearTimeout(window.searchTimer); window.searchTimer = setTimeout(applyFilters, 600); };
    categoryFilter.onchange = applyFilters;
};
