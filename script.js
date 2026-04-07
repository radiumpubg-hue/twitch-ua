const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.innerHTML = text;
}

window.onload = function() {
    // Авторизація
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (token) {
        accessToken = token;
        localStorage.setItem('twitch_access_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };

    // Перемикання сторінок
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
        setStatus("Натисніть кнопку 'Увійти' для старту.");
        return;
    }

    loadStreams(); // Завантажити онлайн стріми за замовчуванням

    // --- ПОШУК (ОНЛАЙН + ОФЛАЙН) ---
    let timer;
    document.getElementById('search-input').oninput = (e) => {
        clearTimeout(timer);
        const query = e.target.value.trim();
        if (query.length < 2) return;
        
        timer = setTimeout(async () => {
            setStatus("Шукаємо всюди...");
            try {
                const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=50`, {
                    headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                renderGrid(data.data, false); // false = показувати і офлайн
            } catch (err) { setStatus("Помилка пошуку."); }
        }, 600);
    };
};

async function loadStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.status === 401) { setStatus("Треба перелогінитись."); return; }
        const data = await res.json();
        renderGrid(data.data, true);
    } catch (e) { setStatus("Помилка з'єднання."); }
}

function renderGrid(data, onlyOnline) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    
    if (!data || data.length === 0) {
        setStatus("Нікого не знайдено.");
        return;
    }

    setStatus(onlyOnline ? `Зараз в ефірі (UA): ${data.length}` : "Знайдені канали (UA):");

    data.forEach(s => {
        // У пошуку і в списку стрімів різні назви полів, робимо універсально:
        const login = s.user_login || s.broadcaster_login;
        const name = s.user_name || s.display_name;
        const isLive = onlyOnline ? true : s.is_live;
        const viewers = s.viewer_count ? `👥 ${s.viewer_count}` : 'Офлайн';
        let thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        
        // Якщо це пошук, Twitch дає статичну картинку профілю замість стріму
        if (!onlyOnline && !isLive) thumb = s.thumbnail_url; 

        grid.innerHTML += `
            <div class="card ${!isLive ? 'offline' : ''}">
                <a href="https://twitch.tv/${login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <div class="img-container">
                        <img src="${thumb}" onerror="this.src='https://via.placeholder.com/400x225?text=No+Image'">
                        ${isLive ? '<span class="live-tag">LIVE</span>' : ''}
                    </div>
                    <div class="info">
                        <b>${name}</b><br>
                        <small>${s.game_name || 'Без категорії'}</small><br>
                        <small class="viewers-count">${viewers}</small>
                    </div>
                </a>
            </div>`;
    });
}

function renderHall() {
    // Тут твій код Залу Слави (Award Data), він не мінявся
    document.getElementById('hall-content').innerHTML = "<p>Завантаження легенд...</p>";
}
