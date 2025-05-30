// JavaScript for subscription management app
// 订阅管理应用的主要JavaScript代码

console.log("script.js loaded");

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./pwabuilder-sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功，作用域: ', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker 注册失败: ', error);
                // 如果是MIME类型错误，可能是因为使用了简单的HTTP服务器
                if (error.name === 'SecurityError' && error.message.includes('MIME type')) {
                    console.warn('Service Worker 注册失败可能是因为使用了简单的HTTP服务器，这在开发环境中是正常的。在生产环境中，请使用正确配置的Web服务器。');
                }
            });
    });
}

// 预设服务数据
const presetServices = [
  { id: 'netflix', name: 'Netflix', defaultUrl: 'https://www.netflix.com', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64' },
  { id: 'spotify', name: 'Spotify', defaultUrl: 'https://www.spotify.com', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64' },
  { id: 'youtube_premium', name: 'YouTube Premium', defaultUrl: 'https://www.youtube.com/premium', category: 'entertainment', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
  { id: 'office365', name: 'Microsoft 365', defaultUrl: 'https://www.microsoft.com/microsoft-365', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64' },
  { id: 'aws', name: 'Amazon Web Services', defaultUrl: 'https://aws.amazon.com', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64' },
  { id: 'github_pro', name: 'GitHub Pro', defaultUrl: 'https://github.com/pricing', category: 'work', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
  { id: 'icloud', name: 'iCloud+', defaultUrl: 'https://www.apple.com/icloud/', category: 'utility', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=icloud.com&sz=64' },
  { id: 'google_one', name: 'Google One', defaultUrl: 'https://one.google.com/', category: 'utility', defaultIconUrl: 'https://www.google.com/s2/favicons?domain=one.google.com&sz=64' }
];

document.addEventListener('DOMContentLoaded', () => {
    // 将全局变量的声明和初始化移到 DOMContentLoaded 回调函数的顶部
    window.subscriptions = [];
    window.STORAGE_KEY = 'subscriptionsData';
    window.editingId = null;

    // 设置相关功能
    window.SETTINGS_KEY = 'subscriptionAppSettings';
    window.appSettings = {
        localCurrency: 'CNY',
        apiKey: 'ca228e734975f64f02e34368', // 默认使用提供的API Key
        notificationDismissed: false,
        lastNotificationDate: null,
        isDeveloperMode: false, // 默认为普通用户模式
        apiCallCount: 0, // API调用计数器
        lastApiCallDate: null, // 最后一次API调用日期

        // 浏览器通知设置
        enableNotifications: false, // 是否启用浏览器通知
        notificationDays: 7, // 提前多少天发送到期提醒
        notificationDaily: false, // 对已过期订阅每天发送提醒
        lastNotificationCheck: null, // 上次检查通知的时间
        notifiedSubscriptions: {}, // 已通知的订阅ID及其通知时间
        theme: 'light' // 新增：默认主题为亮色
    };

    window.EXCHANGE_RATES_KEY = 'subscriptionExchangeRates';
    window.exchangeRatesCache = {
        timestamp: null,
        base: '',
        rates: {}
    };

    // 声明DOM元素变量 (初始化为 null)
    window.subscriptionForm = null;
    window.subscriptionListDiv = null;
    window.submitButton = null;
    window.billingCycleSelect = null;
    window.startDateInput = null;
    window.expiryDateInput = null;
    window.currencyInput = null;
    window.categorySelect = null;
    window.categoryFilterSelect = null;
    window.settingsToggle = null;
    window.settingsPanel = null;
    window.localCurrencyInput = null;
    window.saveSettingsButton = null;
    window.notificationPanel = null;
    window.notificationContent = null;
    window.closeNotificationButton = null;
    window.apiKeyInput = null;
    window.refreshRatesButton = null;
    window.ratesStatusDiv = null;
    window.developerModeCheckbox = null;
    window.apiCallCountSpan = null;
    window.refreshFrequencySpan = null;
    window.lastRefreshTimeSpan = null;
    window.themeSelect = null;
    window.enableNotificationsCheckbox = null;
    window.notificationSettingsDiv = null;
    window.notificationDaysInput = null;
    window.notificationDailyCheckbox = null;
    window.testNotificationButton = null;
    window.notificationStatusDiv = null;
    window.exportJsonButton = null;
    window.exportCsvButton = null;
    window.importFileInput = null;
    window.selectedFileNameSpan = null;
    window.importReplaceCheckbox = null;
    window.importButton = null;
    window.importStatusDiv = null;
    window.totalSubscriptionsElement = null;
    window.monthlyTotalElement = null;
    window.annualTotalElement = null;
    window.categoryChartCanvas = null;
    window.trendChartCanvas = null;
    window.valueAnalysisChartCanvas = null;
    window.trendTimeRangeSelect = null;
    window.categoryChartTypeSelect = null;
    window.trendChartTypeSelect = null;
    window.valueAnalysisTypeSelect = null;
    window.showPresetModalBtn = null;
    window.closePresetModalBtn = null;
    window.presetServiceModal = null;
    window.searchPresetServiceInput = null;
    window.presetServiceListDiv = null;
    window.paymentAccountInput = null;
    window.priceHistoryNotesInput = null;
    window.expiryDateContainer = null;
    window.autoCalculateCheckbox = null;
    window.autoCalculateCheck = null;

    // --- BEGIN: NEW BOTTOM NAVIGATION AND VIEW SWITCHING LOGIC ---
    const navButtons = document.querySelectorAll('#bottom-navigation .nav-item');
    const views = document.querySelectorAll('.view-content');
    const defaultView = 'view-subscriptions'; // ID of the default view

    // Function to initialize elements and event listeners for a specific view
    // This helps to avoid errors when elements are not yet visible/exist in the DOM
    function initializeViewSpecificElements(viewId) {
        console.log(`Attempting to initialize elements for view: ${viewId}`);
        if (viewId === 'view-subscriptions') {
            initializeSubscriptionsView();
        } else if (viewId === 'view-settings') {
            initializeSettingsView();
        } else if (viewId === 'view-analysis') {
            initializeAnalysisView();
        } else if (viewId === 'view-discovery') {
            initializeDiscoveryView();
        }
        console.log(`Initialization completed for ${viewId}`);
    }

    function switchView(viewId) {
        views.forEach(view => {
            if (view.id === viewId) {
                view.classList.remove('hidden');
                // Initialize elements for the view if not already done
                if (!view.dataset.initialized) {
                    initializeViewSpecificElements(viewId);
                    view.dataset.initialized = 'true';
                }
            } else {
                view.classList.add('hidden');
            }
        });

        // Highlight active nav button
        navButtons.forEach(button => {
            // Ensure viewId is a string and button.dataset.view exists
            if (button.dataset.view && typeof viewId === 'string' && button.dataset.view === viewId.replace('view-', '')) {
                button.classList.add('text-blue-600', 'font-semibold');
                button.classList.remove('text-gray-700');
            } else {
                button.classList.remove('text-blue-600', 'font-semibold');
                button.classList.add('text-gray-700');
            }
        });
        console.log(`Switched to view: ${viewId}`);
    }

    if (navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewId = `view-${button.dataset.view}`;
                switchView(viewId);
            });
        });
    } else {
        console.warn("No navigation buttons found.");
    }

    // Set initial view
    if (views.length > 0) {
        views.forEach(view => {
            if (view.id !== defaultView) {
                view.classList.add('hidden');
            } else {
                // For the default view, remove hidden and initialize
                view.classList.remove('hidden');
                if (!view.dataset.initialized) { // Should typically not be initialized yet
                    initializeViewSpecificElements(defaultView);
                    view.dataset.initialized = 'true';
                }
            }
        });
    } else {
        console.warn("No view containers found.");
    }
    // --- END: NEW BOTTOM NAVIGATION AND VIEW SWITCHING LOGIC ---

    // 安全地获取DOM元素的函数
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }

    // 安全地添加事件监听器的函数
    function addEventListenerSafely(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Cannot add ${event} event listener to undefined element`);
        }
    }



    // 初始化订阅视图的元素
    function initializeSubscriptionsView() {
        console.log("Initializing subscriptions view elements");

        try {
            // 获取订阅表单相关元素
            window.subscriptionForm = getElement('add-subscription-form');
            window.subscriptionListDiv = getElement('subscription-list');

            if (window.subscriptionForm) {
                window.submitButton = window.subscriptionForm.querySelector('button[type="submit"]');
            } else {
                console.warn("Subscription form not found, cannot get submit button");
            }

            window.billingCycleSelect = getElement('billing-cycle');
            window.startDateInput = getElement('start-date');
            window.expiryDateInput = getElement('expiry-date');
            window.currencyInput = getElement('currency');
            window.categorySelect = getElement('category');
            window.categoryFilterSelect = getElement('category-filter');

            // 预设服务模态框相关元素
            window.showPresetModalBtn = getElement('show-preset-modal-btn');
            window.closePresetModalBtn = getElement('close-preset-modal-btn');
            window.presetServiceModal = getElement('preset-service-modal');
            window.searchPresetServiceInput = getElement('search-preset-service');
            window.presetServiceListDiv = getElement('preset-service-list');
            window.paymentAccountInput = getElement('payment-account');
            window.priceHistoryNotesInput = getElement('price-history-notes');

            // 添加"自动计算"复选框到表单中
            if (window.expiryDateInput) {
                window.expiryDateContainer = window.expiryDateInput.parentElement;
                if (window.expiryDateContainer) {
                    window.autoCalculateCheckbox = document.createElement('div');
                    window.autoCalculateCheckbox.innerHTML = `
                        <input type="checkbox" id="auto-calculate" name="auto-calculate" checked>
                        <label for="auto-calculate">自动计算到期日期（基于周期和首次订阅日期）</label>
                    `;
                    window.expiryDateContainer.insertAdjacentElement('afterend', window.autoCalculateCheckbox);
                    window.autoCalculateCheck = getElement('auto-calculate');
                }
            }

            // 设置事件监听器
            if (window.subscriptionForm) {
                window.subscriptionForm.addEventListener('submit', handleSubscriptionFormSubmit);
            }

            addEventListenerSafely(window.billingCycleSelect, 'change', updateExpiryDate);
            addEventListenerSafely(window.startDateInput, 'change', updateExpiryDate);
            addEventListenerSafely(window.autoCalculateCheck, 'change', function() {
                if (this.checked) {
                    updateExpiryDate();
                }
            });

            addEventListenerSafely(window.showPresetModalBtn, 'click', showPresetModal);
            addEventListenerSafely(window.closePresetModalBtn, 'click', hidePresetModal);
            addEventListenerSafely(window.searchPresetServiceInput, 'input', filterPresetServices);

            if (window.categoryFilterSelect) {
                window.categoryFilterSelect.addEventListener('change', function() {
                    renderSubscriptions(this.value);
                });
            }

            // 加载订阅数据
            loadSubscriptions();
            renderSubscriptions();
        } catch (error) {
            console.error("初始化订阅视图时出错:", error);
        }
    }

    // 初始化设置视图的元素
    function initializeSettingsView() {
        console.log("Initializing settings view elements");

        try {
            // 获取设置相关元素
            window.settingsToggle = getElement('settings-toggle');
            window.settingsPanel = getElement('settings-panel');
            window.localCurrencyInput = getElement('local-currency');
            window.saveSettingsButton = getElement('save-settings');
            window.apiKeyInput = getElement('api-key');
            window.refreshRatesButton = getElement('refresh-rates');
            window.ratesStatusDiv = getElement('rates-status');
            window.developerModeCheckbox = getElement('developer-mode');
            window.apiCallCountSpan = getElement('api-call-count');
            window.refreshFrequencySpan = getElement('refresh-frequency');
            window.lastRefreshTimeSpan = getElement('last-refresh-time');
            window.themeSelect = getElement('theme-select');

            // 通知设置相关元素
            window.enableNotificationsCheckbox = getElement('enable-notifications');
            window.notificationSettingsDiv = getElement('notification-settings');
            window.notificationDaysInput = getElement('notification-days');
            window.notificationDailyCheckbox = getElement('notification-daily');
            window.testNotificationButton = getElement('test-notification');
            window.notificationStatusDiv = getElement('notification-status');

            // 数据导入/导出相关元素
            window.exportJsonButton = getElement('export-json');
            window.exportCsvButton = getElement('export-csv');
            window.importFileInput = getElement('import-file');
            window.selectedFileNameSpan = getElement('selected-file-name');
            window.importReplaceCheckbox = getElement('import-replace');
            window.importButton = getElement('import-button');
            window.importStatusDiv = getElement('import-status');

            // 设置事件监听器
            addEventListenerSafely(window.settingsToggle, 'click', function() {
                if (window.settingsPanel) {
                    window.settingsPanel.classList.toggle('hidden');
                }
            });

            addEventListenerSafely(window.apiKeyInput, 'input', updateDeveloperModeCheckbox);

            addEventListenerSafely(window.saveSettingsButton, 'click', function() {
                saveSettings();
                if (window.settingsPanel) {
                    window.settingsPanel.classList.add('hidden');
                }
                renderSubscriptions();

                // 如果启用了通知，立即检查订阅
                if (appSettings.enableNotifications && Notification.permission === 'granted') {
                    checkSubscriptionsAndNotify();
                }
            });

            addEventListenerSafely(window.refreshRatesButton, 'click', refreshRates);
            addEventListenerSafely(window.enableNotificationsCheckbox, 'change', toggleNotificationSettings);
            addEventListenerSafely(window.testNotificationButton, 'click', testNotification);
            addEventListenerSafely(window.themeSelect, 'change', function() {
                applyTheme(this.value);
            });

            addEventListenerSafely(window.exportJsonButton, 'click', exportDataAsJson);
            addEventListenerSafely(window.exportCsvButton, 'click', exportDataAsCsv);
            addEventListenerSafely(window.importFileInput, 'change', handleFileSelect);
            addEventListenerSafely(window.importButton, 'click', importData);

            // 加载设置
            loadSettings();
            loadExchangeRatesCache();
        } catch (error) {
            console.error("初始化设置视图时出错:", error);
        }
    }

    // 初始化分析视图的元素
    function initializeAnalysisView() {
        console.log("Initializing analysis view elements");

        try {
            // 获取统计相关元素
            window.totalSubscriptionsElement = getElement('total-subscriptions');
            window.monthlyTotalElement = getElement('monthly-total');
            window.annualTotalElement = getElement('annual-total');
            window.categoryChartCanvas = getElement('category-chart');
            window.trendChartCanvas = getElement('trend-chart');
            window.valueAnalysisChartCanvas = getElement('value-analysis-chart');
            window.trendTimeRangeSelect = getElement('trend-time-range');
            window.categoryChartTypeSelect = getElement('category-chart-type');
            window.trendChartTypeSelect = getElement('trend-chart-type');
            window.valueAnalysisTypeSelect = getElement('value-analysis-type');

            // 设置事件监听器
            addEventListenerSafely(window.trendTimeRangeSelect, 'change', updateTrendChart);
            addEventListenerSafely(window.categoryChartTypeSelect, 'change', updateCategoryChart);
            addEventListenerSafely(window.trendChartTypeSelect, 'change', updateTrendChart);
            addEventListenerSafely(window.valueAnalysisTypeSelect, 'change', updateValueAnalysisChart);

            // 更新统计数据
            updateStatistics();
        } catch (error) {
            console.error("初始化分析视图时出错:", error);
        }
    }

    // 初始化发现视图的元素
    function initializeDiscoveryView() {
        console.log("Initializing discovery view elements");

        try {
            // 获取发现相关元素
            // 这里可以添加发现视图的元素初始化

            // 更新汇率信息
            updateExchangeRateInfo();
        } catch (error) {
            console.error("初始化发现视图时出错:", error);
        }
    }

    // 初始化通知面板
    function initializeNotificationPanel() {
        // 通知面板相关元素
        window.notificationPanel = getElement('notification-panel');
        window.notificationContent = getElement('notification-content');
        window.closeNotificationButton = getElement('close-notification');

        // 设置通知面板事件监听器
        addEventListenerSafely(window.closeNotificationButton, 'click', function() {
            if (window.notificationPanel) {
                window.notificationPanel.classList.add('hidden');

                window.appSettings.notificationDismissed = true;
                window.appSettings.lastNotificationDate = new Date().toISOString().split('T')[0];
                localStorage.setItem(window.SETTINGS_KEY, JSON.stringify(window.appSettings));
            }
        });
    }

    // 在DOMContentLoaded事件中初始化通知面板
    document.addEventListener('DOMContentLoaded', function() {
        initializeNotificationPanel();
    });

    // 获取刷新频率（小时）
    function getRefreshFrequency() {
        // 检查是否使用的是默认API密钥
        const isUsingDefaultApiKey = appSettings.apiKey === 'ca228e734975f64f02e34368';

        // 如果使用自己的API密钥且开启了开发者模式
        if (!isUsingDefaultApiKey && appSettings.isDeveloperMode) {
            return 0; // 开发者模式：无限制刷新
        }
        // 如果使用默认API密钥且API调用次数达到500次
        else if (isUsingDefaultApiKey && appSettings.apiCallCount >= 500) {
            return 24; // 默认API密钥高频使用：每24小时刷新一次
        }
        // 其他情况
        else {
            return 12; // 普通情况：每12小时刷新一次
        }
    }

    // 更新API使用情况显示
    function updateApiUsageInfo() {
        if (window.apiCallCountSpan) {
            window.apiCallCountSpan.textContent = appSettings.apiCallCount;
        }

        const frequency = getRefreshFrequency();
        if (window.refreshFrequencySpan) {
            if (frequency === 0) {
                window.refreshFrequencySpan.textContent = '无限制（开发者模式）';
            } else {
                window.refreshFrequencySpan.textContent = `每${frequency}小时`;
            }
        }

        if (window.lastRefreshTimeSpan) {
            if (appSettings.lastApiCallDate) {
                const date = new Date(appSettings.lastApiCallDate);
                window.lastRefreshTimeSpan.textContent = date.toLocaleString();
            } else {
                window.lastRefreshTimeSpan.textContent = '从未刷新';
            }
        }

        // 更新开发者模式复选框状态
        updateDeveloperModeCheckbox();
    }

    // 更新开发者模式复选框状态
    function updateDeveloperModeCheckbox() {
        if (!window.apiKeyInput || !window.developerModeCheckbox) return;

        // 检查是否使用默认API密钥
        const isUsingDefaultApiKey = window.apiKeyInput.value.trim() === 'ca228e734975f64f02e34368';

        // 如果使用默认API密钥，禁用开发者模式复选框
        if (isUsingDefaultApiKey) {
            window.developerModeCheckbox.disabled = true;
            window.developerModeCheckbox.checked = false;
            if (window.developerModeCheckbox.parentElement) {
                window.developerModeCheckbox.parentElement.title = '使用默认API密钥时无法启用开发者模式';
            }
        } else {
            // 如果使用自己的API密钥，启用开发者模式复选框
            window.developerModeCheckbox.disabled = false;
            if (window.developerModeCheckbox.parentElement) {
                window.developerModeCheckbox.parentElement.title = '';
            }
        }
    }

    // 检查浏览器是否支持通知
    function checkNotificationSupport() {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持通知功能');
            if (window.enableNotificationsCheckbox) {
                window.enableNotificationsCheckbox.disabled = true;
                window.enableNotificationsCheckbox.checked = false;
            }
            if (window.notificationSettingsDiv) {
                window.notificationSettingsDiv.classList.add('hidden');
            }
            if (window.notificationStatusDiv) {
                window.notificationStatusDiv.textContent = '您的浏览器不支持通知功能';
                window.notificationStatusDiv.className = 'notification-status error';
            }
            return false;
        }
        return true;
    }

    // 请求通知权限
    async function requestNotificationPermission() {
        if (!checkNotificationSupport()) return false;

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                if (window.notificationStatusDiv) {
                    window.notificationStatusDiv.textContent = '通知权限已授予';
                    window.notificationStatusDiv.className = 'notification-status success';
                }
                return true;
            } else {
                if (window.notificationStatusDiv) {
                    window.notificationStatusDiv.textContent = '通知权限被拒绝，请在浏览器设置中启用通知';
                    window.notificationStatusDiv.className = 'notification-status error';
                }
                if (window.enableNotificationsCheckbox) {
                    window.enableNotificationsCheckbox.checked = false;
                }
                return false;
            }
        } catch (error) {
            console.error('请求通知权限时出错:', error);
            if (window.notificationStatusDiv) {
                window.notificationStatusDiv.textContent = `请求通知权限时出错: ${error.message}`;
                window.notificationStatusDiv.className = 'notification-status error';
            }
            if (window.enableNotificationsCheckbox) {
                window.enableNotificationsCheckbox.checked = false;
            }
            return false;
        }
    }

    // 显示通知设置区域
    function toggleNotificationSettings() {
        if (!window.enableNotificationsCheckbox || !window.notificationSettingsDiv) return;

        if (window.enableNotificationsCheckbox.checked) {
            window.notificationSettingsDiv.classList.remove('hidden');
            requestNotificationPermission();
        } else {
            window.notificationSettingsDiv.classList.add('hidden');
            if (window.notificationStatusDiv) {
                window.notificationStatusDiv.textContent = '';
                window.notificationStatusDiv.className = 'notification-status';
            }
        }
    }

    // 加载应用设置
    function loadSettings() {
        const storedSettings = localStorage.getItem(window.SETTINGS_KEY);
        if (storedSettings) {
            window.appSettings = JSON.parse(storedSettings);

            // 确保新添加的字段存在
            if (window.appSettings.apiCallCount === undefined) window.appSettings.apiCallCount = 0;
            if (window.appSettings.isDeveloperMode === undefined) window.appSettings.isDeveloperMode = false;
            if (window.appSettings.lastApiCallDate === undefined) window.appSettings.lastApiCallDate = null;

            // 确保通知设置字段存在
            if (window.appSettings.enableNotifications === undefined) window.appSettings.enableNotifications = false;
            if (window.appSettings.notificationDays === undefined) window.appSettings.notificationDays = 7;
            if (window.appSettings.notificationDaily === undefined) window.appSettings.notificationDaily = false;
            if (window.appSettings.lastNotificationCheck === undefined) window.appSettings.lastNotificationCheck = null;
            if (window.appSettings.notifiedSubscriptions === undefined) window.appSettings.notifiedSubscriptions = {};
            if (window.appSettings.theme === undefined) window.appSettings.theme = 'light'; // 新增：确保主题设置存在
        }

        // 更新UI以反映设置
        if (window.localCurrencyInput) window.localCurrencyInput.value = window.appSettings.localCurrency;
        if (window.apiKeyInput) window.apiKeyInput.value = window.appSettings.apiKey || '';
        if (window.developerModeCheckbox) window.developerModeCheckbox.checked = window.appSettings.isDeveloperMode;
        if (window.themeSelect) window.themeSelect.value = window.appSettings.theme; // 新增：设置主题选择器的值
        applyTheme(window.appSettings.theme); // 新增：应用加载的主题

        // 更新通知设置UI
        if (window.enableNotificationsCheckbox) window.enableNotificationsCheckbox.checked = window.appSettings.enableNotifications;
        if (window.notificationDaysInput) window.notificationDaysInput.value = window.appSettings.notificationDays;
        if (window.notificationDailyCheckbox) window.notificationDailyCheckbox.checked = window.appSettings.notificationDaily;

        // 根据通知启用状态显示/隐藏设置区域
        if (window.notificationSettingsDiv) {
            if (window.appSettings.enableNotifications) {
                window.notificationSettingsDiv.classList.remove('hidden');
            } else {
                window.notificationSettingsDiv.classList.add('hidden');
            }
        }

        // 更新API使用情况显示
        updateApiUsageInfo();

        // 更新开发者模式复选框状态
        updateDeveloperModeCheckbox();

        // 检查通知支持
        checkNotificationSupport();
    }

    // 保存应用设置
    function saveSettings() {
        if (window.localCurrencyInput) {
            window.appSettings.localCurrency = window.localCurrencyInput.value.trim().toUpperCase() || 'CNY';
        }

        if (window.apiKeyInput) {
            window.appSettings.apiKey = window.apiKeyInput.value.trim();
        }

        // 检查是否使用默认API密钥
        const isUsingDefaultApiKey = window.appSettings.apiKey === 'ca228e734975f64f02e34368';

        // 如果使用默认API密钥，强制禁用开发者模式
        if (isUsingDefaultApiKey) {
            window.appSettings.isDeveloperMode = false;
            if (window.developerModeCheckbox) {
                window.developerModeCheckbox.checked = false;
            }
        } else {
            // 如果使用自己的API密钥，允许设置开发者模式
            if (window.developerModeCheckbox) {
                window.appSettings.isDeveloperMode = window.developerModeCheckbox.checked;
            }
        }

        // 保存通知设置
        if (window.enableNotificationsCheckbox) {
            window.appSettings.enableNotifications = window.enableNotificationsCheckbox.checked;
        }

        if (window.notificationDaysInput) {
            window.appSettings.notificationDays = parseInt(window.notificationDaysInput.value) || 7;
        }

        if (window.notificationDailyCheckbox) {
            window.appSettings.notificationDaily = window.notificationDailyCheckbox.checked;
        }

        if (window.themeSelect) {
            window.appSettings.theme = window.themeSelect.value; // 新增：保存主题设置
        }

        localStorage.setItem(window.SETTINGS_KEY, JSON.stringify(window.appSettings));

        if (window.exchangeRatesCache && window.exchangeRatesCache.base !== window.appSettings.localCurrency || !window.appSettings.apiKey) {
            clearExchangeRatesCache();
        }

        // 更新API使用情况显示
        updateApiUsageInfo();

        console.log("Settings saved:", window.appSettings);

        // 如果启用了通知，请求权限
        if (window.appSettings.enableNotifications) {
            requestNotificationPermission();
        }
    }

    // 发送浏览器通知
    function sendNotification(title, options = {}) {
        if (!window.appSettings.enableNotifications || !checkNotificationSupport()) {
            return false;
        }

        if (Notification.permission !== 'granted') {
            requestNotificationPermission();
            return false;
        }

        try {
            // 设置默认图标
            if (!options.icon) {
                options.icon = 'https://www.google.com/s2/favicons?domain=subscription-manager.com&sz=64';
            }

            // 设置默认通知选项
            const notificationOptions = {
                body: options.body || '',
                icon: options.icon,
                badge: options.badge || options.icon,
                tag: options.tag || 'subscription-manager',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                data: options.data || {}
            };

            // 创建并显示通知
            const notification = new Notification(title, notificationOptions);

            // 添加点击事件处理
            notification.onclick = function() {
                window.focus();
                if (options.onClick) {
                    options.onClick();
                }
                notification.close();
            };

            console.log('已发送通知:', title, notificationOptions);
            return true;
        } catch (error) {
            console.error('发送通知时出错:', error);
            return false;
        }
    }

    // 检查订阅到期情况并发送通知
    function checkSubscriptionsAndNotify() {
        if (!window.appSettings.enableNotifications || Notification.permission !== 'granted') {
            return;
        }

        // 记录本次检查时间
        const now = new Date();
        window.appSettings.lastNotificationCheck = now.toISOString();

        // 获取今天的日期（不含时间）
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // 检查每个订阅
        window.subscriptions.forEach(sub => {
            if (!sub.expiryDate) return; // 跳过没有到期日期的订阅

            const expiryDate = new Date(sub.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            const subId = sub.id.toString();

            // 检查是否已经通知过这个订阅
            const lastNotified = window.appSettings.notifiedSubscriptions[subId]
                ? new Date(window.appSettings.notifiedSubscriptions[subId]).getTime()
                : 0;

            // 如果今天已经通知过，则跳过
            if (lastNotified >= today && !window.appSettings.notificationDaily) {
                return;
            }

            // 处理已过期的订阅
            if (daysUntilExpiry < 0) {
                if (window.appSettings.notificationDaily) {
                    sendNotification(
                        `订阅已过期: ${sub.serviceName}`,
                        {
                            body: `${sub.serviceName} 已过期 ${Math.abs(daysUntilExpiry)} 天。`,
                            icon: sub.serviceIcon,
                            tag: `expired-${subId}`,
                            requireInteraction: true,
                            data: { id: subId, type: 'expired' },
                            onClick: () => {
                                document.getElementById(`subscription-${subId}`).scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    );

                    // 记录通知时间
                    window.appSettings.notifiedSubscriptions[subId] = now.toISOString();
                }
            }
            // 处理即将到期的订阅
            else if (daysUntilExpiry <= window.appSettings.notificationDays) {
                sendNotification(
                    `订阅即将到期: ${sub.serviceName}`,
                    {
                        body: daysUntilExpiry === 0
                            ? `${sub.serviceName} 今天到期。`
                            : `${sub.serviceName} 将在 ${daysUntilExpiry} 天后到期。`,
                        icon: sub.serviceIcon,
                        tag: `expiring-${subId}`,
                        requireInteraction: true,
                        data: { id: subId, type: 'expiring' },
                        onClick: () => {
                            document.getElementById(`subscription-${subId}`).scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                );

                // 记录通知时间
                window.appSettings.notifiedSubscriptions[subId] = now.toISOString();
            }
        });

        // 保存通知状态
        localStorage.setItem(window.SETTINGS_KEY, JSON.stringify(window.appSettings));
    }

    // 刷新汇率数据
    async function refreshRates() {
        if (!appSettings.apiKey) {
            if (ratesStatusDiv) {
                ratesStatusDiv.textContent = '请先设置API Key';
                ratesStatusDiv.className = 'rates-status error';
            }
            return;
        }

        // 检查是否可以刷新汇率数据
        const now = new Date().getTime();
        const cacheAge = exchangeRatesCache.timestamp ? (now - exchangeRatesCache.timestamp) / (1000 * 60 * 60) : Infinity;
        const refreshFrequency = getRefreshFrequency();

        // 如果不是开发者模式，且缓存未过期，则限制刷新频率
        if (!appSettings.isDeveloperMode && cacheAge < refreshFrequency) {
            const remainingHours = (refreshFrequency - cacheAge).toFixed(1);
            if (ratesStatusDiv) {
                ratesStatusDiv.textContent = `刷新频率限制：请在 ${remainingHours} 小时后再试`;
                ratesStatusDiv.className = 'rates-status error';
            }
            return;
        }

        if (ratesStatusDiv) {
            ratesStatusDiv.textContent = '正在获取最新汇率数据...';
            ratesStatusDiv.className = 'rates-status';
        }

        try {
            // 强制更新汇率数据
            const rates = await fetchExchangeRates(true);

            if (rates && ratesStatusDiv) {
                ratesStatusDiv.textContent = `汇率数据已更新（${new Date().toLocaleString()}）`;
                ratesStatusDiv.className = 'rates-status success';

                // 重新渲染订阅列表，使用新的汇率数据
                renderSubscriptions();
            } else if (ratesStatusDiv) {
                ratesStatusDiv.textContent = '获取汇率数据失败，请检查API Key和网络连接';
                ratesStatusDiv.className = 'rates-status error';
            }
        } catch (error) {
            console.error('刷新汇率时发生错误:', error);
            if (ratesStatusDiv) {
                ratesStatusDiv.textContent = `获取汇率时发生错误: ${error.message}`;
                ratesStatusDiv.className = 'rates-status error';
            }
        }
    }

    // 测试通知功能
    function testNotification() {
        if (!checkNotificationSupport()) {
            if (notificationStatusDiv) {
                notificationStatusDiv.textContent = '浏览器不支持通知功能';
                notificationStatusDiv.className = 'notification-status error';
            }
            return;
        }

        if (Notification.permission !== 'granted') {
            requestNotificationPermission().then(granted => {
                if (granted) {
                    sendTestNotification();
                }
            });
        } else {
            sendTestNotification();
        }
    }

    // 发送测试通知
    function sendTestNotification() {
        const success = sendNotification(
            '测试通知',
            {
                body: '这是一条测试通知，表明通知功能正常工作。',
                requireInteraction: true
            }
        );

        if (success && notificationStatusDiv) {
            notificationStatusDiv.textContent = '测试通知已发送';
            notificationStatusDiv.className = 'notification-status success';
        } else if (notificationStatusDiv) {
            notificationStatusDiv.textContent = '发送测试通知失败';
            notificationStatusDiv.className = 'notification-status error';
        }
    }

    // 显示预设服务模态框
    function showPresetModal() {
        if (presetServiceModal) {
            presetServiceModal.classList.remove('hidden');
            renderPresetServices();
        }
    }

    // 隐藏预设服务模态框
    function hidePresetModal() {
        if (presetServiceModal) {
            presetServiceModal.classList.add('hidden');
        }
    }

    // 过滤预设服务
    function filterPresetServices() {
        if (!searchPresetServiceInput || !presetServiceListDiv) return;

        const searchTerm = searchPresetServiceInput.value.toLowerCase();
        renderPresetServices(searchTerm);
    }

    // 渲染预设服务列表
    function renderPresetServices(searchTerm = '') {
        if (!presetServiceListDiv) return;

        presetServiceListDiv.innerHTML = '';

        const filteredServices = searchTerm
            ? presetServices.filter(service =>
                service.name.toLowerCase().includes(searchTerm) ||
                service.category.toLowerCase().includes(searchTerm))
            : presetServices;

        if (filteredServices.length === 0) {
            presetServiceListDiv.innerHTML = '<p class="text-center text-gray-500 my-4">没有找到匹配的服务</p>';
            return;
        }

        filteredServices.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'preset-service-item';
            serviceItem.innerHTML = `
                <img src="${service.defaultIconUrl}" alt="${service.name}" class="preset-service-icon">
                <div class="preset-service-info">
                    <h3>${service.name}</h3>
                    <span class="preset-service-category">${getCategoryName(service.category)}</span>
                </div>
            `;

            serviceItem.addEventListener('click', () => {
                selectPresetService(service);
            });

            presetServiceListDiv.appendChild(serviceItem);
        });
    }

    // 选择预设服务
    function selectPresetService(service) {
        // 获取表单元素
        const serviceNameInput = document.getElementById('service-name');
        const serviceUrlInput = document.getElementById('service-url');
        const serviceIconInput = document.getElementById('service-icon');

        if (!serviceNameInput || !serviceUrlInput || !categorySelect) {
            console.warn('无法找到表单元素，无法选择预设服务');
            return;
        }

        serviceNameInput.value = service.name;
        serviceUrlInput.value = service.defaultUrl;
        categorySelect.value = service.category;

        // 如果有图标，也设置图标
        if (service.defaultIconUrl && serviceIconInput) {
            serviceIconInput.value = service.defaultIconUrl;
        }

        hidePresetModal();
    }

    // 获取默认服务图标
    function getDefaultServiceIcon(serviceName, serviceUrl) {
        // 首先检查是否有匹配的预设服务
        const presetService = presetServices.find(service =>
            service.name.toLowerCase() === serviceName.toLowerCase());

        if (presetService && presetService.defaultIconUrl) {
            return presetService.defaultIconUrl;
        }

        // 如果没有匹配的预设服务，但有URL，则使用Google Favicon服务
        if (serviceUrl) {
            try {
                const url = new URL(serviceUrl);
                return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
            } catch (e) {
                console.warn('无效的URL，无法获取图标:', serviceUrl);
            }
        }

        // 如果都没有，返回默认图标
        return 'https://www.google.com/s2/favicons?domain=subscription-manager.com&sz=64';
    }

    // 根据ID获取订阅
    function getSubscriptionById(id) {
        return subscriptions.find(sub => sub.id === id) || null;
    }

    // 获取分类名称
    function getCategoryName(categoryId) {
        const categories = {
            'entertainment': '娱乐',
            'work': '工作',
            'utility': '实用工具',
            'education': '教育',
            'lifestyle': '生活方式',
            'news': '新闻',
            'social': '社交',
            'gaming': '游戏',
            'other': '其他'
        };

        return categories[categoryId] || categoryId;
    }

    // 处理订阅表单提交
    function handleSubscriptionFormSubmit(event) {
        event.preventDefault();

        if (!subscriptionForm) return;

        // 获取表单数据
        const formData = new FormData(subscriptionForm);
        const serviceName = formData.get('service-name');
        const serviceUrl = formData.get('service-url');
        const serviceIconInput = document.getElementById('service-icon');
        const serviceIcon = serviceIconInput ? serviceIconInput.value : '';

        const subscriptionData = {
            id: editingId || Date.now().toString(),
            serviceName: serviceName,
            serviceUrl: serviceUrl,
            serviceIcon: serviceIcon || getDefaultServiceIcon(serviceName, serviceUrl),
            price: parseFloat(formData.get('price')),
            currency: formData.get('currency'),
            billingCycle: formData.get('billing-cycle'),
            category: formData.get('category'),
            startDate: formData.get('start-date'),
            expiryDate: formData.get('expiry-date'),
            autoRenew: formData.get('auto-renew') === 'on',
            paymentAccount: formData.get('payment-account'),
            priceHistoryNotes: formData.get('price-history-notes'),
            notes: formData.get('notes'),
            createdAt: editingId ? getSubscriptionById(editingId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 验证必填字段
        if (!subscriptionData.serviceName || !subscriptionData.price || isNaN(subscriptionData.price)) {
            alert('请填写服务名称和有效的价格');
            return;
        }

        // 如果是编辑模式，更新现有订阅
        if (editingId) {
            const index = subscriptions.findIndex(sub => sub.id === editingId);
            if (index !== -1) {
                subscriptions[index] = subscriptionData;
            }
            editingId = null;
        } else {
            // 否则添加新订阅
            subscriptions.push(subscriptionData);
        }

        // 保存订阅数据
        saveSubscriptions();

        // 重置表单
        subscriptionForm.reset();

        // 更新自动计算复选框状态
        if (autoCalculateCheck) {
            autoCalculateCheck.checked = true;
        }

        // 重新渲染订阅列表
        renderSubscriptions();

        // 更新统计数据
        updateStatistics();

        // 显示成功消息
        alert(editingId ? '订阅已更新' : '订阅已添加');
    }

    // 更新汇率信息
    function updateExchangeRateInfo() {
        // 这里可以添加更新汇率信息的代码
    }

    // 更新统计数据
    function updateStatistics() {
        // 这里可以添加更新统计数据的代码
    }

    // 更新分类图表
    function updateCategoryChart() {
        // 这里可以添加更新分类图表的代码
    }

    // 更新趋势图表
    function updateTrendChart() {
        // 这里可以添加更新趋势图表的代码
    }

    // 更新价值分析图表
    function updateValueAnalysisChart() {
        // 这里可以添加更新价值分析图表的代码
    }

    // 导出数据为JSON
    function exportDataAsJson() {
        // 这里可以添加导出数据为JSON的代码
    }

    // 导出数据为CSV
    function exportDataAsCsv() {
        // 这里可以添加导出数据为CSV的代码
    }

    // 处理文件选择
    function handleFileSelect() {
        // 这里可以添加处理文件选择的代码
    }

    // 导入数据
    function importData() {
        // 这里可以添加导入数据的代码
    }

    // 应用主题
    function applyTheme(theme) {
        const body = document.body;

        // 移除所有主题相关的类
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

        // 添加新的主题类
        body.classList.add(`theme-${theme}`);

        // 保存主题设置
        appSettings.theme = theme;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));

        console.log(`已应用主题: ${theme}`);
    }

    // 当订阅周期改变或首次订阅日期改变时，自动计算到期日期
    function updateExpiryDate() {
        if (!autoCalculateCheck.checked) return;

        const billingCycle = billingCycleSelect.value;
        const startDate = startDateInput.value;

        if (billingCycle === 'one-time' || !startDate) {
            expiryDateInput.value = '';
            return;
        }

        const expiry = calculateExpiryDate(startDate, billingCycle);
        expiryDateInput.value = expiry;
    }

    // 计算下一个到期日期
    function calculateExpiryDate(startDateStr, billingCycle) {
        if (!startDateStr || billingCycle === 'one-time') return '';

        const startDate = new Date(startDateStr);
        const today = new Date();
        let nextExpiryDate = new Date(startDate);

        if (billingCycle === 'monthly') {
            while (nextExpiryDate <= today) {
                nextExpiryDate.setMonth(nextExpiryDate.getMonth() + 1);
            }
        } else if (billingCycle === 'annually') {
            while (nextExpiryDate <= today) {
                nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
            }
        }

        return nextExpiryDate.toISOString().split('T')[0];
    }

    // 计算距离到期日期还有多少天
    function getDaysUntilExpiry(expiryDateStr) {
        if (!expiryDateStr) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiryDate = new Date(expiryDateStr);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    // 根据到期日期距离，返回状态标签
    function getExpiryStatusLabel(daysUntilExpiry) {
        if (daysUntilExpiry === null) return '';

        if (daysUntilExpiry < 0) {
            return `<span class="expiry-status overdue">已过期 ${Math.abs(daysUntilExpiry)} 天</span>`;
        } else if (daysUntilExpiry === 0) {
            return `<span class="expiry-status today">今天到期</span>`;
        } else if (daysUntilExpiry <= 7) {
            return `<span class="expiry-status soon">即将到期 (还有 ${daysUntilExpiry} 天)</span>`;
        } else {
            return `<span class="expiry-status ok">还有 ${daysUntilExpiry} 天到期</span>`;
        }
    }

    // 添加事件监听器，自动计算到期日期
    // 这些事件监听器会在DOM元素初始化后添加
    // 在initializeSubscriptionsView函数中已经添加了这些事件监听器

    // 这些变量已经在上面声明过了，不需要重复声明

    // --- Exchange Rate Functions ---
    function clearExchangeRatesCache() {
        window.exchangeRatesCache = { timestamp: null, base: '', rates: {} };
        localStorage.removeItem(EXCHANGE_RATES_KEY);
        console.log("Exchange rates cache cleared.");
    }

    function loadExchangeRatesCache() {
        const storedRates = localStorage.getItem(EXCHANGE_RATES_KEY);
        if (storedRates) {
            window.exchangeRatesCache = JSON.parse(storedRates);
            console.log("Loaded exchange rates from cache:", window.exchangeRatesCache);
        }
    }

    function saveExchangeRatesCache() {
        localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(window.exchangeRatesCache));
        console.log("Saved exchange rates to cache:", window.exchangeRatesCache);
    }

    async function fetchExchangeRates(forceUpdate = false) {
        // 检查API Key是否设置
        if (!appSettings.apiKey) {
            console.warn("API Key未设置，无法获取汇率数据。请在设置中添加API Key。");
            return null;
        }

        // 检查本地货币是否设置
        if (!appSettings.localCurrency) {
            console.warn("本地货币未设置，无法获取汇率数据。");
            return null;
        }

        // 计算缓存年龄（小时）
        const now = new Date().getTime();
        const cacheAge = window.exchangeRatesCache.timestamp ? (now - window.exchangeRatesCache.timestamp) / (1000 * 60 * 60) : Infinity;

        // 获取当前用户的刷新频率
        const refreshFrequency = getRefreshFrequency();

        // 如果是开发者模式且强制更新，或者缓存已过期，则获取新数据
        // 否则使用缓存数据
        if (!forceUpdate &&
            window.exchangeRatesCache.rates &&
            Object.keys(window.exchangeRatesCache.rates).length > 0 &&
            (refreshFrequency === 0 ? true : cacheAge < refreshFrequency)) {

            console.log("使用缓存的汇率数据（缓存年龄：" + cacheAge.toFixed(2) + "小时，刷新频率：" +
                        (refreshFrequency === 0 ? "无限制" : refreshFrequency + "小时") + "）");
            return window.exchangeRatesCache.rates;
        }

        // 获取新的汇率数据
        console.log(`正在获取新的汇率数据，基准货币: ${appSettings.localCurrency}...`);
        try {
            // 构建API请求URL
            const apiUrl = `https://v6.exchangerate-api.com/v6/${appSettings.apiKey}/latest/${appSettings.localCurrency}`;
            console.log("API请求URL:", apiUrl);

            // 发送请求
            const response = await fetch(apiUrl);

            // 检查响应状态
            if (!response.ok) {
                const errorData = await response.json();
                console.error("获取汇率失败:", response.status, errorData);
                alert(`获取汇率失败: ${errorData['error-type'] || response.statusText}`);
                return null;
            }

            // 解析响应数据
            const data = await response.json();
            console.log("API返回数据:", data);

            // 检查API返回结果
            if (data.result === "success") {
                // 更新缓存
                window.exchangeRatesCache = {
                    timestamp: now,
                    base: data.base_code,
                    rates: data.conversion_rates
                };

                // 保存缓存
                saveExchangeRatesCache();

                // 更新API调用计数器和最后一次API调用日期
                appSettings.apiCallCount++;
                appSettings.lastApiCallDate = new Date().toISOString();
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));

                // 更新API使用情况显示
                updateApiUsageInfo();

                // 检查返回的基准货币是否与请求的相同
                if (data.base_code !== appSettings.localCurrency) {
                    console.warn(`注意：API返回的基准货币(${data.base_code})与请求的(${appSettings.localCurrency})不同。这是exchangerate-api.com免费版的限制，汇率将通过USD进行换算。`);
                }

                console.log("成功获取并缓存新的汇率数据:", window.exchangeRatesCache);
                console.log(`API调用计数：${appSettings.apiCallCount}，刷新频率：${getRefreshFrequency()}小时`);
                return window.exchangeRatesCache.rates;
            } else {
                // API返回错误
                console.error("API返回错误:", data['error-type']);
                alert(`获取汇率API返回错误: ${data['error-type']}`);
                return null;
            }
        } catch (error) {
            // 网络错误或其他异常
            console.error("获取汇率时发生网络错误:", error);
            alert("网络错误，无法获取汇率信息。请检查您的网络连接。");
            return null;
        }
    }

    function getConvertedPrice(originalPrice, originalCurrency, rates, targetCurrency) {
        if (!rates || typeof originalPrice !== 'number' || !originalCurrency || !targetCurrency) {
            console.warn("getConvertedPrice: Invalid input", {originalPrice, originalCurrency, rates, targetCurrency});
            return null;
        }

        const originalCurrencyUpperCase = originalCurrency.toUpperCase();
        const targetCurrencyUpperCase = targetCurrency.toUpperCase();

        // 如果原始货币和目标货币相同，直接返回原始价格
        if (originalCurrencyUpperCase === targetCurrencyUpperCase) {
            return originalPrice.toFixed(2);
        }

        // 检查汇率数据是否可用
        if (!rates[originalCurrencyUpperCase] || !rates[targetCurrencyUpperCase]) {
            console.warn(`找不到 ${originalCurrencyUpperCase} 或 ${targetCurrencyUpperCase} 的汇率数据`, rates);
            return null;
        }

        // 获取基准货币
        const baseCurrency = window.exchangeRatesCache.base;
        console.log(`汇率基准货币: ${baseCurrency}`);

        // 如果基准货币是目标货币（例如：基准是CNY，目标也是CNY）
        if (baseCurrency === targetCurrencyUpperCase) {
            // 直接使用原始货币对基准货币的汇率
            // 例如：基准是CNY，原始是USD，rates[USD] = 0.14（表示1CNY=0.14USD）
            // 那么1USD = 1/0.14 CNY = 7.14 CNY
            const rate = rates[originalCurrencyUpperCase];
            // 原始价格 / 汇率 = 目标货币价格
            // 例如：100USD * (1/0.14) = 714.29 CNY
            return (originalPrice / rate).toFixed(2);
        }

        // 如果基准货币是原始货币（例如：基准是USD，原始也是USD）
        if (baseCurrency === originalCurrencyUpperCase) {
            // 直接使用目标货币对基准货币的汇率
            // 例如：基准是USD，目标是CNY，rates[CNY] = 7.14（表示1USD=7.14CNY）
            const rate = rates[targetCurrencyUpperCase];
            // 原始价格 * 汇率 = 目标货币价格
            // 例如：100USD * 7.14 = 714 CNY
            return (originalPrice * rate).toFixed(2);
        }

        // 如果基准货币既不是原始货币也不是目标货币（例如：基准是EUR，原始是USD，目标是CNY）
        // 需要通过基准货币进行两步换算：原始货币 -> 基准货币 -> 目标货币

        // 1. 获取原始货币和目标货币相对于基准货币的汇率
        const rateOriginalToBase = rates[originalCurrencyUpperCase]; // 例如：1EUR = 1.1USD，则rateOriginalToBase = 1.1
        const rateTargetToBase = rates[targetCurrencyUpperCase];   // 例如：1EUR = 7.8CNY，则rateTargetToBase = 7.8

        // 2. 计算原始价格对应的基准货币金额
        // 例如：100USD / 1.1 = 90.91EUR
        const priceInBaseCurrency = originalPrice / rateOriginalToBase;

        // 3. 将基准货币金额转换为目标货币
        // 例如：90.91EUR * 7.8 = 709.09CNY
        const priceInTargetCurrency = priceInBaseCurrency * rateTargetToBase;

        // 4. 返回结果，保留两位小数
        return priceInTargetCurrency.toFixed(2);
    }

    // --- Data Functions ---
    function saveSubscriptions() {
        localStorage.setItem(window.STORAGE_KEY, JSON.stringify(window.subscriptions));
    }

    function loadSubscriptions() {
        // 确保 window.subscriptions 总是一个数组，即使 localStorage 为空或数据无效
        window.subscriptions = [];

        const storedSubscriptions = localStorage.getItem(window.STORAGE_KEY);
        if (storedSubscriptions) {
            try {
                const parsedSubscriptions = JSON.parse(storedSubscriptions);
                // 确保解析出来的是数组
                if (Array.isArray(parsedSubscriptions)) {
                    window.subscriptions = parsedSubscriptions;

                    window.subscriptions = window.subscriptions.map(sub => {
                        if (sub.startDate && sub.billingCycle !== 'one-time' && !sub.expiryDate) {
                            sub.expiryDate = calculateExpiryDate(sub.startDate, sub.billingCycle);
                        }
                        return sub;
                    });

                    // 为没有图标的订阅异步获取图标
                    (async () => {
                        let hasUpdates = false;
                        for (const sub of window.subscriptions) {
                            if (!sub.serviceIcon) {
                                try {
                                    const icon = await getServiceIcon(sub);
                                    if (icon) {
                                        sub.serviceIcon = icon;
                                        hasUpdates = true;
                                    }
                                } catch (error) {
                                    console.error(`为订阅 ${sub.serviceName} 获取图标时出错:`, error);
                                }
                            }
                        }

                        if (hasUpdates) {
                            saveSubscriptions(); // 保存带有新图标的订阅
                            // 考虑优化：仅当当前视图为订阅视图时才调用 renderSubscriptions
                            renderSubscriptions();
                        }
                    })();
                    // 在所有潜在修改后（map同步修改，async异步获取图标修改）保存一次。
                    // 注意：如果 async 操作耗时较长，这里的 saveSubscriptions 可能在图标获取完成前执行。
                    // 一个更健壮的模式是等待 async 操作完成后再统一保存。
                    // 但为了保持现有逻辑，暂时将 saveSubscriptions 移到最后。
                } else {
                    console.warn("localStorage 中的 'subscriptionsData' 不是一个有效的数组，已重置为空数组。");
                    // window.subscriptions 已经是 [] 了
                }
            } catch (e) {
                console.error("从 localStorage 解析订阅数据失败，已重置为空数组:", e);
                // window.subscriptions 已经是 [] 了
            }
        }
        // 确保最终状态被保存，即使是从空localStorage开始或解析失败。
        saveSubscriptions();
    }

    // --- Rendering Functions ---
    function renderSubscriptions(category = 'all') {
        if (!window.subscriptionListDiv) return;

        window.subscriptionListDiv.innerHTML = '';

        if (window.subscriptions.length === 0) {
            const placeholder = document.createElement('p');
            placeholder.textContent = '还没有添加任何订阅。';
            placeholder.style.fontStyle = 'italic';
            placeholder.style.color = '#777';
            window.subscriptionListDiv.appendChild(placeholder);

            if (window.notificationPanel) {
                window.notificationPanel.classList.add('hidden');
            }
            return;
        }

        // 移除所有滑动相关的事件监听器
        removeAllSwipeListeners();

        // 按分类筛选
        let filteredSubscriptions = window.subscriptions;
        if (category !== 'all') {
            filteredSubscriptions = filterSubscriptionsByCategory(category);

            if (filteredSubscriptions.length === 0) {
                const placeholder = document.createElement('p');
                placeholder.textContent = `没有找到分类为"${getCategoryName(category)}"的订阅。`;
                placeholder.style.fontStyle = 'italic';
                placeholder.style.color = '#777';
                window.subscriptionListDiv.appendChild(placeholder);
                return;
            }
        }

        const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
            if (!a.expiryDate && !b.expiryDate) return 0;
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;

            const daysA = getDaysUntilExpiry(a.expiryDate);
            const daysB = getDaysUntilExpiry(b.expiryDate);

            if (daysA < 0 && daysB >= 0) return -1;
            if (daysA >= 0 && daysB < 0) return 1;

            return daysA - daysB;
        });

        let overdueItems = [];
        let expiringSoonItems = [];

        fetchExchangeRates().then(rates => {
            if (!window.subscriptionListDiv) return;

            if (sortedSubscriptions.length === 0 && window.subscriptionListDiv.querySelector('p')) {
            } else {
                window.subscriptionListDiv.innerHTML = '';
                if (sortedSubscriptions.length === 0) {
                    const placeholder = document.createElement('p');
                    placeholder.textContent = '还没有添加任何订阅。';
                    placeholder.style.fontStyle = 'italic';
                    placeholder.style.color = '#777';
                    window.subscriptionListDiv.appendChild(placeholder);
                    if (window.notificationPanel) {
                        window.notificationPanel.classList.add('hidden');
                    }
                    return;
                }
            }

            sortedSubscriptions.forEach(sub => {
                const newItemDiv = document.createElement('div');
                newItemDiv.classList.add('subscription-item');
                newItemDiv.setAttribute('data-id', sub.id);
                newItemDiv.id = `subscription-${sub.id}`; // 添加ID属性，以便通知点击时能够定位

                const daysUntilExpiry = sub.expiryDate ? getDaysUntilExpiry(sub.expiryDate) : null;

                if (daysUntilExpiry !== null) {
                    if (daysUntilExpiry < 0) {
                        newItemDiv.classList.add('overdue');
                        overdueItems.push({
                            name: sub.serviceName,
                            days: Math.abs(daysUntilExpiry),
                            id: sub.id,
                            icon: sub.serviceIcon
                        });
                    } else if (daysUntilExpiry <= 7) {
                        newItemDiv.classList.add('expiring-soon');
                        expiringSoonItems.push({
                            name: sub.serviceName,
                            days: daysUntilExpiry,
                            id: sub.id,
                            icon: sub.serviceIcon
                        });
                    }
                }

                // 构建图标HTML
                let iconHtml = '';
                if (sub.serviceIcon) {
                    iconHtml = `<img src="${sub.serviceIcon}" alt="${sub.serviceName}" class="service-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = sub.serviceName.charAt(0).toUpperCase();
                    iconHtml = `<div class="service-icon-placeholder">${firstLetter}</div>`;
                }

                let htmlContent = `
                <div class="subscription-header">
                    ${iconHtml}
                    <h3>${sub.serviceName}</h3>
                </div>`;

                const price = parseFloat(sub.price);
                const currency = sub.currency.toUpperCase();
                // 添加调试日志，跟踪汇率换算过程
                console.log(`Converting price: ${price} ${currency} to ${window.appSettings.localCurrency}`, rates);
                const localPrice = getConvertedPrice(price, currency, rates, window.appSettings.localCurrency);
                console.log(`Conversion result: ${price} ${currency} = ${localPrice} ${window.appSettings.localCurrency}`);

                const localPriceHTML = localPrice ? `<p><strong>价格:</strong> ${price} ${currency} <span class="local-price">(约 ${localPrice} ${window.appSettings.localCurrency})</span></p>` : `<p><strong>价格:</strong> ${price} ${currency}</p>`;

                htmlContent += localPriceHTML;

                htmlContent += `<p><strong>订阅周期:</strong> ${getBillingCycleText(sub.billingCycle)}</p>`;

                // 显示分类信息
                const categoryName = getCategoryName(sub.category || 'other');
                htmlContent += `<p><strong>分类:</strong> <span class="category-tag ${sub.category || 'other'}">${categoryName}</span></p>`;

                if (sub.startDate) {
                    htmlContent += `<p><strong>首次订阅日期:</strong> ${sub.startDate}</p>`;
                }

                if (sub.expiryDate) {
                    const expiryStatusLabel = getExpiryStatusLabel(daysUntilExpiry);
                    htmlContent += `<p><strong>到期日期:</strong> ${sub.expiryDate} ${expiryStatusLabel}</p>`;
                } else if (sub.billingCycle === 'one-time') {
                    htmlContent += `<p><strong>到期日期:</strong> 一次性购买，无到期日期</p>`;
                } else {
                    htmlContent += `<p><strong>到期日期:</strong> 未指定</p>`;
                }

                // 新增：显示支付账户信息
                if (sub.paymentAccount) {
                    htmlContent += `<p><strong>支付账户:</strong> ${sub.paymentAccount}</p>`;
                }

                // 新增：显示价格历史/说明信息
                if (sub.priceHistoryNotes) {
                    htmlContent += `<p><strong>价格历史/说明:</strong> ${sub.priceHistoryNotes}</p>`;
                }

                htmlContent += `
                    <div class="actions">
                        <button class="edit-btn">编辑</button>
                        <button class="delete-btn">删除</button>
                    </div>`;
                // 添加滑动删除确认按钮
                const deleteConfirmBtn = document.createElement('div');
                deleteConfirmBtn.className = 'swipe-delete-confirm';
                deleteConfirmBtn.innerHTML = '删除 <i class="fas fa-trash"></i>';
                deleteConfirmBtn.setAttribute('data-id', sub.id);

                newItemDiv.innerHTML = htmlContent;
                newItemDiv.appendChild(deleteConfirmBtn);
                window.subscriptionListDiv.appendChild(newItemDiv);

                // 为每个订阅项添加滑动事件
                addSwipeListeners(newItemDiv);
            });

            updateNotificationPanel(overdueItems, expiringSoonItems);
        });
    }

    function getBillingCycleText(cycleValue) {
        switch (cycleValue) {
            case 'monthly': return '每月';
            case 'annually': return '每年';
            case 'one-time': return '一次性';
            default: return cycleValue;
        }
    }

    // 更新提醒面板
    function updateNotificationPanel(overdueItems, expiringSoonItems) {
        if (!window.notificationPanel || !window.notificationContent) return;

        if (overdueItems.length === 0 && expiringSoonItems.length === 0) {
            window.notificationPanel.classList.add('hidden');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (window.appSettings.notificationDismissed && window.appSettings.lastNotificationDate === today) {
            window.notificationPanel.classList.add('hidden');
            return;
        }

        window.appSettings.notificationDismissed = false;

        let notificationHtml = '';

        if (overdueItems.length > 0) {
            notificationHtml += '<div><strong>已过期订阅:</strong></div>';
            overdueItems.forEach(item => {
                // 构建图标HTML
                let iconHtml = '';
                if (item.icon) {
                    iconHtml = `<img src="${item.icon}" alt="${item.name}" class="notification-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = item.name.charAt(0).toUpperCase();
                    iconHtml = `<div class="notification-icon-placeholder">${firstLetter}</div>`;
                }

                notificationHtml += `<div class="notification-item overdue">
                    ${iconHtml}
                    <div class="notification-text">
                        <strong>${item.name}</strong> - 已过期 ${item.days} 天
                    </div>
                </div>`;
            });
        }

        if (expiringSoonItems.length > 0) {
            notificationHtml += '<div><strong>即将到期订阅:</strong></div>';
            expiringSoonItems.forEach(item => {
                // 构建图标HTML
                let iconHtml = '';
                if (item.icon) {
                    iconHtml = `<img src="${item.icon}" alt="${item.name}" class="notification-icon" />`;
                } else {
                    // 如果没有图标，使用首字母作为占位符
                    const firstLetter = item.name.charAt(0).toUpperCase();
                    iconHtml = `<div class="notification-icon-placeholder">${firstLetter}</div>`;
                }

                const dayText = item.days === 0 ? '今天' : `${item.days} 天后`;
                notificationHtml += `<div class="notification-item expiring-soon">
                    ${iconHtml}
                    <div class="notification-text">
                        <strong>${item.name}</strong> - ${dayText}到期
                    </div>
                </div>`;
            });
        }

        window.notificationContent.innerHTML = notificationHtml;
        window.notificationPanel.classList.remove('hidden');
    }

    // --- Event Handlers ---
    // 这些事件处理程序会在DOM元素初始化后添加
    // 在initializeSubscriptionsView函数中已经添加了这些事件处理程序
    function handleSubscriptionFormSubmit(event) {
        event.preventDefault();

        const serviceName = document.getElementById('service-name').value;
        const serviceUrl = document.getElementById('service-url').value.trim();
        const price = document.getElementById('price').value;
        const currency = document.getElementById('currency').value.trim().toUpperCase();
        const billingCycle = document.getElementById('billing-cycle').value;
        const category = document.getElementById('category').value;
        const startDate = document.getElementById('start-date').value;
        let expiryDate = document.getElementById('expiry-date').value;
        const notes = document.getElementById('notes').value.trim();
        const autoCalculate = document.getElementById('auto-calculate').checked;
        const paymentAccount = window.paymentAccountInput ? window.paymentAccountInput.value.trim() : ''; // 新增：获取支付账户信息
        const priceHistoryNotes = window.priceHistoryNotesInput ? window.priceHistoryNotesInput.value.trim() : ''; // 新增：获取价格历史信息

            if (!serviceName || !price || !currency) {
                alert('请填写所有必填项（服务名称、价格、币种）。');
                return;
            }

            if (autoCalculate && billingCycle !== 'one-time' && startDate) {
                expiryDate = calculateExpiryDate(startDate, billingCycle);
            } else if (billingCycle === 'one-time') {
                expiryDate = '';
            }

        // 先保存订阅，然后异步获取图标
        let serviceIcon = null;

            if (window.editingId !== null) {
                const index = window.subscriptions.findIndex(sub => sub.id === window.editingId);
                if (index !== -1) {
                    window.subscriptions[index] = {
                        ...window.subscriptions[index],
                    serviceName,
                    serviceUrl,
                    price,
                    currency,
                    billingCycle,
                    category,
                    startDate,
                    expiryDate,
                    notes,
                    autoCalculate,
                    serviceIcon,
                    paymentAccount, // 新增：保存支付账户
                    priceHistoryNotes // 新增：保存价格历史
                    };
                }
                window.editingId = null;
                if (window.submitButton) {
                    window.submitButton.textContent = '添加订阅';
                }
            } else {
                const newSubscription = {
                    id: Date.now(),
                serviceName,
                serviceUrl,
                price,
                currency,
                billingCycle,
                category,
                startDate,
                expiryDate,
                notes,
                autoCalculate,
                serviceIcon,
                paymentAccount, // 新增：保存支付账户
                priceHistoryNotes // 新增：保存价格历史
                };
                window.subscriptions.push(newSubscription);
            }

            saveSubscriptions();

        // 异步获取并更新图标
            (async () => {
                try {
                // 找到刚刚添加/编辑的订阅
                const subscription = window.subscriptions.find(sub =>
                    window.editingId === null ? sub.id === window.subscriptions[window.subscriptions.length - 1].id : sub.id === window.editingId
                );

                    if (subscription) {
                    // 获取图标
                        const icon = await getServiceIcon(subscription);

                    // 更新订阅的图标
                        if (icon) {
                            subscription.serviceIcon = icon;
                            saveSubscriptions();
                            renderSubscriptions();
                        updateStatistics(); // 更新统计信息
                        }
                    }
                } catch (error) {
                    console.error("获取服务图标时出错:", error);
                }
            })();

            renderSubscriptions();
            updateStatistics(); // 更新统计信息
            if (window.subscriptionForm) {
                window.subscriptionForm.reset();
            }
            if (window.paymentAccountInput) {
                window.paymentAccountInput.value = ''; // 新增：重置支付账户输入框
            }
            if (window.priceHistoryNotesInput) {
                window.priceHistoryNotesInput.value = ''; // 新增：重置价格历史输入框
            }
            if (window.autoCalculateCheck) {
                window.autoCalculateCheck.checked = true;
            }
        }

    // 订阅列表点击事件处理
    function handleSubscriptionListClick(event) {
        const target = event.target;
        const subscriptionItem = target.closest('.subscription-item');
        if (!subscriptionItem) return;

        const subscriptionId = Number(subscriptionItem.getAttribute('data-id'));

        if (target.classList.contains('delete-btn')) {
            deleteSubscription(subscriptionId);
        } else if (target.classList.contains('edit-btn')) {
            populateFormForEdit(subscriptionId);
        }
    }

    function deleteSubscription(id) {
        window.subscriptions = window.subscriptions.filter(sub => sub.id !== id);
        saveSubscriptions();
        renderSubscriptions();
        updateStatistics(); // 更新统计信息
        if (window.editingId === id) {
            window.editingId = null;
            if (window.submitButton) {
                window.submitButton.textContent = '添加订阅';
            }
            if (window.subscriptionForm) {
                window.subscriptionForm.reset();
            }
            if (window.autoCalculateCheck) {
                window.autoCalculateCheck.checked = true;
            }
        }
    }

    function populateFormForEdit(id) {
        const sub = window.subscriptions.find(s => s.id === id);
        if (sub) {
            document.getElementById('service-name').value = sub.serviceName;
            document.getElementById('service-url').value = sub.serviceUrl || '';
            document.getElementById('price').value = sub.price;
            document.getElementById('currency').value = sub.currency;
            document.getElementById('billing-cycle').value = sub.billingCycle;
            document.getElementById('category').value = sub.category || 'other';
            document.getElementById('start-date').value = sub.startDate || '';
            document.getElementById('expiry-date').value = sub.expiryDate || '';
            document.getElementById('notes').value = sub.notes || '';
            document.getElementById('auto-calculate').checked = sub.autoCalculate !== undefined ? sub.autoCalculate : true;
            if (window.paymentAccountInput) window.paymentAccountInput.value = sub.paymentAccount || ''; // 新增：填充支付账户信息
            if (window.priceHistoryNotesInput) window.priceHistoryNotesInput.value = sub.priceHistoryNotes || ''; // 新增：填充价格历史信息

            window.editingId = id;
            if (window.submitButton) window.submitButton.textContent = '更新订阅';
            window.scrollTo(0, 0);
        }
    }

    // --- 滑动删除功能 ---
    let swipeListeners = [];

    // 添加滑动事件监听器
    function addSwipeListeners(element) {
        if (!element) return;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let longPressTimer = null;
        const SWIPE_THRESHOLD = 80; // 滑动阈值，超过这个值会触发删除确认
        const LONG_PRESS_DURATION = 500; // 长按时间阈值（毫秒）

        // 触摸开始事件
        const touchStartHandler = function(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
            element.classList.add('swiping');

            // 设置长按定时器
            longPressTimer = setTimeout(() => {
                // 长按触发编辑功能
                const id = Number(element.getAttribute('data-id'));
                populateFormForEdit(id);

                // 添加视觉反馈
                element.classList.add('long-press-active');
                setTimeout(() => {
                    element.classList.remove('long-press-active');
                }, 200);

                // 清除定时器
                longPressTimer = null;
            }, LONG_PRESS_DURATION);

            e.preventDefault();
        };

        // 触摸移动事件
        const touchMoveHandler = function(e) {
            // 如果移动了，取消长按定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (!isDragging) return;

            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;

            // 只允许向左滑动（负值）
            if (diffX < 0 && Math.abs(diffX) > 10) {
                // 限制最大滑动距离
                const moveX = Math.max(diffX, -SWIPE_THRESHOLD);

                // 如果滑动距离超过阈值，添加删除状态类
                if (Math.abs(moveX) >= SWIPE_THRESHOLD) {
                    element.classList.add('swipe-delete');
                } else {
                    element.classList.remove('swipe-delete');
                }

                e.preventDefault();
            }
        };

        // 触摸结束事件
        const touchEndHandler = function() {
            isDragging = false;
            element.classList.remove('swiping');

            // 清除长按定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            // 如果滑动距离超过阈值，保持删除状态
            if (element.classList.contains('swipe-delete')) {
                // 不做任何操作，保持删除状态直到用户确认或取消
            } else {
                // 重置状态
                element.style.transform = '';
            }
        };

        // 点击事件，用于处理删除确认按钮的点击
        const clickHandler = function(e) {
            if (e.target.closest('.swipe-delete-confirm')) {
                const id = Number(e.target.closest('.swipe-delete-confirm').getAttribute('data-id'));
                deleteSubscription(id);
                e.stopPropagation();
            } else if (element.classList.contains('swipe-delete')) {
                // 点击其他区域取消删除状态
                element.classList.remove('swipe-delete');
                e.stopPropagation();
                return false;
            }
        };

        // 添加事件监听器
        element.addEventListener('touchstart', touchStartHandler, { passive: false });
        element.addEventListener('touchmove', touchMoveHandler, { passive: false });
        element.addEventListener('touchend', touchEndHandler);
        element.addEventListener('click', clickHandler);

        // 保存监听器引用，以便后续移除
        swipeListeners.push({
            element,
            listeners: {
                touchstart: touchStartHandler,
                touchmove: touchMoveHandler,
                touchend: touchEndHandler,
                click: clickHandler
            }
        });
    }

    // 移除所有滑动事件监听器
    function removeAllSwipeListeners() {
        swipeListeners.forEach(item => {
            const { element, listeners } = item;
            if (element) {
                element.removeEventListener('touchstart', listeners.touchstart);
                element.removeEventListener('touchmove', listeners.touchmove);
                element.removeEventListener('touchend', listeners.touchend);
                element.removeEventListener('click', listeners.click);
            }
        });
        swipeListeners = [];
    }

    // --- 服务图标相关函数 ---

    // 图标缓存
    const ICONS_CACHE_KEY = 'subscriptionServiceIcons';
    let iconsCache = {};

    // 加载图标缓存
    function loadIconsCache() {
        const storedIcons = localStorage.getItem(ICONS_CACHE_KEY);
        if (storedIcons) {
            iconsCache = JSON.parse(storedIcons);
            console.log("已加载图标缓存:", Object.keys(iconsCache).length, "个图标");
        }
    }

    // 保存图标缓存
    function saveIconsCache() {
        localStorage.setItem(ICONS_CACHE_KEY, JSON.stringify(iconsCache));
        console.log("已保存图标缓存:", Object.keys(iconsCache).length, "个图标");
    }

    // 从URL中提取域名
    function extractDomain(url) {
        if (!url) return null;

        try {
            // 尝试使用URL API解析URL
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (error) {
            // 如果URL格式不正确，尝试简单的正则表达式提取
            const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
            return match ? match[1] : null;
        }
    }

    // 获取服务图标
    async function getServiceIcon(subscription) {
        // 如果没有服务名称，返回null
        if (!subscription.serviceName) {
            return null;
        }

        // 生成缓存键
        const cacheKey = subscription.serviceUrl || subscription.serviceName.toLowerCase();

        // 如果缓存中有图标，直接返回
        if (iconsCache[cacheKey]) {
            console.log(`使用缓存的图标: ${cacheKey}`);
            return iconsCache[cacheKey];
        }

        // 尝试从URL获取图标
        if (subscription.serviceUrl) {
            const domain = extractDomain(subscription.serviceUrl);
            if (domain) {
                try {
                    // 使用Google的favicon服务获取图标
                    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                    // 缓存图标URL
                    iconsCache[cacheKey] = iconUrl;
                    saveIconsCache();

                    console.log(`已获取并缓存图标: ${cacheKey} -> ${iconUrl}`);
                    return iconUrl;
                } catch (error) {
                    console.error(`获取图标失败: ${domain}`, error);
                }
            }
        }

        // 如果无法从URL获取图标，尝试使用服务名称
        try {
            // 使用服务名称搜索图标
            const serviceName = subscription.serviceName.toLowerCase();

            // 常见服务的图标映射
            const commonServices = {
                'netflix': 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64',
                'spotify': 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64',
                'amazon': 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64',
                'amazon prime': 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64',
                'disney': 'https://www.google.com/s2/favicons?domain=disney.com&sz=64',
                'disney+': 'https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64',
                'hulu': 'https://www.google.com/s2/favicons?domain=hulu.com&sz=64',
                'youtube': 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
                'youtube premium': 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
                'apple': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
                'apple music': 'https://www.google.com/s2/favicons?domain=music.apple.com&sz=64',
                'apple tv': 'https://www.google.com/s2/favicons?domain=tv.apple.com&sz=64',
                'icloud': 'https://www.google.com/s2/favicons?domain=icloud.com&sz=64',
                'google': 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
                'google one': 'https://www.google.com/s2/favicons?domain=one.google.com&sz=64',
                'microsoft': 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64',
                'office': 'https://www.google.com/s2/favicons?domain=office.com&sz=64',
                'office 365': 'https://www.google.com/s2/favicons?domain=office.com&sz=64',
                'xbox': 'https://www.google.com/s2/favicons?domain=xbox.com&sz=64',
                'playstation': 'https://www.google.com/s2/favicons?domain=playstation.com&sz=64',
                'nintendo': 'https://www.google.com/s2/favicons?domain=nintendo.com&sz=64',
                'steam': 'https://www.google.com/s2/favicons?domain=steampowered.com&sz=64',
                'epic games': 'https://www.google.com/s2/favicons?domain=epicgames.com&sz=64',
                'dropbox': 'https://www.google.com/s2/favicons?domain=dropbox.com&sz=64',
                'github': 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
                'adobe': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'photoshop': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'lightroom': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
                'creative cloud': 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64'
            };

            // 检查服务名称是否匹配常见服务
            for (const [key, value] of Object.entries(commonServices)) {
                if (serviceName.includes(key)) {
                    iconsCache[cacheKey] = value;
                    saveIconsCache();
                    console.log(`已匹配常见服务图标: ${serviceName} -> ${value}`);
                    return value;
                }
            }

            // 如果没有匹配到常见服务，尝试使用服务名称的第一个字母作为图标
            const firstLetter = subscription.serviceName.charAt(0).toUpperCase();
            const letterIconUrl = `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=64`;

            iconsCache[cacheKey] = letterIconUrl;
            saveIconsCache();

            console.log(`使用字母图标: ${serviceName} -> ${letterIconUrl}`);
            return letterIconUrl;

        } catch (error) {
            console.error(`获取图标失败: ${subscription.serviceName}`, error);
            return null;
        }
    }

    // 通知设置相关事件处理
    // 这些事件监听器会在DOM元素初始化后添加
    // 在initializeSettingsView函数中已经添加了这些事件监听器

    // --- 数据导入/导出功能 ---

    // 导出为JSON和CSV的事件监听器
    // 这些事件监听器会在DOM元素初始化后添加
    // 在initializeSettingsView函数中已经添加了这些事件监听器

    // 导出数据
    function exportData(format) {
        if (subscriptions.length === 0) {
            alert('没有可导出的订阅数据。');
            return;
        }

        let dataStr, fileName, mimeType;

        if (format === 'json') {
            // 准备JSON数据
            const exportData = {
                subscriptions: subscriptions,
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0'
            };

            dataStr = JSON.stringify(exportData, null, 2);
            fileName = `subscription_data_${formatDateForFileName(new Date())}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            // 准备CSV数据
            const headers = ['服务名称', '服务网址', '价格', '币种', '订阅周期', '分类', '首次订阅日期', '到期日期', '备注'];
            const rows = subscriptions.map(sub => [
                sub.serviceName,
                sub.serviceUrl || '',
                sub.price,
                sub.currency,
                getBillingCycleText(sub.billingCycle),
                getCategoryName(sub.category || 'other'),
                sub.startDate || '',
                sub.expiryDate || '',
                sub.notes || ''
            ]);

            // 添加BOM以确保Excel正确识别UTF-8编码
            dataStr = '\uFEFF' + [
                headers.join(','),
                ...rows.map(row => row.map(cell => {
                    // 处理包含逗号、引号或换行符的单元格
                    if (cell && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(','))
            ].join('\n');

            fileName = `subscription_data_${formatDateForFileName(new Date())}.csv`;
            mimeType = 'text/csv;charset=utf-8';
        } else {
            console.error('不支持的导出格式:', format);
            return;
        }

        // 创建下载链接
        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // 格式化日期为文件名
    function formatDateForFileName(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 文件选择事件处理和导入按钮点击事件
    // 这些事件监听器会在DOM元素初始化后添加
    // 在initializeSettingsView函数中已经添加了这些事件监听器

    // 导入JSON数据
    function importJsonData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
                throw new Error('无效的JSON格式：缺少订阅数据数组');
            }

            // 验证导入的数据
            const validSubscriptions = data.subscriptions.filter(sub => {
                return sub && typeof sub === 'object' && sub.serviceName && sub.price && sub.currency;
            });

            if (validSubscriptions.length === 0) {
                throw new Error('没有找到有效的订阅数据');
            }

            // 替换或合并数据
            if (importReplaceCheckbox.checked) {
                subscriptions = validSubscriptions;
                importStatusDiv.textContent = `成功导入 ${validSubscriptions.length} 条订阅数据（替换模式）。`;
            } else {
                // 合并数据，避免重复
                const existingIds = new Set(subscriptions.map(sub => sub.id));
                let newCount = 0;

                validSubscriptions.forEach(sub => {
                    // 为导入的订阅生成新ID，避免冲突
                    if (!sub.id || existingIds.has(sub.id)) {
                        sub.id = Date.now() + Math.floor(Math.random() * 1000) + newCount;
                        newCount++;
                    }
                    subscriptions.push(sub);
                });

                importStatusDiv.textContent = `成功导入 ${validSubscriptions.length} 条订阅数据（合并模式）。`;
            }

            importStatusDiv.className = 'import-status success';
            saveSubscriptions();
            renderSubscriptions();
            updateStatistics(); // 更新统计信息

        } catch (error) {
            console.error('解析JSON数据时出错:', error);
            throw new Error(`解析JSON数据时出错: ${error.message}`);
        }
    }

    // 导入CSV数据
    function importCsvData(csvString) {
        try {
            // 移除BOM标记
            if (csvString.charCodeAt(0) === 0xFEFF) {
                csvString = csvString.slice(1);
            }

            // 解析CSV
            const lines = csvString.split('\n');
            if (lines.length < 2) {
                throw new Error('CSV文件格式无效或为空');
            }

            const headers = parseCSVLine(lines[0]);

            // 检查标题行是否包含必要的字段
            if (!headers.includes('服务名称') || !headers.includes('价格') || !headers.includes('币种')) {
                throw new Error('CSV文件缺少必要的列（服务名称、价格、币种）');
            }

            const importedSubscriptions = [];

            // 解析数据行
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // 跳过空行

                const values = parseCSVLine(line);
                if (values.length !== headers.length) {
                    console.warn(`第 ${i+1} 行的列数与标题行不匹配，已跳过`);
                    continue;
                }

                // 创建订阅对象
                const subscription = {};

                // 映射CSV列到订阅属性
                headers.forEach((header, index) => {
                    const value = values[index];

                    switch (header) {
                        case '服务名称':
                            subscription.serviceName = value;
                            break;
                        case '服务网址':
                            subscription.serviceUrl = value;
                            break;
                        case '价格':
                            subscription.price = parseFloat(value) || 0;
                            break;
                        case '币种':
                            subscription.currency = value;
                            break;
                        case '订阅周期':
                            // 将中文周期转换回英文值
                            if (value === '每月') subscription.billingCycle = 'monthly';
                            else if (value === '每年') subscription.billingCycle = 'annually';
                            else if (value === '一次性') subscription.billingCycle = 'one-time';
                            else subscription.billingCycle = value;
                            break;
                        case '分类':
                            // 将中文分类转换回英文值
                            if (value === '娱乐') subscription.category = 'entertainment';
                            else if (value === '工作') subscription.category = 'work';
                            else if (value === '教育') subscription.category = 'education';
                            else if (value === '生活方式') subscription.category = 'lifestyle';
                            else if (value === '实用工具') subscription.category = 'utility';
                            else if (value === '其他') subscription.category = 'other';
                            else subscription.category = 'other';
                            break;
                        case '首次订阅日期':
                            subscription.startDate = value;
                            break;
                        case '到期日期':
                            subscription.expiryDate = value;
                            break;
                        case '备注':
                            subscription.notes = value;
                            break;
                    }
                });

                // 验证必要字段
                if (subscription.serviceName && subscription.price && subscription.currency) {
                    // 设置默认值
                    subscription.id = Date.now() + Math.floor(Math.random() * 1000) + i;
                    subscription.autoCalculate = true;
                    importedSubscriptions.push(subscription);
                }
            }

            if (importedSubscriptions.length === 0) {
                throw new Error('没有找到有效的订阅数据');
            }

            // 替换或合并数据
            if (importReplaceCheckbox.checked) {
                subscriptions = importedSubscriptions;
                importStatusDiv.textContent = `成功导入 ${importedSubscriptions.length} 条订阅数据（替换模式）。`;
            } else {
                // 合并数据
                subscriptions = subscriptions.concat(importedSubscriptions);
                importStatusDiv.textContent = `成功导入 ${importedSubscriptions.length} 条订阅数据（合并模式）。`;
            }

            importStatusDiv.className = 'import-status success';
            saveSubscriptions();
            renderSubscriptions();
            updateStatistics(); // 更新统计信息

        } catch (error) {
            console.error('解析CSV数据时出错:', error);
            throw new Error(`解析CSV数据时出错: ${error.message}`);
        }
    }

    // 解析CSV行，处理引号和逗号
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // 处理双引号转义 ("" -> ")
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 遇到逗号且不在引号内，添加当前值并重置
                result.push(current);
                current = '';
            } else {
                // 普通字符，添加到当前值
                current += char;
            }
        }

        // 添加最后一个值
        result.push(current);

        return result;
    }

    // 发送测试通知
    function sendTestNotification() {
        sendNotification(
            '测试通知',
            {
                body: '这是一条测试通知，用于验证浏览器通知功能是否正常工作。',
                requireInteraction: true,
                onClick: () => {
                    alert('通知点击测试成功！');
                }
            }
        );
    }

    // 定期检查订阅到期情况
    function setupNotificationChecker() {
        // 页面加载时检查一次
        if (appSettings.enableNotifications && Notification.permission === 'granted') {
            checkSubscriptionsAndNotify();
        }

        // 设置定时检查（每天检查一次）
        setInterval(() => {
            if (appSettings.enableNotifications && Notification.permission === 'granted') {
                const now = new Date();
                const lastCheck = appSettings.lastNotificationCheck
                    ? new Date(appSettings.lastNotificationCheck)
                    : null;

                // 如果从未检查过，或者上次检查是在昨天或更早，则再次检查
                if (!lastCheck ||
                    now.getDate() !== lastCheck.getDate() ||
                    now.getMonth() !== lastCheck.getMonth() ||
                    now.getFullYear() !== lastCheck.getFullYear()) {

                    checkSubscriptionsAndNotify();
                }
            }
        }, 60 * 60 * 1000); // 每小时检查一次是否需要发送通知
    }

    // --- 分类和统计功能 ---

    // 获取分类的中文名称
    function getCategoryName(categoryValue) {
        const categoryMap = {
            'entertainment': '娱乐',
            'work': '工作',
            'education': '教育',
            'lifestyle': '生活方式',
            'utility': '实用工具',
            'other': '其他'
        };
        return categoryMap[categoryValue] || '其他';
    }

    // 按分类筛选订阅
    function filterSubscriptionsByCategory(category) {
        if (category === 'all') {
            return window.subscriptions;
        }
        return window.subscriptions.filter(sub => sub.category === category);
    }

    // 计算订阅的月度费用
    function calculateMonthlyPrice(subscription, rates) {
        const price = parseFloat(subscription.price);
        if (isNaN(price)) return 0;

        let monthlyPrice = 0;

        if (subscription.billingCycle === 'monthly') {
            monthlyPrice = price;
        } else if (subscription.billingCycle === 'annually') {
            monthlyPrice = price / 12;
        } else if (subscription.billingCycle === 'one-time') {
            // 一次性订阅不计入月度费用
            return 0;
        }

        // 转换为本地货币
        if (subscription.currency !== appSettings.localCurrency && rates) {
            const convertedPrice = getConvertedPrice(monthlyPrice, subscription.currency, rates, appSettings.localCurrency);
            return convertedPrice ? parseFloat(convertedPrice) : monthlyPrice;
        }

        return monthlyPrice;
    }

    // 计算订阅的年度费用
    function calculateAnnualPrice(subscription, rates) {
        const price = parseFloat(subscription.price);
        if (isNaN(price)) return 0;

        let annualPrice = 0;

        if (subscription.billingCycle === 'monthly') {
            annualPrice = price * 12;
        } else if (subscription.billingCycle === 'annually') {
            annualPrice = price;
        } else if (subscription.billingCycle === 'one-time') {
            // 一次性订阅不计入年度费用
            return 0;
        }

        // 转换为本地货币
        if (subscription.currency !== appSettings.localCurrency && rates) {
            const convertedPrice = getConvertedPrice(annualPrice, subscription.currency, rates, appSettings.localCurrency);
            return convertedPrice ? parseFloat(convertedPrice) : annualPrice;
        }

        return annualPrice;
    }

    // 更新统计数据
    function updateStatistics() {
        fetchExchangeRates().then(rates => {
            // 总订阅数
            if (window.totalSubscriptionsElement) {
                window.totalSubscriptionsElement.textContent = window.subscriptions.length;
            }

            // 计算月度和年度总支出
            let monthlyTotal = 0;
            let annualTotal = 0;

            window.subscriptions.forEach(sub => {
                monthlyTotal += calculateMonthlyPrice(sub, rates);
                annualTotal += calculateAnnualPrice(sub, rates);
            });

            // 更新显示
            if (window.monthlyTotalElement) {
                window.monthlyTotalElement.textContent = `${appSettings.localCurrency} ${monthlyTotal.toFixed(2)}`;
            }
            if (window.annualTotalElement) {
                window.annualTotalElement.textContent = `${appSettings.localCurrency} ${annualTotal.toFixed(2)}`;
            }

            // 更新图表
            updateCategoryChart(rates);
            const selectedTimeRange = window.trendTimeRangeSelect ? window.trendTimeRangeSelect.value : '12m'; // 获取当前选定时间范围
            updateTrendChart(rates, selectedTimeRange); // 传递时间范围

            // 更新价值分析图表
            const selectedAnalysisType = window.valueAnalysisTypeSelect ? window.valueAnalysisTypeSelect.value : 'price';
            updateValueAnalysisChart(rates, selectedAnalysisType);
        });
    }

    // 更新分类图表
    function updateCategoryChart(rates) {
        // 获取当前选择的图表类型
        const chartType = window.categoryChartTypeSelect ? window.categoryChartTypeSelect.value : 'doughnut';

        // 按分类统计费用
        const categoryData = {};
        const categoryColors = {
            'entertainment': 'rgba(231, 76, 60, 0.7)',
            'work': 'rgba(52, 152, 219, 0.7)',
            'education': 'rgba(155, 89, 182, 0.7)',
            'lifestyle': 'rgba(46, 204, 113, 0.7)',
            'utility': 'rgba(241, 196, 15, 0.7)',
            'other': 'rgba(149, 165, 166, 0.7)'
        };

        // 边框颜色（用于某些图表类型）
        const categoryBorderColors = {
            'entertainment': 'rgb(231, 76, 60)',
            'work': 'rgb(52, 152, 219)',
            'education': 'rgb(155, 89, 182)',
            'lifestyle': 'rgb(46, 204, 113)',
            'utility': 'rgb(241, 196, 15)',
            'other': 'rgb(149, 165, 166)'
        };

        subscriptions.forEach(sub => {
            const category = sub.category || 'other';
            const monthlyPrice = calculateMonthlyPrice(sub, rates);

            if (!categoryData[category]) {
                categoryData[category] = 0;
            }

            categoryData[category] += monthlyPrice;
        });

        // 准备图表数据
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const borderColor = [];

        for (const [category, amount] of Object.entries(categoryData)) {
            labels.push(getCategoryName(category));
            data.push(amount.toFixed(2));
            backgroundColor.push(categoryColors[category] || 'rgba(149, 165, 166, 0.7)');
            borderColor.push(categoryBorderColors[category] || 'rgb(149, 165, 166)');
        }

        // 根据图表类型设置不同的配置
        let chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'bar' ? 'top' : 'right',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                            const percentage = Math.round((value * 100) / total);
                            return `${label}: ${appSettings.localCurrency} ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        // 为柱状图添加特定配置
        if (chartType === 'bar') {
            chartOptions.scales = {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `月度支出 (${appSettings.localCurrency})`
                    },
                    ticks: {
                        callback: function(value) {
                            return `${appSettings.localCurrency} ${value}`;
                        }
                    }
                }
            };
        }

        // 为极坐标图添加特定配置
        if (chartType === 'polarArea') {
            chartOptions.plugins.legend.position = 'right';
            chartOptions.scales = {
                r: {
                    ticks: {
                        callback: function(value) {
                            return `${appSettings.localCurrency} ${value}`;
                        }
                    }
                }
            };
        }

        // 创建或更新图表
        if (window.categoryChart) {
            // 如果图表类型改变，需要销毁旧图表并创建新图表
            if (window.categoryChart.config.type !== chartType) {
                window.categoryChart.destroy();
                createCategoryChart(chartType, labels, data, backgroundColor, borderColor, chartOptions);
            } else {
                // 如果图表类型没变，只更新数据
                window.categoryChart.data.labels = labels;
                window.categoryChart.data.datasets[0].data = data;
                window.categoryChart.data.datasets[0].backgroundColor = backgroundColor;
                if (chartType === 'bar' || chartType === 'line') {
                    window.categoryChart.data.datasets[0].borderColor = borderColor;
                }
                window.categoryChart.update();
            }
        } else {
            createCategoryChart(chartType, labels, data, backgroundColor, borderColor, chartOptions);
        }
    }

    // 创建分类图表的辅助函数
    function createCategoryChart(chartType, labels, data, backgroundColor, borderColor, options) {
        const datasetConfig = {
            data: data,
            backgroundColor: backgroundColor,
            borderWidth: 1
        };

        // 为不同图表类型添加特定配置
        if (chartType === 'bar') {
            datasetConfig.borderColor = borderColor;
            datasetConfig.borderWidth = 1;
        }

        if (window.categoryChartCanvas) {
            window.categoryChart = new Chart(window.categoryChartCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [datasetConfig]
                },
                options: options
            });
        }
    }

    // 更新趋势图表
    function updateTrendChart(rates, timeRange = '12m') { // 添加 timeRange 参数，默认为 '12m'
        // 获取当前选择的图表类型
        const chartType = window.trendChartTypeSelect ? window.trendChartTypeSelect.value : 'line';

        const data = calculateTrendData(rates, timeRange);

        if (!data) {
            console.warn("无法为趋势图表计算数据，可能原因：无订阅或汇率问题。");
            // 可以选择清空图表或显示提示信息
            if (window.trendChart) {
                window.trendChart.data.labels = [];
                window.trendChart.data.datasets[0].data = [];
                window.trendChart.update();
            }
            return;
        }

        const { labels, dataPoints } = data;

        // 根据图表类型设置不同的配置
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `支出 (${appSettings.localCurrency})`
                    },
                    ticks: {
                        callback: function(value) {
                            return `${appSettings.localCurrency} ${value.toFixed(0)}`;
                        }
                    }
                },
                x: { // X轴配置
                    title: {
                        display: true,
                        text: getTimeRangeLabel(timeRange) // 初始X轴标题
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // 自定义tooltip的标题，显示完整的月份和年份
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${appSettings.localCurrency} ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        };

        // 根据图表类型设置数据集配置
        const datasetConfig = {
            label: '月度支出',
            data: dataPoints,
            borderColor: 'rgba(52, 152, 219, 1)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2
        };

        // 为不同图表类型添加特定配置
        if (chartType === 'line') {
            datasetConfig.fill = true;
            datasetConfig.tension = 0.3;
        } else if (chartType === 'bar') {
            datasetConfig.backgroundColor = 'rgba(52, 152, 219, 0.7)';
            delete datasetConfig.tension;
            delete datasetConfig.fill;
        } else if (chartType === 'area') {
            datasetConfig.fill = true;
            datasetConfig.tension = 0.4;
            datasetConfig.backgroundColor = 'rgba(52, 152, 219, 0.2)';
            chartType = 'line'; // area实际上是填充的line类型
        }

        // 创建或更新图表
        if (window.trendChart) {
            // 如果图表类型改变，需要销毁旧图表并创建新图表
            const currentType = window.trendChart.config.type;
            const needsRecreation =
                (currentType !== chartType) ||
                (chartType === 'line' && datasetConfig.fill !== window.trendChart.data.datasets[0].fill);

            if (needsRecreation) {
                window.trendChart.destroy();
                if (window.trendChartCanvas) {
                    window.trendChart = new Chart(window.trendChartCanvas, {
                        type: chartType,
                        data: {
                            labels: labels,
                            datasets: [datasetConfig]
                        },
                        options: chartOptions
                    });
                }
            } else {
                // 如果图表类型没变，只更新数据和选项
                window.trendChart.data.labels = labels;
                window.trendChart.data.datasets[0].data = dataPoints;

                // 更新数据集配置
                Object.keys(datasetConfig).forEach(key => {
                    if (key !== 'data' && key !== 'label') {
                        window.trendChart.data.datasets[0][key] = datasetConfig[key];
                    }
                });

                // 更新X轴标题
                window.trendChart.options.scales.x.title.text = getTimeRangeLabel(timeRange);
                window.trendChart.update();
            }
        } else if (window.trendChartCanvas) {
            window.trendChart = new Chart(window.trendChartCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [datasetConfig]
                },
                options: chartOptions
            });
        }
    }

    // 为趋势图表计算数据的辅助函数
    function calculateTrendData(rates, timeRange) {
        if (window.subscriptions.length === 0) return null;

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 当前月的最后一天

        const labels = [];
        const dataPoints = [];

        switch (timeRange) {
            case '6m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 过去6个月的开始
                break;
            case '12m':
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 过去12个月的开始
                break;
            case 'ytd': // 今年以来
                startDate = new Date(now.getFullYear(), 0, 1); // 今年1月1日
                break;
            case 'last_year':
                startDate = new Date(now.getFullYear() - 1, 0, 1); // 去年1月1日
                endDate = new Date(now.getFullYear() - 1, 11, 31); // 去年12月31日
                break;
            case 'all':
                // 找到所有订阅中最早的开始日期
                if (window.subscriptions.length > 0) {
                    const earliestSubscriptionDate = window.subscriptions.reduce((earliest, sub) => {
                        if (sub.startDate) {
                            const subDate = new Date(sub.startDate);
                            return subDate < earliest ? subDate : earliest;
                        }
                        return earliest;
                    }, new Date()); // 初始值为当前日期
                    startDate = new Date(earliestSubscriptionDate.getFullYear(), earliestSubscriptionDate.getMonth(), 1);
                } else {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 如果没有订阅，默认过去12个月
                }
                break;
            default: // 默认为12m
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }

        // 迭代月份
        let currentMonthIter = new Date(startDate);
        while (currentMonthIter <= endDate) {
            const year = currentMonthIter.getFullYear();
            const month = currentMonthIter.getMonth();
            const monthName = currentMonthIter.toLocaleString('zh-CN', { month: 'short', year: 'numeric' });
            labels.push(monthName);

            let monthlyTotal = 0;
            window.subscriptions.forEach(sub => {
                if (!sub.startDate) return;

                const subStartDate = new Date(sub.startDate);
                const price = calculateMonthlyPrice(sub, rates); // 使用已有的月度价格计算函数

                // 检查订阅在该月是否有效
                // 订阅开始于该月或之前
                const isStarted = subStartDate <= new Date(year, month + 1, 0); // 月末

                // 订阅结束于该月或之后 (或无结束日期)
                let isNotEnded = true;
                if (sub.expiryDate) {
                    const subExpiryDate = new Date(sub.expiryDate);
                    isNotEnded = subExpiryDate >= new Date(year, month, 1); // 月初
                }

                // 如果是一次性订阅，则仅在其开始的那个月计算
                if (sub.billingCycle === 'one-time') {
                    if (subStartDate.getFullYear() === year && subStartDate.getMonth() === month) {
                         // 一次性付款需要转换为等效的"月度"价格进行比较，这里我们直接使用其原始价格
                        const oneTimePrice = parseFloat(sub.price);
                        const convertedOneTimePrice = (sub.currency !== appSettings.localCurrency && rates)
                            ? getConvertedPrice(oneTimePrice, sub.currency, rates, appSettings.localCurrency)
                            : oneTimePrice;
                        monthlyTotal += convertedOneTimePrice ? parseFloat(convertedOneTimePrice) : 0;
                    }
                } else if (isStarted && isNotEnded) {
                    monthlyTotal += price;
                }
            });
            dataPoints.push(parseFloat(monthlyTotal.toFixed(2)));

            // 移动到下一个月
            currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
            // 如果是去年，并且已经到了12月，则停止
            if (timeRange === 'last_year' && month === 11) break;
        }
        return { labels, dataPoints };
    }

    // 获取时间范围选择器的标签文本
    function getTimeRangeLabel(timeRange) {
        switch (timeRange) {
            case '6m': return '过去 6 个月';
            case '12m': return '过去 12 个月';
            case 'ytd': return '今年以来';
            case 'last_year': return '去年';
            case 'all': return '所有时间';
            default: return '月度支出趋势';
        }
    }

    // 分类筛选事件处理
    if (window.categoryFilterSelect) {
        window.categoryFilterSelect.addEventListener('change', function() {
            const selectedCategory = this.value;
            renderSubscriptions(selectedCategory);
        });
    }

    // 新增：趋势图表时间范围选择器事件处理
    if (window.trendTimeRangeSelect) {
        window.trendTimeRangeSelect.addEventListener('change', function() {
            // 当时间范围改变时，仅需要更新趋势图表
            fetchExchangeRates().then(rates => {
                updateTrendChart(rates, this.value);
            });
        });
    }

    // 新增：分类图表类型选择器事件处理
    if (window.categoryChartTypeSelect) {
        window.categoryChartTypeSelect.addEventListener('change', function() {
            // 当图表类型改变时，仅需要更新分类图表
            fetchExchangeRates().then(rates => {
                updateCategoryChart(rates);
            });
        });
    }

    // 新增：趋势图表类型选择器事件处理
    if (window.trendChartTypeSelect) {
        window.trendChartTypeSelect.addEventListener('change', function() {
            // 当图表类型改变时，仅需要更新趋势图表
            fetchExchangeRates().then(rates => {
                const selectedTimeRange = window.trendTimeRangeSelect ? window.trendTimeRangeSelect.value : '12m';
                updateTrendChart(rates, selectedTimeRange);
            });
        });
    }

    // 新增：价值分析类型选择器事件处理
    if (window.valueAnalysisTypeSelect) {
        window.valueAnalysisTypeSelect.addEventListener('change', function() {
            // 当分析类型改变时，更新价值分析图表
            fetchExchangeRates().then(rates => {
                updateValueAnalysisChart(rates, this.value);
            });
        });
    }

    // 新增：价值分析图表
    function updateValueAnalysisChart(rates, analysisType = 'price') {
        if (window.subscriptions.length === 0) {
            if (window.valueAnalysisChart) {
                window.valueAnalysisChart.data.labels = [];
                window.valueAnalysisChart.data.datasets[0].data = [];
                window.valueAnalysisChart.update();
            }
            return;
        }

        // 根据分析类型准备数据
        let chartData;
        let chartOptions;

        switch (analysisType) {
            case 'price':
                chartData = prepareValueByPriceData(rates);
                chartOptions = getPriceAnalysisOptions();
                break;
            case 'frequency':
                chartData = prepareValueByFrequencyData();
                chartOptions = getFrequencyAnalysisOptions();
                break;
            case 'value':
                chartData = prepareValueByRatingData();
                chartOptions = getValueAnalysisOptions();
                break;
            default:
                chartData = prepareValueByPriceData(rates);
                chartOptions = getPriceAnalysisOptions();
        }

        // 创建或更新图表
        if (window.valueAnalysisChartCanvas) {
            if (window.valueAnalysisChart) {
                window.valueAnalysisChart.destroy();
                window.valueAnalysisChart = new Chart(window.valueAnalysisChartCanvas, {
                    type: 'bar',
                    data: chartData,
                    options: chartOptions
                });
            } else {
                window.valueAnalysisChart = new Chart(window.valueAnalysisChartCanvas, {
                    type: 'bar',
                    data: chartData,
                    options: chartOptions
                });
            }
        }
    }

    // 准备价格分析数据
    function prepareValueByPriceData(rates) {
        // 按价格排序订阅
        const sortedSubscriptions = [...window.subscriptions].sort((a, b) => {
            const priceA = calculateMonthlyPrice(a, rates);
            const priceB = calculateMonthlyPrice(b, rates);
            return priceB - priceA; // 从高到低排序
        });

        // 只取前10个
        const topSubscriptions = sortedSubscriptions.slice(0, 10);

        const labels = topSubscriptions.map(sub => sub.name);
        const data = topSubscriptions.map(sub => calculateMonthlyPrice(sub, rates).toFixed(2));

        return {
            labels: labels,
            datasets: [{
                label: '月度支出',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        };
    }

    // 准备使用频率分析数据
    function prepareValueByFrequencyData() {
        // 这里我们使用模拟数据，实际应用中应该从用户的使用记录中获取
        // 在未来版本中，可以添加用户记录使用频率的功能
        const labels = window.subscriptions.slice(0, 10).map(sub => sub.name);
        const data = window.subscriptions.slice(0, 10).map(() => Math.floor(Math.random() * 30)); // 模拟每月使用天数

        return {
            labels: labels,
            datasets: [{
                label: '每月使用天数',
                data: data,
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }]
        };
    }

    // 准备价值评估分析数据
    function prepareValueByRatingData() {
        // 这里我们使用模拟数据，实际应用中应该从用户的评分中获取
        // 在未来版本中，可以添加用户对订阅进行评分的功能
        const labels = window.subscriptions.slice(0, 10).map(sub => sub.name);
        const data = window.subscriptions.slice(0, 10).map(() => (Math.random() * 5).toFixed(1)); // 模拟评分（0-5分）

        return {
            labels: labels,
            datasets: [{
                label: '价值评分 (0-5)',
                data: data,
                backgroundColor: 'rgba(155, 89, 182, 0.7)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 1
            }]
        };
    }

    // 价格分析图表选项
    function getPriceAnalysisOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // 水平条形图
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `月度支出 (${appSettings.localCurrency})`
                    },
                    ticks: {
                        callback: function(value) {
                            return `${appSettings.localCurrency} ${value}`;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${appSettings.localCurrency} ${context.raw}`;
                        }
                    }
                }
            }
        };
    }

    // 使用频率分析图表选项
    function getFrequencyAnalysisOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // 水平条形图
            scales: {
                x: {
                    beginAtZero: true,
                    max: 30,
                    title: {
                        display: true,
                        text: '每月使用天数'
                    }
                }
            }
        };
    }

    // 价值评估分析图表选项
    function getValueAnalysisOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // 水平条形图
            scales: {
                x: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                        display: true,
                        text: '价值评分 (0-5)'
                    }
                }
            }
        };
    }

    // --- 预设服务功能 ---
    function renderPresetServices(searchTerm = '') {
        console.log("渲染预设服务列表，搜索词: " + searchTerm);

        if (!presetServiceListDiv) {
            console.error("预设服务列表容器元素不存在");
            return;
        }

        presetServiceListDiv.innerHTML = ''; // 清空现有列表
        const lowerSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';

        // 确保presetServices存在
        if (!presetServices || !Array.isArray(presetServices) || presetServices.length === 0) {
            console.error("预设服务数据不存在或为空");
            presetServiceListDiv.innerHTML = '<p class="no-results">预设服务数据不可用。</p>';
            return;
        }

        const filteredServices = presetServices.filter(service =>
            service.name.toLowerCase().includes(lowerSearchTerm)
        );

        console.log("过滤后的服务数量: " + filteredServices.length);

        if (filteredServices.length === 0) {
            presetServiceListDiv.innerHTML = '<p class="no-results">未找到匹配的服务。</p>';
            return;
        }

        filteredServices.forEach(service => {
            const item = document.createElement('div');
            item.classList.add('preset-service-item');
            item.setAttribute('data-id', service.id);

            let iconHtml = '';
            if (service.defaultIconUrl) {
                iconHtml = `<img src="${service.defaultIconUrl}" alt="${service.name}">`;
            } else {
                // 简单占位符（可以用服务名称首字母，但这里为了简化先只用通用图标）
                iconHtml = `<img src="icons/icon-72x72.png" alt="${service.name}">`; // 使用一个已有的图标作为占位
            }

            item.innerHTML = `
                ${iconHtml}
                <span class="item-name">${service.name}</span>
                <span class="item-category">${getCategoryName(service.category)}</span>
            `;

            // 使用function关键字定义回调函数，而不是箭头函数
            item.addEventListener('click', function() {
                console.log("点击了预设服务: " + service.name);
                fillFormWithPreset(service);
                if (presetServiceModal) {
                    presetServiceModal.classList.add('hidden');
                }
            });

            presetServiceListDiv.appendChild(item);
        });

        console.log("预设服务列表渲染完成");
    }

    function fillFormWithPreset(service) {
        console.log("填充表单，服务: ", service);

        try {
            // 获取表单元素
            const serviceNameInput = document.getElementById('service-name');
            const serviceUrlInput = document.getElementById('service-url');
            const categorySelect = document.getElementById('category');
            const priceInput = document.getElementById('price');
            const currencyInput = document.getElementById('currency');
            const startDateInput = document.getElementById('start-date');
            const expiryDateInput = document.getElementById('expiry-date');
            const notesInput = document.getElementById('notes');

            // 检查元素是否存在
            if (!serviceNameInput || !serviceUrlInput || !categorySelect ||
                !priceInput || !currencyInput || !startDateInput ||
                !expiryDateInput || !notesInput) {
                console.error("表单元素不存在");
                return;
            }

            // 填充服务名称和URL
            serviceNameInput.value = service.name || '';
            serviceUrlInput.value = service.defaultUrl || '';

            // 填充分类
            if (service.category) {
                categorySelect.value = service.category;
            }

            // 清空价格、币种、日期等字段，让用户自行填写
            priceInput.value = '';
            currencyInput.value = '';
            startDateInput.value = '';
            expiryDateInput.value = '';
            notesInput.value = '';

            console.log("表单填充完成");
        } catch (error) {
            console.error("填充表单时出错:", error);
        }
    }

    // 确保预设服务模态框相关元素存在并绑定事件
    if (window.showPresetModalBtn) {
        console.log("绑定'库'按钮点击事件");
        window.showPresetModalBtn.addEventListener('click', function() {
            console.log("点击了'库'按钮");
            if (window.presetServiceModal) {
                // 使用多种方式确保模态框显示
                window.presetServiceModal.classList.remove('hidden');
                window.presetServiceModal.style.display = 'flex';
                console.log("模态框显示状态:",
                    "classList包含hidden:", window.presetServiceModal.classList.contains('hidden'),
                    "style.display:", window.presetServiceModal.style.display);

                if (window.searchPresetServiceInput) {
                    window.searchPresetServiceInput.value = ''; // 清空搜索框
                }

                // 先渲染预设服务列表，再显示模态框
                renderPresetServices(); // 渲染完整列表

                // 使用setTimeout确保DOM更新后再聚焦搜索框
                setTimeout(function() {
                    if (window.searchPresetServiceInput) {
                        window.searchPresetServiceInput.style.display = 'block';
                        window.searchPresetServiceInput.focus();
                        console.log("搜索框聚焦，显示状态:", window.searchPresetServiceInput.style.display);
                    }
                }, 100);
            } else {
                console.error("预设服务模态框元素不存在");
            }
        });
    } else {
        console.error("'库'按钮元素不存在");
    }

    if (window.closePresetModalBtn) {
        console.log("绑定关闭按钮点击事件");
        window.closePresetModalBtn.addEventListener('click', function() {
            console.log("点击了关闭按钮");
            if (window.presetServiceModal) {
                // 使用多种方式确保模态框隐藏
                window.presetServiceModal.classList.add('hidden');
                window.presetServiceModal.style.display = 'none';
                console.log("模态框隐藏状态:",
                    "classList包含hidden:", window.presetServiceModal.classList.contains('hidden'),
                    "style.display:", window.presetServiceModal.style.display);
            }
        });
    } else {
        console.error("关闭按钮元素不存在");
    }

    if (window.presetServiceModal) {
        console.log("绑定模态框背景点击事件");
        window.presetServiceModal.addEventListener('click', function(event) {
            // 如果点击的是模态框背景（而不是内容区域），则关闭模态框
            if (event.target === window.presetServiceModal) {
                console.log("点击了模态框背景");
                // 使用多种方式确保模态框隐藏
                window.presetServiceModal.classList.add('hidden');
                window.presetServiceModal.style.display = 'none';
                console.log("模态框隐藏状态:",
                    "classList包含hidden:", window.presetServiceModal.classList.contains('hidden'),
                    "style.display:", window.presetServiceModal.style.display);
            }
        });
    } else {
        console.error("预设服务模态框元素不存在");
    }

    if (window.searchPresetServiceInput) {
        console.log("绑定搜索框输入事件");
        window.searchPresetServiceInput.addEventListener('input', function(event) {
            console.log("搜索框输入: " + event.target.value);
            renderPresetServices(event.target.value);
        });

        // 确保搜索框可见
        window.searchPresetServiceInput.style.display = 'block';
        window.searchPresetServiceInput.style.visibility = 'visible';
        window.searchPresetServiceInput.style.opacity = '1';
    } else {
        console.error("搜索框元素不存在");
    }

    // 初始化时设置模态框和搜索框的样式
    if (window.presetServiceModal) {
        // 确保模态框初始状态正确
        if (window.presetServiceModal.classList.contains('hidden')) {
            window.presetServiceModal.style.display = 'none';
        } else {
            window.presetServiceModal.style.display = 'flex';
        }
    }

    // --- Initialization ---
    loadSettings();
    loadExchangeRatesCache();
    loadIconsCache();
    loadSubscriptions();
    renderSubscriptions(); // 初始渲染订阅列表
    setupNotificationChecker();
    updateStatistics(); // 初始计算并显示统计数据

    // --- 主题切换功能 ---
    function applyTheme(themeName) {
        document.body.dataset.theme = themeName;
        console.log(`应用主题: ${themeName}`);
    }

    if (window.themeSelect) {
        window.themeSelect.addEventListener('change', function() {
            const selectedTheme = this.value;
            applyTheme(selectedTheme);
            appSettings.theme = selectedTheme;
            // 注意：这里不直接调用saveSettings()，因为用户可能还在修改其他设置
            // 主题的持久化将在点击"保存设置"按钮时统一处理，或者如果希望立即保存，可以单独保存主题设置
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings)); // 立即保存主题，以便下次加载时生效
            console.log(`主题已更改为: ${selectedTheme} 并已保存`);
        });
    }

    // 注意：这些函数已经在前面定义过，这里是重复定义，已被注释掉
    // function initializeSettingsView() {
    //     console.log("Settings View elements would be initialized here.");
    //     loadSettings();
    //     updateApiUsageInfo();
    // }

    // function initializeAnalysisView() {
    //     console.log("Analysis View elements would be initialized here.");
    //     updateStatistics();
    // }

    // function initializeDiscoveryView() {
    //     console.log("Discovery View elements would be initialized here (placeholder).");
    // }

    // --- Global Helper Functions (some will need refactoring) ---
    // 初始化应用
    function initializeApp() {
        loadSettings(); // Load global app settings first (applies theme)
        loadExchangeRatesCache();
        loadIconsCache();
        loadSubscriptions(); // Load subscription data (may trigger async icon fetching and re-render)

        // Initial render for the default view (subscriptions) is done after data load.
        // View-specific element initialization for defaultView already called by view switching logic above.
        renderSubscriptions(); // Render initial list.
        // updateStatistics(); // Not called initially, will be called by initializeAnalysisView when that view is shown.

        setupNotificationChecker(); // Global notification checker
    }

    // 当DOM加载完成后初始化应用
    document.addEventListener('DOMContentLoaded', initializeApp);
});