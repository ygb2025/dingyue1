// 智能化功能 - 订阅优化建议、智能分类和重复订阅检测
console.log("smart-suggestions.js loaded");

document.addEventListener('DOMContentLoaded', () => {
    // 初始化智能化功能
    initSmartSuggestions();
});

// 全局变量
const USAGE_THRESHOLD_LOW = 3; // 使用频率低于此值视为低使用率
const PRICE_THRESHOLD_HIGH = 50; // 价格高于此值视为高价格（CNY）
const SIMILAR_SERVICE_THRESHOLD = 0.7; // 相似度阈值，超过此值视为相似服务

// 初始化智能建议功能
function initSmartSuggestions() {
    // 在订阅列表渲染后生成建议
    document.addEventListener('subscriptionsRendered', () => {
        generateSubscriptionSuggestions();
    });

    // 在分析视图显示时生成建议
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', function() {
            const targetView = this.dataset.view;
            if (targetView === 'analysis') {
                setTimeout(() => {
                    generateSubscriptionSuggestions();
                }, 500); // 延迟一点时间，确保视图已完全加载
            }
        });
    });
}

// 生成订阅优化建议
function generateSubscriptionSuggestions() {
    if (!window.subscriptions || window.subscriptions.length === 0) return;
    
    const suggestions = [];
    
    // 1. 检测低使用率高价格的订阅
    const lowUsageHighPriceSubscriptions = detectLowUsageHighPrice();
    if (lowUsageHighPriceSubscriptions.length > 0) {
        suggestions.push({
            type: 'optimization',
            title: '低使用率高价格订阅',
            description: '以下订阅使用频率低但价格较高，建议考虑降级或取消：',
            items: lowUsageHighPriceSubscriptions
        });
    }
    
    // 2. 检测重复或相似的订阅
    const similarSubscriptions = detectSimilarSubscriptions();
    if (similarSubscriptions.length > 0) {
        suggestions.push({
            type: 'duplicate',
            title: '重复或相似订阅',
            description: '以下订阅服务功能可能有重叠，建议考虑整合：',
            items: similarSubscriptions
        });
    }
    
    // 3. 检测即将到期的订阅
    const expiringSubscriptions = detectExpiringSubscriptions();
    if (expiringSubscriptions.length > 0) {
        suggestions.push({
            type: 'expiring',
            title: '即将到期的订阅',
            description: '以下订阅即将到期，请决定是否续订：',
            items: expiringSubscriptions
        });
    }
    
    // 4. 检测季节性使用的订阅
    const seasonalSubscriptions = detectSeasonalSubscriptions();
    if (seasonalSubscriptions.length > 0) {
        suggestions.push({
            type: 'seasonal',
            title: '季节性使用的订阅',
            description: '以下订阅可能只在特定季节使用，建议考虑暂停或转为按需付费：',
            items: seasonalSubscriptions
        });
    }
    
    // 5. 检测可能有优惠的订阅
    const potentialDiscountSubscriptions = detectPotentialDiscounts();
    if (potentialDiscountSubscriptions.length > 0) {
        suggestions.push({
            type: 'discount',
            title: '可能有优惠的订阅',
            description: '以下订阅可能有优惠或促销，建议查看：',
            items: potentialDiscountSubscriptions
        });
    }
    
    // 显示建议
    displaySuggestions(suggestions);
}

// 检测低使用率高价格的订阅
function detectLowUsageHighPrice() {
    // 由于我们没有实际的使用频率数据，这里使用模拟数据
    return window.subscriptions
        .filter(sub => {
            // 模拟使用频率 (0-10)
            const usageFrequency = sub.usageFrequency || Math.floor(Math.random() * 11);
            
            // 计算月度价格
            let monthlyPrice = 0;
            if (sub.billingCycle === 'monthly') {
                monthlyPrice = convertToLocalCurrency(sub.price, sub.currency);
            } else if (sub.billingCycle === 'annually') {
                monthlyPrice = convertToLocalCurrency(sub.price, sub.currency) / 12;
            } else {
                return false; // 排除一次性订阅
            }
            
            // 判断是否为低使用率高价格
            return usageFrequency < USAGE_THRESHOLD_LOW && monthlyPrice > PRICE_THRESHOLD_HIGH;
        })
        .map(sub => ({
            id: sub.id,
            name: sub.serviceName,
            price: formatCurrency(sub.price, sub.currency),
            reason: '使用频率低，价格较高'
        }));
}

// 检测重复或相似的订阅
function detectSimilarSubscriptions() {
    const similarPairs = [];
    const categories = {
        'entertainment': ['视频', '音乐', '游戏', '流媒体', '电影', '电视', '动漫'],
        'work': ['办公', '协作', '项目管理', '通讯', '存储'],
        'education': ['学习', '课程', '教育', '培训', '知识'],
        'lifestyle': ['健身', '饮食', '购物', '约会', '社交'],
        'utility': ['工具', '安全', '备份', '云存储', 'VPN']
    };
    
    // 为每个订阅创建关键词集
    const subscriptionsWithKeywords = window.subscriptions.map(sub => {
        const keywords = new Set();
        
        // 添加服务名称中的关键词
        sub.serviceName.toLowerCase().split(/\s+/).forEach(word => keywords.add(word));
        
        // 添加分类相关的关键词
        if (sub.category && categories[sub.category]) {
            categories[sub.category].forEach(keyword => keywords.add(keyword));
        }
        
        // 添加备注中的关键词
        if (sub.notes) {
            sub.notes.toLowerCase().split(/\s+/).forEach(word => keywords.add(word));
        }
        
        return {
            ...sub,
            keywords: Array.from(keywords)
        };
    });
    
    // 比较订阅之间的相似度
    for (let i = 0; i < subscriptionsWithKeywords.length; i++) {
        for (let j = i + 1; j < subscriptionsWithKeywords.length; j++) {
            const sub1 = subscriptionsWithKeywords[i];
            const sub2 = subscriptionsWithKeywords[j];
            
            // 如果分类相同，进一步检查相似度
            if (sub1.category === sub2.category) {
                const similarity = calculateSimilarity(sub1.keywords, sub2.keywords);
                
                if (similarity > SIMILAR_SERVICE_THRESHOLD) {
                    similarPairs.push({
                        id1: sub1.id,
                        name1: sub1.serviceName,
                        id2: sub2.id,
                        name2: sub2.serviceName,
                        similarity: similarity,
                        reason: `相似度 ${Math.round(similarity * 100)}%，功能可能重叠`
                    });
                }
            }
        }
    }
    
    return similarPairs;
}

// 计算两个关键词数组的相似度（Jaccard相似度）
function calculateSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

// 检测即将到期的订阅
function detectExpiringSubscriptions() {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return window.subscriptions
        .filter(sub => {
            if (!sub.expiryDate) return false;
            
            const expiryDate = new Date(sub.expiryDate);
            return expiryDate > today && expiryDate <= thirtyDaysLater;
        })
        .map(sub => ({
            id: sub.id,
            name: sub.serviceName,
            expiryDate: sub.expiryDate,
            reason: `将在 ${formatDateDifference(new Date(), new Date(sub.expiryDate))} 后到期`
        }));
}

// 检测季节性使用的订阅
function detectSeasonalSubscriptions() {
    // 这个功能需要长期的使用数据，这里使用模拟数据
    return window.subscriptions
        .filter(sub => {
            // 模拟季节性使用（随机选择一些订阅）
            return Math.random() < 0.2; // 20%的概率被选中
        })
        .map(sub => ({
            id: sub.id,
            name: sub.serviceName,
            reason: '可能只在特定季节使用'
        }));
}

// 检测可能有优惠的订阅
function detectPotentialDiscounts() {
    // 这个功能需要外部数据源，这里使用模拟数据
    const discountableServices = [
        'Netflix', 'Spotify', 'Disney+', 'Amazon Prime', 
        'YouTube Premium', 'HBO Max', 'Adobe Creative Cloud'
    ];
    
    return window.subscriptions
        .filter(sub => {
            // 检查服务名称是否在可能有优惠的列表中
            return discountableServices.some(service => 
                sub.serviceName.toLowerCase().includes(service.toLowerCase())
            );
        })
        .map(sub => ({
            id: sub.id,
            name: sub.serviceName,
            reason: '可能有季节性优惠或学生折扣'
        }));
}

// 格式化日期差异
function formatDateDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return '今天';
    if (diffDays === 1) return '1 天';
    if (diffDays < 30) return `${diffDays} 天`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 个月';
    if (diffMonths < 12) return `${diffMonths} 个月`;
    
    const diffYears = Math.floor(diffMonths / 12);
    if (diffYears === 1) return '1 年';
    return `${diffYears} 年`;
}

// 显示建议
function displaySuggestions(suggestions) {
    // 检查是否存在建议容器
    let suggestionsContainer = document.getElementById('smart-suggestions-container');
    
    // 如果不存在，创建一个
    if (!suggestionsContainer) {
        // 在分析视图中添加建议容器
        const analysisView = document.getElementById('view-analysis');
        if (!analysisView) return;
        
        suggestionsContainer = document.createElement('section');
        suggestionsContainer.id = 'smart-suggestions-container';
        suggestionsContainer.className = 'mt-6 bg-white p-4 rounded-lg shadow';
        
        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold mb-3 text-green-600';
        title.textContent = '智能订阅建议';
        
        suggestionsContainer.appendChild(title);
        
        // 添加到分析视图的主要内容区域
        const mainContent = analysisView.querySelector('main');
        if (mainContent) {
            mainContent.appendChild(suggestionsContainer);
        } else {
            analysisView.appendChild(suggestionsContainer);
        }
    }
    
    // 清空现有内容
    suggestionsContainer.innerHTML = '<h3 class="text-lg font-semibold mb-3 text-green-600">智能订阅建议</h3>';
    
    // 如果没有建议，显示默认消息
    if (suggestions.length === 0) {
        const noSuggestions = document.createElement('p');
        noSuggestions.className = 'text-gray-500 italic';
        noSuggestions.textContent = '目前没有优化建议。随着您使用应用的时间增长，我们将提供更多个性化建议。';
        suggestionsContainer.appendChild(noSuggestions);
        return;
    }
    
    // 添加每个建议
    suggestions.forEach(suggestion => {
        const suggestionElement = createSuggestionElement(suggestion);
        suggestionsContainer.appendChild(suggestionElement);
    });
}

// 创建建议元素
function createSuggestionElement(suggestion) {
    const element = document.createElement('div');
    element.className = 'suggestion-item mb-4 p-3 border-l-4 rounded bg-gray-50';
    
    // 根据建议类型设置边框颜色
    switch (suggestion.type) {
        case 'optimization':
            element.classList.add('border-yellow-500');
            break;
        case 'duplicate':
            element.classList.add('border-orange-500');
            break;
        case 'expiring':
            element.classList.add('border-red-500');
            break;
        case 'seasonal':
            element.classList.add('border-blue-500');
            break;
        case 'discount':
            element.classList.add('border-green-500');
            break;
        default:
            element.classList.add('border-gray-500');
    }
    
    // 添加标题
    const title = document.createElement('h4');
    title.className = 'font-semibold text-gray-800 mb-1';
    title.textContent = suggestion.title;
    element.appendChild(title);
    
    // 添加描述
    const description = document.createElement('p');
    description.className = 'text-sm text-gray-600 mb-2';
    description.textContent = suggestion.description;
    element.appendChild(description);
    
    // 添加项目列表
    const itemsList = document.createElement('ul');
    itemsList.className = 'list-disc pl-5 text-sm';
    
    suggestion.items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-1';
        
        if (suggestion.type === 'duplicate') {
            // 重复订阅显示两个服务名称
            listItem.innerHTML = `<strong>${item.name1}</strong> 和 <strong>${item.name2}</strong>: ${item.reason}`;
        } else {
            // 其他类型的建议
            listItem.innerHTML = `<strong>${item.name}</strong>: ${item.reason}`;
        }
        
        itemsList.appendChild(listItem);
    });
    
    element.appendChild(itemsList);
    
    return element;
}

// 导出函数
window.generateSubscriptionSuggestions = generateSubscriptionSuggestions;
