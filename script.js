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
    }
};

async function loadStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        allStreams = data.data || [];
        renderGrid(allStreams);
    } catch (e) { document.getElementById('status').innerText = "Помилка API"; }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    document.getElementById('status').innerText = streams.length > 0 ? `Онлайн: ${streams.length}` : "Немає стрімів";
    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `<div class="card"><a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none;color:white"><img src="${thumb}"><div class="info" style="padding:15px"><b>${s.user_name}</b><br><small style="color:#adadb8">${s.game_name}</small></div></a></div>`;
    });
}

async function renderHall() {
    const awards2024 = [
        { login: "leb1ga", nom: "СТРИМЕР РОКУ", type: "p" },
        { login: "dobra_divka", nom: "СТРИМЕРКА РОКУ", type: "p" },
        { login: "otoysounds", nom: "ДЕБЮТ РОКУ", type: "p" },
        { title: "S.T.A.L.K.E.R. 2", nom: "ГРА РОКУ", type: "o", file: "stalker-2-heart-of-chornobyl.webp" }
    ];

    const awards2025 = [
        { login: "roolex9", nom: "СТРИМЕР РОКУ", type: "p" },
        { login: "sheisfoxy", nom: "СТРИМЕРКА РОКУ", type: "p" },
        { title: "Мафія", nom: "КРАЩЕ ШОУ", type: "o", file: "mafiia-zi-strimerami-leb1ga.webp" },
        { title: "Виживання", nom: "КОЛАБОРАЦІЯ", type: "o", file: "vizivannia-24-godini-v-lisi-leb1ga-luzan.webp" }
    ];

    const logins = [...new Set([...awards2024, ...awards2025].filter(a => a.type === "p").map(a => a.login))];
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${logins.join('&login=')}`, {
        headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
    });
    const userData = await res.json();
    const avatars = {};
    userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

    const fill = (id, data) => {
        const container = document.getElementById(id);
        container.innerHTML = '';
        data.forEach(item => {
            let img = item.type === 'p' ? `<img src="${avatars[item.login]}" class="award-avatar">` : `<img src="${item.file}" class="award-poster">`;
            container.innerHTML += `<div class="award-card"><span class="nomination-text">${item.nom}</span>${img}<div class="winner-name">${item.login || item.title}</div></div>`;
        });
    };
    fill('hall-2024', awards2024);
    fill('hall-2025', awards2025);
}
