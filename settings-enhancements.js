/**
 * 设置页面增强功能
 * 提供设置页面的交互功能和数据处理
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化设置页面功能
    initSettingsEnhancements();
});

/**
 * 初始化设置页面的所有增强功能
 */
function initSettingsEnhancements() {
    // 初始化货币选择器
    initCurrencySelector();
    
    // 初始化主题选择器
    initThemeSelector();
    
    // 增强API设置界面
    enhanceApiSettings();
}

/**
 * 初始化货币选择器
 */
function initCurrencySelector() {
    const currencySelect = document.getElementById('local-currency');
    const otherCurrencyInput = document.getElementById('other-currency-input');
    const customCurrencyInput = document.getElementById('custom-currency');
    
    if (!currencySelect || !otherCurrencyInput || !customCurrencyInput) return;
    
    // 设置初始值
    if (window.appSettings && window.appSettings.localCurrency) {
        // 检查是否是预设货币之一
        const isPresetCurrency = Array.from(currencySelect.options).some(option => 
            option.value === window.appSettings.localCurrency && option.value !== 'other'
        );
        
        if (isPresetCurrency) {
            currencySelect.value = window.appSettings.localCurrency;
        } else {
            currencySelect.value = 'other';
            otherCurrencyInput.classList.remove('hidden');
            customCurrencyInput.value = window.appSettings.localCurrency;
        }
    }
    
    // 监听选择变化
    currencySelect.addEventListener('change', function() {
        if (this.value === 'other') {
            otherCurrencyInput.classList.remove('hidden');
            customCurrencyInput.focus();
        } else {
            otherCurrencyInput.classList.add('hidden');
            customCurrencyInput.value = '';
        }
    });
    
    // 保存设置时的处理
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        const originalSaveHandler = saveSettingsBtn.onclick;
        
        saveSettingsBtn.onclick = function(event) {
            // 处理自定义货币
            if (currencySelect.value === 'other' && customCurrencyInput.value.trim()) {
                // 验证货币代码格式（三个字母）
                const currencyCode = customCurrencyInput.value.trim().toUpperCase();
                if (/^[A-Z]{3}$/.test(currencyCode)) {
                    // 设置隐藏的原始输入框的值，以便与现有代码兼容
                    currencySelect.value = currencyCode;
                } else {
                    alert('请输入有效的三字母货币代码（如CNY、USD等）');
                    customCurrencyInput.focus();
                    event.preventDefault();
                    return false;
                }
            }
            
            // 调用原始保存处理程序（如果存在）
            if (typeof originalSaveHandler === 'function') {
                return originalSaveHandler.call(this, event);
            }
        };
    }
}

/**
 * 初始化主题选择器
 */
function initThemeSelector() {
    const themeRadios = document.querySelectorAll('input[name="theme-option"]');
    const themeSelect = document.getElementById('theme-select');
    
    if (!themeRadios.length || !themeSelect) return;
    
    // 设置初始值
    if (window.appSettings && window.appSettings.theme) {
        const themeRadio = document.getElementById(`theme-${window.appSettings.theme}`);
        if (themeRadio) {
            themeRadio.checked = true;
            updateThemeSelection(themeRadio);
        }
    }
    
    // 监听单选按钮变化
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                // 更新隐藏的原始选择器的值，以便与现有代码兼容
                themeSelect.value = this.value;
                
                // 触发原始选择器的change事件，以便应用主题
                const event = new Event('change');
                themeSelect.dispatchEvent(event);
                
                // 更新选择样式
                updateThemeSelection(this);
            }
        });
    });
    
    // 初始化选择样式
    const checkedRadio = document.querySelector('input[name="theme-option"]:checked');
    if (checkedRadio) {
        updateThemeSelection(checkedRadio);
    }
}

/**
 * 更新主题选择样式
 * @param {HTMLElement} selectedRadio - 选中的单选按钮
 */
function updateThemeSelection(selectedRadio) {
    // 移除所有选项的选中样式
    document.querySelectorAll('.theme-label').forEach(label => {
        label.classList.remove('ring-2', 'ring-blue-500');
    });
    
    document.querySelectorAll('.theme-check').forEach(check => {
        check.style.opacity = '0';
    });
    
    // 添加选中项的样式
    const selectedLabel = document.querySelector(`label[for="${selectedRadio.id}"]`);
    if (selectedLabel) {
        selectedLabel.classList.add('ring-2', 'ring-blue-500');
        const checkIcon = selectedLabel.querySelector('.theme-check');
        if (checkIcon) {
            checkIcon.style.opacity = '1';
        }
    }
}

/**
 * 增强API设置界面
 */
function enhanceApiSettings() {
    const apiKeyInput = document.getElementById('api-key');
    const developerModeCheckbox = document.getElementById('developer-mode');
    const refreshRatesBtn = document.getElementById('refresh-rates');
    
    if (!apiKeyInput || !developerModeCheckbox || !refreshRatesBtn) return;
    
    // 设置初始值
    if (window.appSettings) {
        if (window.appSettings.apiKey) {
            apiKeyInput.value = window.appSettings.apiKey;
        }
        
        if (window.appSettings.developerMode) {
            developerModeCheckbox.checked = window.appSettings.developerMode;
        }
    }
    
    // 添加API密钥输入提示
    apiKeyInput.addEventListener('focus', function() {
        this.placeholder = '';
    });
    
    apiKeyInput.addEventListener('blur', function() {
        if (!this.value) {
            this.placeholder = '输入您的exchangerate-api.com API Key';
        }
    });
    
    // 增强刷新按钮交互
    refreshRatesBtn.addEventListener('click', function() {
        // 添加加载动画
        this.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            刷新中...
        `;
        
        // 禁用按钮
        this.disabled = true;
        
        // 调用原始刷新函数（如果存在）
        if (typeof window.refreshExchangeRates === 'function') {
            window.refreshExchangeRates()
                .then(() => {
                    // 恢复按钮状态
                    this.innerHTML = `
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        刷新汇率数据
                    `;
                    this.disabled = false;
                })
                .catch(error => {
                    console.error('刷新汇率失败:', error);
                    
                    // 恢复按钮状态
                    this.innerHTML = `
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        刷新汇率数据
                    `;
                    this.disabled = false;
                });
        } else {
            // 如果原始函数不存在，模拟延迟后恢复按钮状态
            setTimeout(() => {
                this.innerHTML = `
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    刷新汇率数据
                `;
                this.disabled = false;
                
                // 显示错误消息
                const ratesStatus = document.getElementById('rates-status');
                if (ratesStatus) {
                    ratesStatus.innerHTML = '<span class="text-red-500">刷新失败：未找到刷新函数</span>';
                }
            }, 1000);
        }
    });
}
