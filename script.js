const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let allStreams = []; // Тут будем хранить полный список

window.onload = function() {
    const loginBtn = document.getElementById('login-btn');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    // Авторизация
    loginBtn.onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        loginBtn.textContent = "Ви ввійшли ✅";
        loadStreams(accessToken);
    } else {
        statusText.textContent = "Авторизуйтесь, щоб побачити стрімерів";
    }

    // Функция загрузки
    async function loadStreams(token) {
        statusText.textContent = "Завантаження...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            allStreams = data.data; // Сохраняем всех
            render(allStreams);
        } catch (e) {
            statusText.textContent = "Помилка API";
        }
    }

    // Функция поиска и фильтрации
    function filterStreams() {
        const query = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = allStreams.filter(s => {
            const matchesName = s.user_name.toLowerCase().includes(query) || s.title.toLowerCase().includes(query);
            const matchesCategory = (category === "all") || (s.game_name === category);
            return matchesName && matchesCategory;
        });

        render(filtered);
    }

    // Слушатели событий
    searchInput.oninput = filterStreams;
    categoryFilter.onchange = filterStreams;

    function render(streams) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        statusText.textContent = `Знайдено стрімерів: ${streams.length}`;
        
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb}">
                        <div class="info">
                            <div class="title">${s.title}</div>
                            <div class="name">${s.user_name} • ${s.game_name}</div>
                            <div class="viewers">🔴 ${s.viewer_count.toLocaleString()}</div>
                        </div>
                    </a>
                </div>`;
        });
    }
};
