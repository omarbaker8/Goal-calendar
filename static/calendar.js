// Calendar Application with Firebase Integration
document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS ---
    const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // --- DOM ELEMENTS ---
    const monthHeadersContainer = document.getElementById('month-headers');
    const calendarGrid = document.getElementById('calendar-grid');
    const themeSelector = document.getElementById('theme-selector');

    // --- STATE MANAGEMENT ---
    let currentState = {};
    let currentTheme = '#111827';

    // --- FIREBASE DATA FUNCTIONS ---

    /**
     * Loads user data from server
     */
    function loadUserData() {
        fetch('/api/load_progress')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentState = data.progress || {};
                    currentTheme = data.theme || '#111827';
                    applyTheme(getThemeByColor(currentTheme));
                    initCalendar();
                    updateThemeSelector();
                    // Hide loading screen when calendar is ready
                    hideLoadingScreen();
                } else {
                    console.error('Error loading user data:', data.error);
                    hideLoadingScreen(); // Hide even on error
                }
            })
            .catch(error => {
                console.error('Error loading user data:', error);
                hideLoadingScreen(); // Hide even on error
            });
    }

    /**
     * Hides the loading screen with smooth transition
     */
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Saves current state and theme to server
     */
    function saveUserData() {
        fetch('/api/save_progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                progress: currentState,
                theme: currentTheme
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving user data:', data.error);
            }
        })
        .catch(error => {
            console.error('Error saving user data:', error);
        });
    }

    // --- THEME MANAGEMENT ---
    const THEMES = [
        { name: 'Dark', color: '#000000ff', isLight: false },
        { name: 'Slate', color: '#506583ff', isLight: false },
        { name: 'Forest', color: '#2d7c52ff', isLight: false },
        { name: 'Wine', color: '#561a1aff', isLight: false },
        { name: 'Linen', color: '#f5f3ef', isLight: true },
        { name: 'Sky', color: '#dbeafe', isLight: true },
        { name: 'Mint', color: '#dcfce7', isLight: true }
    ];
    const DEFAULT_THEME = THEMES[0];

    /**
     * Get theme object by color
     * @param {string} color - The hex color string
     * @returns {Object} The theme object
     */
    function getThemeByColor(color) {
        return THEMES.find(t => t.color === color) || DEFAULT_THEME;
    }

    /**
     * Applies the chosen theme to the body and text elements
     * @param {Object} theme - The theme object to apply
     */
    function applyTheme(theme) {
        document.body.style.backgroundColor = theme.color;
        
        const titleElement = document.querySelector('h1.font-header');
        const themeLabel = document.querySelector('label.tracking-wider');

        if (theme.isLight) {
            titleElement.classList.add('text-gray-700');
            titleElement.classList.remove('text-gray-400');
            themeLabel.classList.add('text-gray-600');
            themeLabel.classList.remove('text-gray-500');
        } else {
            titleElement.classList.add('text-gray-400');
            titleElement.classList.remove('text-gray-700');
            themeLabel.classList.add('text-gray-500');
            themeLabel.classList.remove('text-gray-600');
        }
    }

    /**
     * Creates the theme selector swatches
     */
    function initThemeSelector() {
        themeSelector.innerHTML = '';
        
        THEMES.forEach(theme => {
            const swatch = document.createElement('button');
            const isActive = currentTheme === theme.color;
            
            let borderColor = theme.isLight ? 'border-gray-300' : 'border-gray-500';
            let activeBorderColor = theme.isLight ? 'border-gray-700' : 'border-white';
            
            let scale = 'scale-100';
            if (isActive) {
                borderColor = activeBorderColor;
                scale = 'scale-110';
            }

            swatch.className = `w-6 h-6 rounded-full border-2 transition-all ${borderColor} ${scale}`;
            swatch.style.backgroundColor = theme.color;
            swatch.dataset.color = theme.color;
            swatch.setAttribute('aria-label', `Set ${theme.name} theme`);
            swatch.title = theme.name;
            themeSelector.appendChild(swatch);
        });
    }

    /**
     * Updates theme selector after theme change
     */
    function updateThemeSelector() {
        Array.from(themeSelector.children).forEach(child => {
            const theme = getThemeByColor(child.dataset.color);
            let borderColor = theme.isLight ? 'border-gray-300' : 'border-gray-500';
            let activeBorderColor = theme.isLight ? 'border-gray-700' : 'border-white';
            
            child.classList.remove('border-gray-300', 'border-gray-500', 'border-gray-700', 'border-white', 'scale-110');

            if (child.dataset.color === currentTheme) {
                child.classList.add(activeBorderColor, 'scale-110');
            } else {
                child.classList.add(borderColor);
            }
        });
    }

    /**
     * Handles clicking on a theme swatch
     * @param {Event} e - The click event
     */
    function handleThemeClick(e) {
        const target = e.target.closest('button');
        if (!target || !target.dataset.color) return;

        const newColor = target.dataset.color;
        const newTheme = getThemeByColor(newColor);
        
        currentTheme = newColor;
        applyTheme(newTheme);
        updateThemeSelector();
        saveUserData();
    }

    // --- CALENDAR INITIALIZATION ---

    /**
     * Creates and renders the entire calendar grid
     */
    function initCalendar() {
        monthHeadersContainer.innerHTML = '';
        calendarGrid.innerHTML = '';

        MONTH_NAMES.forEach((month, monthIndex) => {
            // 1. Create the Month Header Cell
            const headerCell = document.createElement('div');
            headerCell.className = 'font-header text-[#D4AF37] text-center font-semibold text-xs sm:text-sm lg:text-base lowercase';
            headerCell.textContent = month;
            monthHeadersContainer.appendChild(headerCell);

            // 2. Create the Column for this Month's Days
            const monthColumn = document.createElement('div');
            monthColumn.className = 'flex flex-col gap-0.5 sm:gap-1';

            const numDays = DAYS_IN_MONTH[monthIndex];

            // 3. Create all 31 "day slots" for alignment
            for (let day = 1; day <= 31; day++) {
                const dayHexagon = document.createElement('div');
                dayHexagon.className = 'day-hexagon flex items-center justify-center w-6 h-7 text-xs sm:w-8 sm:h-9 sm:text-sm lg:w-10 lg:h-11 lg:text-base';

                if (day <= numDays) {
                    // This is a VALID day
                    const dayId = `${monthIndex}-${day}`;
                    dayHexagon.dataset.day = day;
                    dayHexagon.dataset.id = dayId;

                    // Check if this day is "lit" in the saved state
                    if (currentState[dayId]) {
                        dayHexagon.classList.add('lit');
                    }
                } else {
                    // This is an INVALID day
                    dayHexagon.classList.add('invalid');
                }
                
                monthColumn.appendChild(dayHexagon);
            }
            
            calendarGrid.appendChild(monthColumn);
        });
    }

    // --- EVENT HANDLERS ---

    /**
     * Handles clicking on a day hexagon
     * @param {Event} e - The click event
     */
    function handleDayClick(e) {
        const target = e.target.closest('.day-hexagon');

        if (!target || target.classList.contains('invalid')) {
            return;
        }

        // Toggle the "lit" class
        target.classList.toggle('lit');

        // Update the state
        const dayId = target.dataset.id;

        if (target.classList.contains('lit')) {
            currentState[dayId] = true;
        } else {
            delete currentState[dayId];
        }

        // Save to server
        saveUserData();
    }

    // --- INITIALIZE APP ---

    // Initialize theme selector
    initThemeSelector();

    // Load user data when page loads
    // This will be called by firebase-auth.js when user is authenticated
    window.loadUserData = loadUserData;

    // --- ATTACH EVENT LISTENERS ---
    
    // Listen for clicks on the entire grid (event delegation)
    calendarGrid.addEventListener('click', handleDayClick);

    // Listen for clicks on the theme selector
    themeSelector.addEventListener('click', handleThemeClick);
});