/**
 * 发现页面增强功能
 * 提供发现页面的交互功能和数据处理
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化发现页面功能
    initDiscoveryFeatures();
});

/**
 * 初始化发现页面的所有功能
 */
function initDiscoveryFeatures() {
    // 初始化搜索功能
    initDiscoverySearch();
    
    // 初始化推荐服务
    loadRecommendedServices();
    
    // 初始化分类浏览
    initCategoryBrowsing();
    
    // 初始化汇率显示
    enhanceExchangeRatesDisplay();
}

/**
 * 初始化发现页面的搜索功能
 */
function initDiscoverySearch() {
    const searchInput = document.getElementById('discover-search');
    const searchResults = document.getElementById('discover-search-results');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        // 搜索本地订阅
        const localResults = searchLocalSubscriptions(searchTerm);
        
        // 搜索预设服务
        const presetResults = searchPresetServices(searchTerm);
        
        // 显示结果
        displaySearchResults(localResults, presetResults, searchResults);
    });
}

/**
 * 搜索本地订阅
 * @param {string} searchTerm - 搜索关键词
 * @returns {Array} 匹配的订阅列表
 */
function searchLocalSubscriptions(searchTerm) {
    // 确保全局订阅数据存在
    if (!window.subscriptions || !Array.isArray(window.subscriptions)) {
        return [];
    }
    
    return window.subscriptions.filter(sub => 
        sub.serviceName.toLowerCase().includes(searchTerm) || 
        (sub.description && sub.description.toLowerCase().includes(searchTerm)) ||
        (sub.category && sub.category.toLowerCase().includes(searchTerm))
    );
}

/**
 * 搜索预设服务
 * @param {string} searchTerm - 搜索关键词
 * @returns {Array} 匹配的预设服务列表
 */
function searchPresetServices(searchTerm) {
    // 确保全局预设服务数据存在
    if (!window.presetServices || !Array.isArray(window.presetServices)) {
        return [];
    }
    
    return window.presetServices.filter(service => 
        service.name.toLowerCase().includes(searchTerm) || 
        service.category.toLowerCase().includes(searchTerm)
    );
}

/**
 * 显示搜索结果
 * @param {Array} localResults - 本地订阅结果
 * @param {Array} presetResults - 预设服务结果
 * @param {HTMLElement} container - 结果容器元素
 */
function displaySearchResults(localResults, presetResults, container) {
    container.innerHTML = '';
    
    if (localResults.length === 0 && presetResults.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>未找到匹配的服务</p>
            </div>
        `;
        return;
    }
    
    // 显示本地订阅结果
    if (localResults.length > 0) {
        const localResultsSection = document.createElement('div');
        localResultsSection.innerHTML = `
            <h4 class="font-medium text-sm text-gray-700 mb-2">我的订阅</h4>
            <div class="space-y-2 mb-4">
                ${localResults.map(sub => `
                    <div class="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer" data-subscription-id="${sub.id}">
                        <img src="${sub.iconUrl || getDefaultServiceIcon(sub.serviceName, sub.serviceUrl)}" 
                            alt="${sub.serviceName}" class="w-8 h-8 mr-3 rounded">
                        <div>
                            <div class="font-medium">${sub.serviceName}</div>
                            <div class="text-xs text-gray-500">${getCategoryName(sub.category)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(localResultsSection);
        
        // 添加点击事件
        localResultsSection.querySelectorAll('[data-subscription-id]').forEach(item => {
            item.addEventListener('click', function() {
                const subId = this.dataset.subscriptionId;
                showSubscriptionDetails(subId);
            });
        });
    }
    
    // 显示预设服务结果
    if (presetResults.length > 0) {
        const presetResultsSection = document.createElement('div');
        presetResultsSection.innerHTML = `
            <h4 class="font-medium text-sm text-gray-700 mb-2">推荐服务</h4>
            <div class="space-y-2">
                ${presetResults.map(service => `
                    <div class="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer" data-preset-id="${service.id}">
                        <img src="${service.defaultIconUrl}" 
                            alt="${service.name}" class="w-8 h-8 mr-3 rounded">
                        <div>
                            <div class="font-medium">${service.name}</div>
                            <div class="text-xs text-gray-500">${getCategoryName(service.category)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(presetResultsSection);
        
        // 添加点击事件
        presetResultsSection.querySelectorAll('[data-preset-id]').forEach(item => {
            item.addEventListener('click', function() {
                const presetId = this.dataset.presetId;
                addPresetSubscription(presetId);
            });
        });
    }
}

/**
 * 加载推荐服务
 */
function loadRecommendedServices() {
    const recommendationsContainer = document.getElementById('discover-recommendations');
    if (!recommendationsContainer) return;
    
    // 确保全局预设服务数据存在
    if (!window.presetServices || !Array.isArray(window.presetServices)) {
        recommendationsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">暂无推荐服务</p>';
        return;
    }
    
    // 获取热门服务（这里简单地取前6个）
    const popularServices = window.presetServices.slice(0, 6);
    
    recommendationsContainer.innerHTML = popularServices.map(service => `
        <div class="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" data-preset-id="${service.id}">
            <div class="flex items-center mb-2">
                <img src="${service.defaultIconUrl}" alt="${service.name}" class="w-8 h-8 rounded mr-2">
                <h4 class="font-medium text-sm">${service.name}</h4>
            </div>
            <div class="text-xs text-gray-500">${getCategoryName(service.category)}</div>
        </div>
    `).join('');
    
    // 添加点击事件
    recommendationsContainer.querySelectorAll('[data-preset-id]').forEach(item => {
        item.addEventListener('click', function() {
            const presetId = this.dataset.presetId;
            addPresetSubscription(presetId);
        });
    });
}

/**
 * 初始化分类浏览功能
 */
function initCategoryBrowsing() {
    const categoryButtons = document.querySelectorAll('#discover-categories .category-btn');
    const categoryResults = document.getElementById('discover-category-results');
    
    if (!categoryButtons.length || !categoryResults) return;
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // 高亮选中的分类按钮
            categoryButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500'));
            this.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
            
            // 显示该分类的服务
            displayCategoryServices(category, categoryResults);
        });
    });
}

/**
 * 显示指定分类的服务
 * @param {string} category - 分类名称
 * @param {HTMLElement} container - 结果容器元素
 */
function displayCategoryServices(category, container) {
    container.classList.remove('hidden');
    
    // 确保全局预设服务数据存在
    if (!window.presetServices || !Array.isArray(window.presetServices)) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">暂无相关服务</p>';
        return;
    }
    
    // 过滤指定分类的服务
    const filteredServices = window.presetServices.filter(service => service.category === category);
    
    if (filteredServices.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">该分类暂无服务</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${filteredServices.map(service => `
                <div class="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" data-preset-id="${service.id}">
                    <div class="flex items-center mb-2">
                        <img src="${service.defaultIconUrl}" alt="${service.name}" class="w-8 h-8 rounded mr-2">
                        <h4 class="font-medium text-sm">${service.name}</h4>
                    </div>
                    <div class="text-xs text-gray-500">${getCategoryName(service.category)}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // 添加点击事件
    container.querySelectorAll('[data-preset-id]').forEach(item => {
        item.addEventListener('click', function() {
            const presetId = this.dataset.presetId;
            addPresetSubscription(presetId);
        });
    });
}

/**
 * 增强汇率显示
 */
function enhanceExchangeRatesDisplay() {
    const moreRatesBtn = document.getElementById('discover-more-rates-btn');
    const allRatesContainer = document.getElementById('discover-all-exchange-rates');
    
    if (!moreRatesBtn || !allRatesContainer) return;
    
    moreRatesBtn.addEventListener('click', function() {
        const isHidden = allRatesContainer.classList.contains('hidden');
        
        if (isHidden) {
            allRatesContainer.classList.remove('hidden');
            this.innerHTML = `
                <span>收起币种汇率</span>
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
            `;
        } else {
            allRatesContainer.classList.add('hidden');
            this.innerHTML = `
                <span>查看更多币种汇率</span>
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            `;
        }
    });
}
