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

    // Пошук у реальному часі
    document.getElementById('search-input').oninput = function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = allStreams.filter(s => 
            s.user_name.toLowerCase().includes(query) || 
            s.game_name.toLowerCase().includes(query)
        );
        renderGrid(filtered);
    };

    // Навігація
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
        document.getElementById('status').innerText = "Будь ласка, увійдіть через Twitch";
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
                    <span>${user.display_name}</span>
                </div>`;
        }
    } catch (e) { console.error("Помилка профілю", e); }
}

async function loadStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        allStreams = data.data || [];
        renderGrid(allStreams);
    } catch (e) { document.getElementById('status').innerText = "Помилка завантаження API"; }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    document.getElementById('status').innerText = streams.length > 0 ? `Стрімерів онлайн: ${streams.length}` : "Нікого не знайдено";
    
    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}">
                    <div class="info">
                        <b>${s.user_name}</b><br>
                        <small style="color:#adadb8">${s.game_name}</small><br>
                        <small>👥 ${s.viewer_count}</small>
                    </div>
                </a>
            </div>`;
    });
}

function renderHall() {
    // Дані за 2024 рік
    const awards2024 = [
        { n: "СТРИМЕР РОКУ", u: "Leb1ga", i: "leb1ga_tour.png" },
        { n: "СТРИМЕРКА РОКУ", u: "Dobra_Divka", i: "logo.png" },
        { n: "ДЕБЮТ РОКУ", u: "OTOYSOUNDS", i: "logo.png" },
        { n: "СТРИМЕР IRL", u: "Leb1ga", i: "leb1ga_tour.png" },
        { n: "КРАЩИЙ СТРИМЕР З CS2", u: "Leniniw", i: "logo.png" },
        { n: "ГРА РОКУ", u: "S.T.A.L.K.E.R. 2", i: "stalker-2-heart-of-chornobyl.webp" }
    ];

    // Дані за 2025 рік
    const awards2025 = [
        { n: "СТРИМЕР РОКУ", u: "roolex9", i: "logo.png" },
        { n: "ЗАВЖДИ В ЕТЕРІ", u: "guthriee", i: "logo.png" },
        { n: "КРАЩЕ ШОУ", u: "Мафія зі стрімерами", i: "mafiia-zi-strimerami-leb1ga.webp" },
        { n: "КОЛАБОРАЦІЯ РОКУ", u: "Виживання 24 години", i: "vizivannia-24-godini-v-lisi-leb1ga-luzan....webp" },
        { n: "МАРАФОН РОКУ", u: "Марафон схуднення", i: "marafon-sxudnennia-leb1ga.webp" },
        { n: "ВИБІР СПІЛЬНОТИ", u: "thetremba", i: "logo.png" }
    ];

    const fillGrid = (id, data) => {
        const container = document.getElementById(id);
        container.innerHTML = '';
        data.forEach(item => {
            container.innerHTML += `
                <div class="card" style="border: 1px solid #333; background: #0e0e10;">
                    <img src="${item.i}" onerror="this.src='https://via.placeholder.com/400x225?text=UA+Twitch'">
                    <div class="info" style="text-align:center;">
                        <p class="nomination">${item.n}</p>
                        <p class="username">${item.u}</p>
                    </div>
                </div>`;
        });
    };

    fillGrid('hall-2024', awards2024);
    fillGrid('hall-2025', awards2025);
}
