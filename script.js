const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');
let allStreams = [];

window.onload = function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    document.getElementById('search-input').oninput = (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allStreams.filter(s => s.user_name.toLowerCase().includes(query));
        renderGrid(filtered);
    };

    document.getElementById('btn-home').onclick = () => {
        document.getElementById('main-section').style.display = 'block';
        document.getElementById('hall-section').style.display = 'none';
    };

    document.getElementById('btn-hall').onclick = () => {
        document.getElementById('main-section').style.display = 'none';
        document.getElementById('hall-section').style.display = 'block';
        renderHall();
    };

    if (!accessToken) {
        document.getElementById('login-btn').onclick = () => {
            window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        };
    } else {
        loadStreams();
        loadUserProfile();
    }
};

async function loadUserProfile() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/users', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (data.data[0]) {
            const user = data.data[0];
            document.getElementById('auth-container').innerHTML = `
                <div class="user-profile">
                    <img src="${user.profile_image_url}" width="35">
                    <span style="font-size:12px">${user.display_name}</span>
                </div>`;
        }
    } catch (e) {}
}

async function loadStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        allStreams = data.data || [];
        renderGrid(allStreams);
    } catch (e) {}
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    document.getElementById('status').innerText = streams.length > 0 ? `Онлайн: ${streams.length}` : "Стрімерів не знайдено";
    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none;color:inherit">
                    <img src="${thumb}">
                    <div class="info"><b>${s.user_name}</b><br><small>${s.game_name}</small></div>
                </a>
            </div>`;
    });
}

async function renderHall() {
    const awards2024 = [
        { login: "leb1ga", nom: "СТРИМЕР РОКУ" },
        { login: "dobra_divka", nom: "СТРИМЕРКА РОКУ" },
        { login: "leniniw", nom: "КРАЩИЙ З CS2" },
        { login: "ghostik", nom: "КРАЩИЙ З DOTA 2" },
        { login: "otoysounds", nom: "ДЕБЮТ РОКУ" },
        { title: "S.T.A.L.K.E.R. 2", nom: "ГРА РОКУ", file: "stalker-2-heart-of-chornobyl.webp" }
    ];

    const awards2025 = [
        { login: "roolex9", nom: "СТРИМЕР РОКУ" },
        { login: "sheisfoxy", nom: "СТРИМЕРКА РОКУ" },
        { login: "guthriee", nom: "ЗАВЖДИ В ЕТЕРІ" },
        { login: "thetremba", nom: "ВИБІР СПІЛЬНОТИ" },
        { title: "Мафія", nom: "КРАЩЕ ШОУ", file: "mafiia-zi-strimerami.webp" },
        { title: "Виживання", nom: "КОЛАБОРАЦІЯ", file: "vizivannia-24-godini.webp" },
        { title: "Марафон", nom: "МАРАФОН РОКУ", file: "marafon-sxudnennia.webp" }
    ];

    const logins = [...new Set([...awards2024, ...awards2025].filter(a => a.login).map(a => a.login))];
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${logins.join('&login=')}`, {
        headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
    });
    const userData = await res.json();
    const avatars = {};
    userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

    const fill = (id, data) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        data.forEach(a => {
            let imgHtml = a.login ? `<img src="${avatars[a.login]}" class="award-avatar">` : `<img src="${a.file}" class="award-poster">`;
            el.innerHTML += `<div class="card award-card"><span class="nomination-text">${a.nom}</span>${imgHtml}<div class="winner-name">${a.login || a.title}</div></div>`;
        });
    };
    fill('hall-2024', awards2024);
    fill('hall-2025', awards2025);
}
