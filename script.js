// DripTracker - Main Application Code
class DripTracker {
    constructor() {
        console.log('📅 Initializing DripTracker...');
        this.currentDate = new Date();
        this.sessions = this.loadSessions();
        this.settings = this.loadSettings();
        console.log('📊 Loaded data:', { sessions: this.sessions, settings: this.settings });
        this.motivationalMessages = [
            { emoji: '🎯', title: 'Держись, воин!', text: 'Каждый день без побед — это победа над собой' },
            { emoji: '💪', title: 'Ты сильнее!', text: 'Сила воли растет с каждым днем сопротивления' },
            { emoji: '🔥', title: 'Горишь!', text: 'Твоя серия растет — продолжай в том же духе!' },
            { emoji: '🏆', title: 'Чемпион!', text: 'Ты показываешь невероятную силу воли' },
            { emoji: '🌟', title: 'Звезда!', text: 'Твой прогресс вдохновляет окружающих' },
            { emoji: '⚡', title: 'Энергия!', text: 'Канализируй эту энергию в полезные дела' },
            { emoji: '🎨', title: 'Творец!', text: 'Используй освобожденное время для творчества' },
            { emoji: '📚', title: 'Мудрец!', text: 'Самодисциплина — путь к мудрости' }
        ];

        this.init();
    }

    init() {
        this.renderCalendar();
        this.updateStats();
        this.updateMotivation();
        this.bindEvents();
        this.updateUserDisplay();
        this.setupMobileOptimizations();
    }

    setupMobileOptimizations() {
        // Prevent zoom on iOS when focusing inputs
        if (this.isMobile()) {
            const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
            inputs.forEach(input => {
                if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }

        // Add touch feedback
        this.addTouchFeedback();

        // Optimize modal scrolling on mobile
        this.optimizeModalScrolling();
    }

    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    addTouchFeedback() {
        // Add active state for touch devices
        const touchElements = document.querySelectorAll('.day-cell, .action-btn, .session-type, .nav-btn, .settings-btn');

        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.95)';
                element.style.transition = 'transform 0.1s ease';
            });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.style.transform = '';
                }, 100);
            });

            element.addEventListener('touchcancel', () => {
                element.style.transform = '';
            });
        });
    }

    optimizeModalScrolling() {
        // Prevent body scroll when modal is open on mobile
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            modal.addEventListener('show', () => {
                if (this.isMobile()) {
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.width = '100%';
                }
            });

            modal.addEventListener('hide', () => {
                if (this.isMobile()) {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                }
            });
        });
    }

    // Data Management
    loadSessions() {
        const saved = localStorage.getItem('driptracker_sessions');
        let sessions = saved ? JSON.parse(saved) : {};

        // Migrate old format to new format
        sessions = this.migrateSessions(sessions);

        return sessions;
    }

    migrateSessions(sessions) {
        const migrated = {};

        Object.keys(sessions).forEach(dateString => {
            const session = sessions[dateString];

            // Check if it's old format (object with count/timestamp)
            if (session.count !== undefined || session.timestamp !== undefined) {
                migrated[dateString] = [];

                // Convert old sessions to new format
                const count = session.count || 1;
                for (let i = 0; i < count; i++) {
                    migrated[dateString].push({
                        type: 'full',
                        timestamp: session.timestamp || new Date().toISOString(),
                        time: new Date(session.timestamp || new Date()).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    });
                }
            } else if (Array.isArray(session)) {
                // Already new format
                migrated[dateString] = session;
            }
        });

        return migrated;
    }

    saveSessions() {
        localStorage.setItem('driptracker_sessions', JSON.stringify(this.sessions));
    }

    // Session types configuration
    getSessionTypes() {
        return {
            full: { icon: '💦', name: 'Кончил', color: 'session' },
            edge: { icon: '🌊', name: 'На грани', color: 'session-edge' },
            half: { icon: '💧', name: 'Не до конца', color: 'session-half' },
            peek: { icon: '👀', name: 'Только смотрел', color: 'session-peek' }
        };
    }

    loadSettings() {
        const saved = localStorage.getItem('driptracker_settings');
        return saved ? JSON.parse(saved) : {
            username: '',
            isPublic: false,
            goalDays: 7
        };
    }

    saveSettings() {
        localStorage.setItem('driptracker_settings', JSON.stringify(this.settings));
    }

    // Calendar Functions
    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('monthYear');

        console.log('Rendering calendar...', calendarGrid, monthYear);

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Set month/year header
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        monthYear.textContent = `${monthNames[month]} ${year}`;

        // Clear calendar
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Calculate first day and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Adjust for Monday start (getDay() returns 0 for Sunday)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        // Add empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell other-month';
            calendarGrid.appendChild(emptyCell);
        }

        // Add days of current month
        const today = new Date();
        const todayString = this.formatDate(today);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = day;

            const cellDate = new Date(year, month, day);
            const dateString = this.formatDate(cellDate);

            // Simple string comparison using same formatDate function
            const todayString = this.formatDate(today);
            const isToday = dateString === todayString;
            const isFuture = dateString > todayString;
            const isPast = dateString < todayString;

            console.log(`Day ${day}:`, {
                dateString,
                todayString,
                isToday,
                isFuture,
                isPast
            });

            // Check if today
            if (isToday) {
                dayCell.classList.add('today');
            }

            // Check if future date
            if (isFuture) {
                dayCell.classList.add('future');
            }

            // Check if past date
            if (isPast) {
                dayCell.classList.add('past');
            }

            // Check if has sessions
            if (this.sessions[dateString] && this.sessions[dateString].length > 0) {
                const sessions = this.sessions[dateString];
                const sessionCount = sessions.length;

                // Add session class based on dominant type or multiple
                if (sessionCount > 1) {
                    dayCell.classList.add('session-multiple');
                } else {
                    const sessionType = sessions[0].type || 'full';
                    const sessionTypes = this.getSessionTypes();
                    dayCell.classList.add(sessionTypes[sessionType].color);
                }

                // Add count indicator for multiple sessions
                if (sessionCount > 1) {
                    dayCell.classList.add('session-count');
                    dayCell.setAttribute('data-count', sessionCount);
                }

                // Add main emoji indicator
                const dominantType = this.getDominantSessionType(sessions);
                const sessionTypes = this.getSessionTypes();
                dayCell.dataset.emoji = sessionTypes[dominantType].icon;
            }

            // Add click handler (only for today)
            if (isToday) {
                dayCell.addEventListener('click', () => this.openSessionModal(dateString));
                dayCell.style.cursor = 'pointer';
            } else {
                dayCell.style.cursor = 'not-allowed';
            }

            calendarGrid.appendChild(dayCell);
        }
    }

    openSessionModal(dateString) {
        // Check if trying to open modal for non-today date
        const today = new Date();
        const todayString = this.formatDate(today);

        console.log('Opening modal for:', {
            dateString,
            todayString,
            isToday: dateString === todayString
        });

        if (dateString !== todayString) {
            this.showMessage('⚠️ Можно добавлять сессии только на сегодня!', 'error');
            return;
        }

        this.currentSessionDate = dateString;
        const date = new Date(dateString);
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        document.getElementById('sessionDate').textContent = date.toLocaleDateString('ru-RU', options);
        this.updateCurrentSessions(dateString);
        document.getElementById('sessionModal').classList.add('active');
    }

    addSession(dateString, type) {
        if (!this.sessions[dateString]) {
            this.sessions[dateString] = [];
        }

        const session = {
            type: type,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };

        this.sessions[dateString].push(session);
        this.saveSessions();
        this.renderCalendar();
        this.updateStats();
        this.updateMotivation();
        this.updateCurrentSessions(dateString);

        const sessionTypes = this.getSessionTypes();
        this.showMessage(`${sessionTypes[type].icon} ${sessionTypes[type].name} добавлен!`, 'success');
    }

    removeSession(dateString, sessionIndex) {
        if (this.sessions[dateString] && this.sessions[dateString][sessionIndex]) {
            this.sessions[dateString].splice(sessionIndex, 1);

            if (this.sessions[dateString].length === 0) {
                delete this.sessions[dateString];
            }

            this.saveSessions();
            this.renderCalendar();
            this.updateStats();
            this.updateMotivation();
            this.updateCurrentSessions(dateString);
            this.showMessage('🗑️ Сессия удалена', 'success');
        }
    }

    updateCurrentSessions(dateString) {
        const container = document.getElementById('currentSessions');
        const sessions = this.sessions[dateString] || [];

        if (sessions.length === 0) {
            container.innerHTML = '';
            return;
        }

        const sessionTypes = this.getSessionTypes();
        let html = '<h4>Сессии на этот день:</h4>';

        sessions.forEach((session, index) => {
            const type = sessionTypes[session.type] || sessionTypes.full;
            html += `
                <div class="session-item">
                    <div class="session-item-info">
                        <div class="session-item-icon">${type.icon}</div>
                        <div>
                            <div class="session-item-text">${type.name}</div>
                            <div class="session-item-time">${session.time}</div>
                        </div>
                    </div>
                    <button class="delete-session" onclick="dripTracker.removeSession('${dateString}', ${index})">
                        🗑️
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getDominantSessionType(sessions) {
        if (!sessions || sessions.length === 0) return 'full';

        // Count session types
        const typeCounts = {};
        sessions.forEach(session => {
            const type = session.type || 'full';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        // Return most frequent type
        let maxCount = 0;
        let dominantType = 'full';
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        });

        return dominantType;
    }

    addTodaySession() {
        const today = new Date();
        const dateString = this.formatDate(today);
        this.openSessionModal(dateString);
    }

    // Statistics
    updateStats() {
        const currentStreak = this.getCurrentStreak();
        const monthlyCount = this.getMonthlyCount();
        const totalCount = this.getTotalCount();
        const lastSession = this.getLastSession();

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('monthlyCount').textContent = monthlyCount;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('lastSession').textContent = lastSession;
    }

    getCurrentStreak() {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = this.formatDate(date);

            if (this.sessions[dateString] && this.sessions[dateString].length > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getMonthlyCount() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        let count = 0;

        Object.keys(this.sessions).forEach(dateString => {
            const date = new Date(dateString);
            if (date.getFullYear() === year && date.getMonth() === month) {
                count += this.sessions[dateString].length || 0;
            }
        });

        return count;
    }

    getTotalCount() {
        let total = 0;
        Object.values(this.sessions).forEach(sessionArray => {
            total += sessionArray.length || 0;
        });
        return total;
    }

    getLastSession() {
        const dates = Object.keys(this.sessions).filter(date =>
            this.sessions[date] && this.sessions[date].length > 0
        );

        if (dates.length === 0) return '-';

        dates.sort((a, b) => new Date(b) - new Date(a));
        const lastDate = new Date(dates[0]);
        const today = new Date();
        const diffTime = today - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        return `${diffDays} дн. назад`;
    }

    // Motivation System
    updateMotivation() {
        const streak = this.getCurrentStreak();
        const totalSessions = this.getTotalCount();

        let message;

        if (streak === 0 && totalSessions === 0) {
            message = this.motivationalMessages[0]; // Default starting message
        } else if (streak >= 30) {
            message = this.motivationalMessages[7]; // Wise message for long streaks
        } else if (streak >= 14) {
            message = this.motivationalMessages[6]; // Creative message
        } else if (streak >= 7) {
            message = this.motivationalMessages[3]; // Champion message
        } else if (streak >= 3) {
            message = this.motivationalMessages[2]; // Fire message
        } else if (totalSessions >= 50) {
            message = this.motivationalMessages[4]; // Star message for high activity
        } else {
            // Random motivational message
            const randomIndex = Math.floor(Math.random() * this.motivationalMessages.length);
            message = this.motivationalMessages[randomIndex];
        }

        const motivationCard = document.getElementById('motivationCard');
        motivationCard.innerHTML = `
            <div class="motivation-emoji">${message.emoji}</div>
            <div class="motivation-text">
                <h3>${message.title}</h3>
                <p>${message.text}</p>
            </div>
        `;
    }

    // Event Handlers
    bindEvents() {
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateStats();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateStats();
        });

        // Quick actions
        document.getElementById('addSessionBtn').addEventListener('click', () => {
            this.addTodaySession();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal();
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettingsFromModal();
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Share modal
        document.getElementById('closeShare').addEventListener('click', () => {
            this.closeModal('shareModal');
        });

        document.getElementById('copyLink').addEventListener('click', () => {
            this.copyShareLink();
        });

        // Session modal
        document.getElementById('closeSession').addEventListener('click', () => {
            this.closeModal('sessionModal');
        });

        // Session type selection
        document.querySelectorAll('.session-type').forEach(type => {
            type.addEventListener('click', () => {
                const sessionType = type.dataset.type;
                this.addSession(this.currentSessionDate, sessionType);
            });
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Modal Functions
    openSettingsModal() {
        document.getElementById('usernameInput').value = this.settings.username;
        document.getElementById('publicCalendar').checked = this.settings.isPublic;
        document.getElementById('goalDays').value = this.settings.goalDays;

        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        modal.dispatchEvent(new Event('show'));
    }

    openShareModal() {
        const shareLink = this.generateShareLink();
        document.getElementById('shareLink').value = shareLink;

        const modal = document.getElementById('shareModal');
        modal.classList.add('active');
        modal.dispatchEvent(new Event('show'));

        // Показать подсказку о публичности
        if (!this.settings.isPublic) {
            setTimeout(() => {
                this.showMessage('💡 Включи "Публичный календарь" в настройках для отображения имени', 'success');
            }, 500);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        modal.dispatchEvent(new Event('hide'));
    }

    saveSettingsFromModal() {
        this.settings.username = document.getElementById('usernameInput').value;
        this.settings.isPublic = document.getElementById('publicCalendar').checked;
        this.settings.goalDays = parseInt(document.getElementById('goalDays').value);

        this.saveSettings();
        this.updateUserDisplay();
        this.closeModal('settingsModal');
        this.showMessage('⚙️ Настройки сохранены', 'success');
    }

    clearAllData() {
        if (confirm('🗑️ Точно хочешь удалить ВСЕ данные? Это действие нельзя отменить!')) {
            this.sessions = {};
            this.settings = { username: '', isPublic: false, goalDays: 7 };

            localStorage.removeItem('driptracker_sessions');
            localStorage.removeItem('driptracker_settings');

            this.renderCalendar();
            this.updateStats();
            this.updateMotivation();
            this.updateUserDisplay();
            this.closeModal('settingsModal');
            this.showMessage('🗑️ Все данные очищены', 'success');
        }
    }

    updateUserDisplay() {
        const display = document.getElementById('usernameDisplay');
        if (this.settings.username) {
            display.textContent = `${this.settings.username} 😈`;
        } else {
            display.textContent = 'Анонимно 🙈';
        }
    }

    generateShareLink() {
        // Дополнительная отладка
        console.log('📊 Генерация ссылки:', {
            sessions: Object.keys(this.sessions).length,
            isPublic: this.settings.isPublic,
            username: this.settings.username
        });

        const data = {
            sessions: this.sessions,
            username: this.settings.isPublic ? this.settings.username : '',
            timestamp: new Date().toISOString()
        };

        console.log('📊 Данные для ссылки:', data);

        const encoded = btoa(JSON.stringify(data));
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;

        console.log('📊 Готовая ссылка:', shareUrl);

        return shareUrl;
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        shareLink.setSelectionRange(0, 99999);

        try {
            document.execCommand('copy');
            this.showMessage('📋 Ссылка скопирована!', 'success');
        } catch (err) {
            // Fallback for modern browsers
            navigator.clipboard.writeText(shareLink.value).then(() => {
                this.showMessage('📋 Ссылка скопирована!', 'success');
            }).catch(() => {
                this.showMessage('❌ Не удалось скопировать', 'error');
            });
        }
    }

    // Utility Functions
    formatDate(date) {
        // Use local date instead of UTC to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    showMessage(text, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        // Add to body since it's position fixed
        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // Shared Calendar Functions
    loadSharedCalendar() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');

        console.log('🔗 Проверка ссылки:', {
            url: window.location.href,
            hasShareParam: !!shareData,
            shareParam: shareData ? shareData.substring(0, 50) + '...' : null
        });

        if (shareData) {
            try {
                const decoded = JSON.parse(atob(shareData));
                console.log('🔗 Декодированные данные:', {
                    sessionsCount: Object.keys(decoded.sessions || {}).length,
                    username: decoded.username,
                    timestamp: decoded.timestamp
                });
                this.displaySharedCalendar(decoded);
            } catch (error) {
                console.error('🔗 Ошибка декодирования:', error);
                this.showMessage('❌ Некорректная ссылка', 'error');
            }
        } else {
            console.log('🔗 Параметр share не найден в URL');
        }
    }

    displaySharedCalendar(shareData) {
        // Create overlay for shared view
        const overlay = document.createElement('div');
        overlay.className = 'shared-overlay';
        overlay.innerHTML = `
            <div class="shared-modal">
                <div class="shared-header">
                    <h2>📅 Календарь ${shareData.username || 'анонимного'} пользователя</h2>
                    <button class="close-shared">×</button>
                </div>
                <div class="shared-stats">
                    <div class="shared-stat">
                        <span class="emoji">📅</span>
                        <span class="value">${this.calculateSharedActiveDays(shareData.sessions)}</span>
                        <span class="label">Активных дней</span>
                    </div>
                    <div class="shared-stat">
                        <span class="emoji">🔥</span>
                        <span class="value">${this.calculateSharedStreak(shareData.sessions)}</span>
                        <span class="label">Текущая серия</span>
                    </div>
                    <div class="shared-stat">
                        <span class="emoji">💦</span>
                        <span class="value">${this.calculateSharedTotalSessions(shareData.sessions)}</span>
                        <span class="label">Всего сессий</span>
                    </div>
                </div>
                <div class="shared-calendar">
                    <div class="shared-calendar-header">
                        <button class="shared-nav-btn" id="sharedPrevMonth">‹</button>
                        <h3 class="shared-month-year" id="sharedMonthYear"></h3>
                        <button class="shared-nav-btn" id="sharedNextMonth">›</button>
                    </div>
                    <div class="shared-calendar-grid" id="sharedCalendarGrid"></div>
                </div>
                <div class="shared-footer">
                    <button class="btn-primary" onclick="window.location.href = window.location.pathname">
                        🚀 Создать свой календарь
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Initialize shared calendar with current date
        this.sharedCurrentDate = new Date();
        this.sharedSessions = shareData.sessions;

        // Close button
        overlay.querySelector('.close-shared').addEventListener('click', () => {
            overlay.remove();
        });

        // Navigation buttons
        overlay.querySelector('#sharedPrevMonth').addEventListener('click', () => {
            this.sharedCurrentDate.setMonth(this.sharedCurrentDate.getMonth() - 1);
            this.renderSharedCalendar();
        });

        overlay.querySelector('#sharedNextMonth').addEventListener('click', () => {
            this.sharedCurrentDate.setMonth(this.sharedCurrentDate.getMonth() + 1);
            this.renderSharedCalendar();
        });

        // Render initial calendar
        this.renderSharedCalendar();
    }

    calculateSharedStreak(sessions) {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = this.formatDate(date);

            if (sessions[dateString] && sessions[dateString].length > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    calculateSharedActiveDays(sessions) {
        return Object.keys(sessions).filter(date =>
            sessions[date] && sessions[date].length > 0
        ).length;
    }

    calculateSharedTotalSessions(sessions) {
        let total = 0;
        Object.values(sessions).forEach(sessionArray => {
            if (Array.isArray(sessionArray)) {
                total += sessionArray.length;
            }
        });
        return total;
    }

    renderSharedCalendar() {
        const calendarGrid = document.getElementById('sharedCalendarGrid');
        const monthYear = document.getElementById('sharedMonthYear');

        if (!calendarGrid || !monthYear) return;

        const year = this.sharedCurrentDate.getFullYear();
        const month = this.sharedCurrentDate.getMonth();

        // Set month/year header
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        monthYear.textContent = `${monthNames[month]} ${year}`;

        // Clear calendar
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'shared-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Calculate first day and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get first Monday
        let startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(firstDay.getDate() - daysToSubtract);

        // Generate calendar days
        const today = new Date();
        const todayString = this.formatDate(today);

        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);

            const dateString = this.formatDate(cellDate);
            const dayNumber = cellDate.getDate();
            const isCurrentMonth = cellDate.getMonth() === month;
            const isToday = dateString === todayString;

            const dayCell = document.createElement('div');
            dayCell.className = 'shared-day-cell';
            dayCell.textContent = dayNumber;

            // Add classes based on conditions
            if (!isCurrentMonth) {
                dayCell.classList.add('other-month');
            }

            if (isToday) {
                dayCell.classList.add('today');
            }

            // Check for sessions
            const sessionsForDay = this.sharedSessions[dateString];
            if (sessionsForDay && sessionsForDay.length > 0) {
                const dominantType = this.getDominantSessionType(sessionsForDay);
                const sessionTypes = this.getSessionTypes();

                if (sessionTypes[dominantType]) {
                    dayCell.classList.add(sessionTypes[dominantType].color);
                }

                // Add indicator for multiple sessions
                if (sessionsForDay.length > 1) {
                    dayCell.classList.add('session-multiple');
                }
            }

            calendarGrid.appendChild(dayCell);
        }
    }
}



// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🗓️ DripTracker starting...');
    const app = new DripTracker();
    console.log('✅ DripTracker initialized:', app);

    // Check for shared calendar
    app.loadSharedCalendar();

    // Make app globally accessible for debugging
    window.dripTracker = app;

    // Debug functions for testing
    window.testShare = () => {
        console.log('🧪 Тестирование публичного календаря...');
        console.log('📊 Текущие настройки:', app.settings);
        console.log('📅 Количество сессий:', Object.keys(app.sessions).length);

        if (Object.keys(app.sessions).length === 0) {
            console.log('⚠️ Нет сессий для демонстрации. Добавь несколько сессий сначала!');
            app.showMessage('⚠️ Сначала добавь несколько сессий!', 'error');
            return;
        }

        const testUrl = app.generateShareLink();
        console.log('🔗 Тестовая ссылка:', testUrl);

        // Открыть ссылку в новой вкладке для тестирования
        const newTab = window.open(testUrl, '_blank');
        if (newTab) {
            app.showMessage('🚀 Ссылка открыта в новой вкладке', 'success');
        } else {
            app.showMessage('❌ Заблокировано браузером', 'error');
        }
    };

    console.log('🧪 Для тестирования введи в консоли: testShare()');
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('💦 DripTracker готов к работе!');
        }).catch(() => {
            console.log('💦 DripTracker работает без офлайн режима');
        });
    });
}
