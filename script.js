const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
// Прямая ссылка на твой репозиторий для Twitch
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/'; 

window.onload = function() {
    const loginBtn = document.getElementById('login-btn');
    const statusText = document.getElementById('status');
    const grid = document.getElementById('streamers-grid');

    console.log("Сайт загружен, ищем кнопку...");

    // 1. ЛОГИКА КНОПКИ
    if (loginBtn) {
        loginBtn.onclick = function() {
            console.log("Нажали на кнопку, переходим на Twitch...");
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
            window.location.href = authUrl;
        };
    }

    // 2. ПРОВЕРКА АВТОРИЗАЦИИ (есть ли токен в ссылке)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        console.log("Токен найден, загружаем стримеров...");
        loginBtn.textContent = "Ви ввійшли ✅";
        loadUAStreams(accessToken);
    } else {
        statusText.textContent = "Натисніть кнопку вище, щоб завантажити стрими";
    }

    // 3. ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ
    async function loadUAStreams(token) {
        statusText.textContent = "Шукаємо українські стрими...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                statusText.textContent = `Зараз в ефірі: ${data.data.length}`;
                render(data.data);
            } else {
                statusText.textContent = "Зараз ніхто не стримить українською 😢";
            }
        } catch (error) {
            console.error("Ошибка API:", error);
            statusText.textContent = "Помилка зв'язку з Twitch.";
        }
    }

    function render(streams) {
        grid.innerHTML = '';
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <a href="https://www.twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}" alt="${s.user_name}">
                    <div style="padding:15px;">
                        <div style="font-weight:bold; margin-bottom:5px;">${s.title}</div>
                        <div style="color:#adadb8; font-size:0.9em;">${s.user_name}</div>
                        <div style="color:#eb0400; font-weight:bold; margin-top:10px;">🔴 ${s.viewer_count.toLocaleString()}</div>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }
};
