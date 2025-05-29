// 数据同步与备份功能
console.log("data-sync.js loaded");

document.addEventListener('DOMContentLoaded', () => {
    // 初始化数据同步与备份功能
    initDataSync();
});

// 全局变量
const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
const MAX_LOCAL_BACKUPS = 5; // 最多保存的本地备份数量

// 初始化数据同步与备份功能
function initDataSync() {
    // 添加自动备份功能
    setupAutoBackup();
    
    // 添加数据同步与备份UI
    addDataSyncUI();
    
    // 添加事件监听器
    setupEventListeners();
}

// 设置自动备份
function setupAutoBackup() {
    // 检查上次备份时间
    const lastBackupTime = localStorage.getItem('lastAutoBackupTime');
    const now = Date.now();
    
    if (!lastBackupTime || (now - parseInt(lastBackupTime)) > AUTO_BACKUP_INTERVAL) {
        // 执行自动备份
        createLocalBackup('auto');
        
        // 更新上次备份时间
        localStorage.setItem('lastAutoBackupTime', now.toString());
    }
    
    // 设置定时器，定期检查是否需要备份
    setInterval(() => {
        const lastTime = localStorage.getItem('lastAutoBackupTime');
        const currentTime = Date.now();
        
        if (!lastTime || (currentTime - parseInt(lastTime)) > AUTO_BACKUP_INTERVAL) {
            createLocalBackup('auto');
            localStorage.setItem('lastAutoBackupTime', currentTime.toString());
        }
    }, 60 * 60 * 1000); // 每小时检查一次
}

// 添加数据同步与备份UI
function addDataSyncUI() {
    // 检查设置视图是否存在
    const settingsView = document.getElementById('view-settings');
    if (!settingsView) return;
    
    // 检查设置面板内容是否存在
    const settingsPanelContent = document.getElementById('settings-panel-content');
    if (!settingsPanelContent) return;
    
    // 创建数据同步与备份设置组
    const dataSyncGroup = document.createElement('div');
    dataSyncGroup.className = 'setting-group mb-6';
    dataSyncGroup.innerHTML = `
        <h4 class="font-semibold text-md text-gray-800 border-b pb-2 mb-3">数据同步与备份</h4>
        
        <!-- 本地备份 -->
        <div class="mb-4">
            <h5 class="font-medium text-sm text-gray-700 mb-2">本地备份</h5>
            <p class="text-xs text-gray-600 mb-2">创建本地备份以防数据丢失。备份将存储在浏览器的本地存储中。</p>
            <div class="flex space-x-2">
                <button id="create-backup-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">
                    创建备份
                </button>
                <button id="restore-backup-btn" class="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded">
                    恢复备份
                </button>
            </div>
            <div id="backup-list-container" class="mt-3 max-h-40 overflow-y-auto bg-gray-50 rounded p-2 hidden">
                <h6 class="text-xs font-medium text-gray-700 mb-1">可用备份:</h6>
                <ul id="backup-list" class="text-xs"></ul>
            </div>
        </div>
        
        <!-- 导出/导入 -->
        <div class="mb-4">
            <h5 class="font-medium text-sm text-gray-700 mb-2">导出/导入数据</h5>
            <p class="text-xs text-gray-600 mb-2">导出数据以便在其他设备上使用，或导入之前导出的数据。</p>
            <div class="flex space-x-2">
                <button id="export-json-btn" class="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded">
                    导出为JSON
                </button>
                <button id="export-csv-btn" class="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded">
                    导出为CSV
                </button>
            </div>
            <div class="mt-2">
                <label for="import-file" class="block text-xs font-medium text-gray-700 mb-1">导入数据:</label>
                <div class="flex items-center">
                    <input type="file" id="import-file" accept=".json,.csv" class="text-xs">
                    <button id="import-btn" class="ml-2 bg-orange-600 hover:bg-orange-700 text-white text-sm py-1 px-3 rounded" disabled>
                        导入
                    </button>
                </div>
                <div class="flex items-center mt-1">
                    <input type="checkbox" id="import-replace" class="mr-1">
                    <label for="import-replace" class="text-xs text-gray-700">替换现有数据</label>
                </div>
                <div id="import-status" class="text-xs mt-1 hidden"></div>
            </div>
        </div>
        
        <!-- 云同步 (未来功能) -->
        <div class="mb-4 opacity-50">
            <h5 class="font-medium text-sm text-gray-700 mb-2">云同步 (即将推出)</h5>
            <p class="text-xs text-gray-600 mb-2">在多个设备之间同步您的订阅数据。</p>
            <button disabled class="bg-purple-600 text-white text-sm py-1 px-3 rounded opacity-50 cursor-not-allowed">
                设置云同步
            </button>
        </div>
    `;
    
    // 添加到设置面板
    settingsPanelContent.appendChild(dataSyncGroup);
}

// 设置事件监听器
function setupEventListeners() {
    // 创建备份按钮
    const createBackupBtn = document.getElementById('create-backup-btn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', () => {
            createLocalBackup('manual');
            showBackupList();
        });
    }
    
    // 恢复备份按钮
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', () => {
            showBackupList();
        });
    }
    
    // 导出JSON按钮
    const exportJsonBtn = document.getElementById('export-json-btn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            exportDataAsJson();
        });
    }
    
    // 导出CSV按钮
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            exportDataAsCsv();
        });
    }
    
    // 导入文件选择
    const importFileInput = document.getElementById('import-file');
    if (importFileInput) {
        importFileInput.addEventListener('change', () => {
            const importBtn = document.getElementById('import-btn');
            if (importBtn) {
                importBtn.disabled = !importFileInput.files.length;
            }
        });
    }
    
    // 导入按钮
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const importFileInput = document.getElementById('import-file');
            const importReplaceCheckbox = document.getElementById('import-replace');
            
            if (importFileInput && importFileInput.files.length) {
                const file = importFileInput.files[0];
                const replaceExisting = importReplaceCheckbox && importReplaceCheckbox.checked;
                
                importData(file, replaceExisting);
            }
        });
    }
}

// 创建本地备份
function createLocalBackup(type = 'manual') {
    if (!window.subscriptions) return;
    
    try {
        // 准备备份数据
        const backupData = {
            version: '1.0',
            timestamp: Date.now(),
            type: type, // 'auto' 或 'manual'
            subscriptions: window.subscriptions,
            settings: window.appSettings
        };
        
        // 获取现有备份列表
        let backups = JSON.parse(localStorage.getItem('backups') || '[]');
        
        // 添加新备份
        backups.push(backupData);
        
        // 如果超过最大备份数量，删除最旧的备份
        if (backups.length > MAX_LOCAL_BACKUPS) {
            // 按时间戳排序
            backups.sort((a, b) => b.timestamp - a.timestamp);
            
            // 保留最新的备份
            backups = backups.slice(0, MAX_LOCAL_BACKUPS);
        }
        
        // 保存备份列表
        localStorage.setItem('backups', JSON.stringify(backups));
        
        console.log(`${type === 'auto' ? '自动' : '手动'}备份已创建`);
        
        // 如果是手动备份，显示成功消息
        if (type === 'manual') {
            alert('备份已成功创建！');
        }
        
        return true;
    } catch (error) {
        console.error('创建备份时出错:', error);
        
        if (type === 'manual') {
            alert(`创建备份失败: ${error.message}`);
        }
        
        return false;
    }
}

// 显示备份列表
function showBackupList() {
    const backupListContainer = document.getElementById('backup-list-container');
    const backupList = document.getElementById('backup-list');
    
    if (!backupListContainer || !backupList) return;
    
    // 显示备份列表容器
    backupListContainer.classList.remove('hidden');
    
    // 清空现有列表
    backupList.innerHTML = '';
    
    // 获取备份列表
    let backups = JSON.parse(localStorage.getItem('backups') || '[]');
    
    // 按时间戳排序（最新的在前）
    backups.sort((a, b) => b.timestamp - a.timestamp);
    
    // 如果没有备份，显示提示
    if (backups.length === 0) {
        backupList.innerHTML = '<li class="text-gray-500 italic">没有可用的备份</li>';
        return;
    }
    
    // 添加每个备份到列表
    backups.forEach((backup, index) => {
        const backupDate = new Date(backup.timestamp).toLocaleString();
        const backupType = backup.type === 'auto' ? '自动' : '手动';
        const subscriptionCount = backup.subscriptions ? backup.subscriptions.length : 0;
        
        const listItem = document.createElement('li');
        listItem.className = 'flex justify-between items-center py-1 border-b border-gray-200 last:border-0';
        listItem.innerHTML = `
            <span>
                <strong>${backupDate}</strong> 
                <span class="text-gray-500">(${backupType}, ${subscriptionCount}个订阅)</span>
            </span>
            <button class="restore-backup-btn text-blue-600 hover:text-blue-800" data-index="${index}">
                恢复
            </button>
        `;
        
        backupList.appendChild(listItem);
    });
    
    // 添加恢复按钮事件监听器
    const restoreButtons = backupList.querySelectorAll('.restore-backup-btn');
    restoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            if (confirm('确定要恢复此备份吗？当前数据将被覆盖。')) {
                restoreBackup(index);
            }
        });
    });
}

// 恢复备份
function restoreBackup(index) {
    try {
        // 获取备份列表
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        
        // 检查索引是否有效
        if (index < 0 || index >= backups.length) {
            alert('无效的备份索引');
            return false;
        }
        
        // 获取要恢复的备份
        const backup = backups[index];
        
        // 检查备份数据是否有效
        if (!backup.subscriptions) {
            alert('备份数据无效');
            return false;
        }
        
        // 在恢复前创建当前状态的备份
        createLocalBackup('auto');
        
        // 恢复订阅数据
        window.subscriptions = backup.subscriptions;
        localStorage.setItem(window.STORAGE_KEY, JSON.stringify(window.subscriptions));
        
        // 恢复设置（如果有）
        if (backup.settings) {
            window.appSettings = backup.settings;
            localStorage.setItem(window.SETTINGS_KEY, JSON.stringify(window.appSettings));
        }
        
        // 刷新UI
        renderSubscriptions();
        updateStatistics();
        
        alert('备份已成功恢复！');
        return true;
    } catch (error) {
        console.error('恢复备份时出错:', error);
        alert(`恢复备份失败: ${error.message}`);
        return false;
    }
}

// 导出函数
window.createLocalBackup = createLocalBackup;
window.restoreBackup = restoreBackup;
