const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let accessToken = localStorage.getItem('twitch_access_token');
let onlineStreams = [];

// Дані Залу Слави з типами контенту
const awardsData = [
    {
        year: 2025,
        winners: [
            { nom: "Стример року", login: "roolex9", type: "person" },
            { nom: "Стримерка року", login: "sheisfoxy", type: "person" },
            { nom: "Дебют року", login: "valentinopradagucci", type: "person" },
            { nom: "Non-gaming стример", login: "leb1ga", type: "person" },
            { nom: "Кращий стример з CS2", login: "leb1ga", type: "person" },
            { nom: "Кращий стрімер з Dota 2", login: "ghostik", type: "person" },
            { nom: "VTuber року", login: "luma_rum", type: "person" },
            { nom: "Завжди в етері", login: "guthriee", type: "person" },
            { nom: "Краще шоу на етерах", login: "leb1ga", type: "show", title: "Мафія зі стрімерами" },
            { nom: "Колаборація року", login: "leb1ga", type: "show", title: "Виживання 24 години в лісі" },
            { nom: "Марафон року", login: "leb1ga", type: "show", title: "Марафон схуднення" },
            { nom: "Гра року серед стрімерів", type: "game", title: "Counter-Strike 2", appId: "730" },
            { nom: "Кіберспортивна гра року", type: "game", title: "Counter-Strike 2", appId: "730" },
            { nom: "Вибір спільноти", login: "thetremba", type: "person" }
        ]
    },
    {
        year: 2024,
        winners: [
            { nom: "Стример року", login: "leb1ga", type: "person" },
            { nom: "Стримерка року", login: "dobra_divka", type: "person" },
            { nom: "Дебют року", login: "otoysounds", type: "person" },
            { nom: "Стример IRL", login: "leb1ga", type: "person" },
            { nom: "Кращий стример з CS2", login: "leniniw", type: "person" },
            { nom: "Кращий стример з Dota 2", login: "ghostik", type: "person" },
            { nom: "VTuber року", login: "luma_rum", type: "person" },
            { nom: "Краще шоу", login: "leb1ga", type: "show", title: "Стрім Тур Селами" },
            { nom: "Гра року серед стрімерів", type: "game", title: "S.T.A.L.K.E.R. 2: Heart of Chornobyl", appId: "1643320" },
            { nom: "Кіберспортивна гра року", type: "game", title: "Counter-Strike", appId: "730" }
        ]
    }
];

window.onload = function() {
    // Авторизація
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('access_token')) {
        accessToken = params.get('access_token');
        localStorage.setItem('twitch_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken) {
        loadInitialStreams();
        loadUserProfile();
    }

    // Навігація
    document.getElementById('show-main').onclick = () => {
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('hall-of-fame').style.display = 'none';
    };

    document.getElementById('show-hall').onclick = () => {
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('hall-of-fame').style.display = 'block';
        renderHall();
    };

    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };

    async function loadInitialStreams() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            onlineStreams = data.data || [];
            render(onlineStreams);
        } catch (e) { document.getElementById('status').textContent = "Помилка завантаження."; }
    }

    function render(streams) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        document.getElementById('status').textContent = `Зараз в ефірі (UA): ${streams.length}`;
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '440').replace('{height}', '248');
            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb}">
                        <span class="live-label">LIVE</span>
                        <div class="info">
                            <b>${s.user_name}</b><br>
                            <small style="color:#adadb8;">${s.game_name}</small><br>
                            <small>👥 ${s.viewer_count.toLocaleString()}</small>
                        </div>
                    </a>
                </div>`;
        });
    }

    async function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '<p style="text-align:center;">Завантаження легенд...</p>';
        
        // Збираємо логіни людей для аватарок
        const personLogins = [...new Set(awardsData.flatMap(y => y.winners.filter(w => w.type === 'person').map(w => w.login)))];
        
        try {
            const res = await fetch(`https://api.twitch.tv/helix/users?login=${personLogins.join('&login=')}`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const userData = await res.json();
            const avatars = {};
            userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

            container.innerHTML = '';
            awardsData.forEach(yearSec => {
                let html = `<h2 class="hall-title">🏆 ПЕРЕМОЖЦІ STREAM AWARDS ${yearSec.year}: UKRAINIAN EDITION 🏆</h2><div class="hall-grid">`;
                
                yearSec.winners.forEach(w => {
                    let mediaHtml = '';
                    // Логіка вибору картинки
                    if (w.type === 'person') {
                        mediaHtml = `<img src="${avatars[w.login] || ''}" class="award-avatar">`;
                    } else if (w.type === 'game') {
                        // Використовуємо постери зі Steam для ігор
                        mediaHtml = `<img src="https://cdn.akamai.steamstatic.com/steam/apps/${w.appId}/header.jpg" class="award-poster">`;
                    } else if (w.type === 'show') {
                        // Для шоу можна не ставити картинку або ставити заглушку
                        mediaHtml = `<div class="award-poster" style="background:#222; display:flex; align-items:center; justify-content:center; color:#555; font-size:2rem;">🎬</div>`;
                    }

                    const link = w.login ? `https://twitch.tv/${w.login}` : '#';
                    html += `
                        <a href="${link}" target="_blank" class="award-card">
                            ${mediaHtml}
                            <span class="nomination-text">${w.nom}</span>
                            <div class="winner-name">${w.title || w.login}</div>
                        </a>`;
                });
                container.innerHTML += html + '</div>';
            });
        } catch (e) { container.innerHTML = "Помилка завантаження аватарок."; }
    }

    async function loadUserProfile() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (data.data && data.data[0]) {
                const u = data.data[0];
                document.getElementById('auth-container').innerHTML = `<img src="${u.profile_image_url}" width="35" style="border-radius:50%; border:2px solid #9146ff; cursor:pointer;" title="${u.display_name}">`;
            }
        } catch (e) {}
    }

    // Миттєвий пошук
    document.getElementById('search-input').oninput = (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = onlineStreams.filter(s => s.user_name.toLowerCase().includes(q) || s.game_name.toLowerCase().includes(q));
        render(filtered);
    };
};
