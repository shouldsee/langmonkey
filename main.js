// ==UserScript==
// @name         页面侧边栏工具(sidebar版)
// @namespace    http://tampermonkey.net/
// @version      0.9.2
// @description  为当前页面添加可自定义的侧边栏，固定宽度400px，支持自动弹出控制
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    window.GM_xmlhttpRequest = GM_xmlhttpRequest;

    // 检测是否在iframe中运行
    if (window.self !== window.top) {
        console.log('侧边栏工具: 检测到在iframe中运行，不加载侧边栏');
        return;
    }

    const prefix = 'custom-'; // 添加唯一前缀
    const sidebarWidth = 400; // 固定侧边栏宽度为400px
    const handleWidth = 30;   // 侧边栏手柄宽度

    // 添加CSS样式
    GM_addStyle(`
        /* 自动弹出配置项样式 */
        .${prefix}settings-row-auto-open {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .${prefix}settings-checkbox {
            margin-right: 8px;
        }

        body.${prefix}with-sidebar {
            position: relative;
            min-height: 100vh;
            box-sizing: border-box;
            overflow-x: hidden;
            transition: padding-right 0.3s ease;
        }

        #${prefix}sidebar-container {
            position: fixed;
            top: 0;
            right: calc(-${sidebarWidth}px + ${handleWidth}px);
            width: ${sidebarWidth}px; /* 固定宽度 */
            height: 100vh;
            z-index: 9999;
            transition: right 0.3s ease;
        }

        #${prefix}sidebar-container.${prefix}expanded {
            right: 0;
        }

        body.${prefix}sidebar-expanded {
            padding-right: ${sidebarWidth}px;
        }

        #${prefix}sidebar {
            width: calc(100% - ${handleWidth}px);
            height: 100%;
            background-color: #f5f5f5;
            border-left: 1px solid #ddd;
            box-shadow: -2px 0 5px rgba(0,0,0,0.1);
            overflow-y: auto;
            padding: 10px;
            box-sizing: border-box;
            position: absolute;
            right: 0;
            top: 0;
        }

        #${prefix}sidebar-handle {
            position: absolute;
            left: 0;
            top: 50%;
            width: ${handleWidth}px;
            height: 60px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-right: none;
            border-radius: 5px 0 0 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transform: translateY(-50%);
            box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        }

        #${prefix}sidebar-handle:hover {
            background-color: #e0e0e0;
        }

        #${prefix}sidebar-content {
            height: calc(100% - 40px);
            overflow-y: auto;
        }

        #${prefix}sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 10px;
        }

        #${prefix}sidebar-title {
            font-weight: bold;
            font-size: 16px;
            margin: 0;
        }

        .${prefix}sidebar-section {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .${prefix}sidebar-section h3 {
            margin-top: 0;
            font-size: 14px;
            color: #333;
        }

        /* 对话界面样式 */
        #${prefix}chat-container {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 150px);
        }

        #${prefix}chat-messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }

        .${prefix}message {
            margin-bottom: 8px;
            padding: 5px 8px;
            border-radius: 4px;
            max-width: 80%;
            word-wrap: break-word;
            white-space: pre-wrap;
        }

        .${prefix}user-message {
            background-color: #e3f2fd;
            margin-left: auto;
            border: 1px solid #bbdefb;
        }

        .${prefix}bot-message {
            background-color: #f1f1f1;
            margin-right: auto;
            border: 1px solid #e0e0e0;
        }

        #${prefix}chat-input-container {
            display: flex;
            flex-direction: column;
            margin-top: 10px;
        }

        #${prefix}chat-input {
            width: 100%;
            min-height: 40px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
            box-sizing: border-box;
        }

        #${prefix}chat-send {
            margin-top: 5px;
            padding: 8px 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        #${prefix}chat-send:hover {
            background-color: #45a049;
        }

        /* 设置界面样式 */
        .${prefix}settings-section {
            margin-top: 15px;
        }

        .${prefix}settings-row {
            margin-bottom: 10px;
        }

        .${prefix}settings-label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 13px;
        }

        .${prefix}settings-input {
            width: 100%;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        .${prefix}settings-button {
            padding: 6px 12px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .${prefix}settings-button:hover {
            background-color: #0b7dda;
        }

        /* 标签页样式 */
        .${prefix}tab-buttons {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 10px;
        }

        .${prefix}tab-button {
            padding: 8px 15px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            border-bottom: 2px solid transparent;
        }

        .${prefix}tab-button.active {
            border-bottom: 2px solid #2196F3;
            color: #2196F3;
        }

        .${prefix}tab-content {
            display: none;
        }

        .${prefix}tab-content.active {
            display: block;
        }

        /* 加载指示器 */
        .${prefix}typing-indicator {
            display: inline-block;
            padding: 5px 10px;
            background-color: #f1f1f1;
            border-radius: 15px;
            font-size: 12px;
            color: #666;
        }

        .${prefix}typing-indicator span {
            display: inline-block;
            width: 8px;
            height: 8px;
            margin: 0 2px;
            background-color: #999;
            border-radius: 50%;
            opacity: 0.4;
            animation: ${prefix}typing-dots 1.4s infinite both;
        }

        .${prefix}typing-indicator span:nth-child(1) {
            animation-delay: 0s;
        }

        .${prefix}typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .${prefix}typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes ${prefix}typing-dots {
            0%, 60%, 100% { opacity: 0.4; }
            30% { opacity: 1; }
        }

        .${prefix}message-buttons {
            display: flex;
            gap: 5px;
            margin-top: 5px;
        }

        .${prefix}message-button {
            padding: 2px 5px;
            font-size: 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            background-color: #f0f0f0;
        }

        .${prefix}message-button:hover {
            background-color: #e0e0e0;
        }
    `);

    // 创建侧边栏HTML结构
    const sidebarHTML = `
        <div id="${prefix}sidebar-container">
            <div id="${prefix}sidebar">
                <div id="${prefix}sidebar-header">
                    <h2 id="${prefix}sidebar-title">AI助手</h2>
                    <button id="${prefix}settings-button" class="${prefix}settings-button">设置</button>
                </div>
                <div id="${prefix}sidebar-content">
                    <div class="${prefix}tab-buttons">
                        <button class="${prefix}tab-button" data-tab="tools">工具</button>
                        <button class="${prefix}tab-button active" data-tab="chat">对话</button>
                    </div>

                    <div id="${prefix}tools-tab" class="${prefix}tab-content">
                        <div class="${prefix}sidebar-section">
                            <h3>页面信息</h3>
                            <p>URL: ${window.location.href}</p>
                            <p>标题: ${document.title}</p>
                        </div>
                        <div class="${prefix}sidebar-section">
                            <h3>快捷工具</h3>
                            <button id="${prefix}refresh-page" style="margin-right: 5px;">刷新页面</button>
                            <button id="${prefix}scroll-top">回到顶部</button>
                        </div>
                        <div class="${prefix}sidebar-section">
                            <h3>自定义内容</h3>
                            <textarea id="${prefix}sidebar-notes" placeholder="在这里输入笔记..." style="width: 100%; height: 100px;"></textarea>
                            <button id="${prefix}save-notes">保存笔记</button>
                        </div>
                    </div>

                    <div id="${prefix}chat-tab" class="${prefix}tab-content active">
                        <div class="${prefix}sidebar-section" style="border: none; padding: 0; box-shadow: none;">
                            <div id="${prefix}chat-container">
                                <div id="${prefix}chat-messages"></div>
                                <div id="${prefix}chat-input-container">
                                    <textarea id="${prefix}chat-input" placeholder="输入消息... (Shift+Enter换行)" autofocus></textarea>
                                    <div style="display: flex; align-items: center; margin-top: 5px;">
                                        <select id="${prefix}openrouter-model" class="${prefix}settings-input" style="flex: 1; margin-right: 5px;">
                                            <option value="google/gemini-2.5-flash-preview">google/gemini-2.5-flash-preview</option>
                                            <option value="openai/gpt-4o">GPT-4o</option>
                                            <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                            <option value="openai/gpt-4">GPT-4</option>
                                            <option value="anthropic/claude-2">Claude 2</option>
                                            <option value="google/palm-2-chat-bison">PaLM 2 Chat</option>
                                        </select>
                                        <button id="${prefix}chat-send">发送</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="${prefix}settings-tab" class="${prefix}tab-content">
                        <div class="${prefix}sidebar-section">
                            <h3>OpenRouter 设置</h3>
                            <div class="${prefix}settings-row">
                                <label class="${prefix}settings-label">API Key:</label>
                                <input type="password" id="${prefix}openrouter-api-key" class="${prefix}settings-input" placeholder="输入OpenRouter API Key">
                            </div>
                            <div class="${prefix}settings-row">
                                <label class="${prefix}settings-label">最大令牌数:</label>
                                <input type="number" id="${prefix}openrouter-max-tokens" class="${prefix}settings-input" value="512" min="100" max="4096">
                            </div>

                            <div class="${prefix}settings-row ${prefix}settings-row-auto-open">
                                <input type="checkbox" id="${prefix}auto-open-sidebar" class="${prefix}settings-checkbox">
                                <label class="${prefix}settings-label">页面加载时自动弹出侧边栏</label>
                            </div>

                            <button id="${prefix}save-settings" class="${prefix}settings-button">保存设置</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="${prefix}sidebar-handle">≡</div>
        </div>
    `;

    // 为body添加侧边栏相关样式
    document.body.classList.add(`${prefix}with-sidebar`);

    // 插入侧边栏到页面body
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);

    // 获取DOM元素
    const sidebarContainer = document.getElementById(`${prefix}sidebar-container`);
    const handle = document.getElementById(`${prefix}sidebar-handle`);
    const refreshBtn = document.getElementById(`${prefix}refresh-page`);
    const scrollTopBtn = document.getElementById(`${prefix}scroll-top`);
    const notesTextarea = document.getElementById(`${prefix}sidebar-notes`);
    const saveNotesBtn = document.getElementById(`${prefix}save-notes`);
    const chatMessages = document.getElementById(`${prefix}chat-messages`);
    const chatInput = document.getElementById(`${prefix}chat-input`);
    const chatSend = document.getElementById(`${prefix}chat-send`);
    const settingsButton = document.getElementById(`${prefix}settings-button`);
    const saveSettingsBtn = document.getElementById(`${prefix}save-settings`);
    const tabButtons = document.querySelectorAll(`.${prefix}tab-button`);
    const tabContents = document.querySelectorAll(`.${prefix}tab-content`);
    const autoOpenCheckbox = document.getElementById(`${prefix}auto-open-sidebar`);

    // 加载保存的设置
    const openRouterApiKey = GM_getValue('openRouterApiKey', '');
    const openRouterModel = GM_getValue('openRouterModel', 'openai/gpt-3.5-turbo');
    const openRouterMaxTokens = GM_getValue('openRouterMaxTokens', 512);
    const autoOpenSidebar = GM_getValue('autoOpenSidebar', true);

    document.getElementById(`${prefix}openrouter-api-key`).value = openRouterApiKey;
    document.getElementById(`${prefix}openrouter-model`).value = openRouterModel;
    document.getElementById(`${prefix}openrouter-max-tokens`).value = openRouterMaxTokens;
    autoOpenCheckbox.checked = autoOpenSidebar;

    // 加载保存的笔记
    const savedNotes = GM_getValue('sidebarNotes_' + window.location.href, '');
    if (savedNotes) {
        notesTextarea.value = savedNotes;
    }

    // 切换侧边栏展开/折叠状态
    handle.addEventListener('click', function() {
        sidebarContainer.classList.toggle(`${prefix}expanded`);
        document.body.classList.toggle(`${prefix}sidebar-expanded`);
        handle.innerHTML = sidebarContainer.classList.contains(`${prefix}expanded`) ? '≡' : '≡';
    });

    // 刷新页面
    refreshBtn.addEventListener('click', function() {
        window.location.reload();
    });

    // 回到顶部
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 保存笔记
    saveNotesBtn.addEventListener('click', function() {
        const notes = notesTextarea.value;
        GM_setValue('sidebarNotes_' + window.location.href, notes);
        alert('笔记已保存！');
    });

    // 标签页切换
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // 更新按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新内容区域
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${prefix}${tabId}-tab`).classList.add('active');

            // 如果是切换到聊天标签页，自动聚焦输入框
            if (tabId === 'chat') {
                chatInput.focus();
            }
        });
    });

    // 设置按钮点击事件
    settingsButton.addEventListener('click', () => {
        // 切换到设置标签页
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        document.getElementById(`${prefix}settings-tab`).classList.add('active');
    });

    // 保存设置
    saveSettingsBtn.addEventListener('click', function() {
        const apiKey = document.getElementById(`${prefix}openrouter-api-key`).value.trim();
        const model = document.getElementById(`${prefix}openrouter-model`).value;
        const maxTokens = parseInt(document.getElementById(`${prefix}openrouter-max-tokens`).value);
        const autoOpen = autoOpenCheckbox.checked;

        GM_setValue('openRouterApiKey', apiKey);
        GM_setValue('openRouterModel', model);
        GM_setValue('openRouterMaxTokens', maxTokens);
        GM_setValue('autoOpenSidebar', autoOpen);

        alert('设置已保存！');

        // 返回聊天标签页
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector(`.${prefix}tab-button[data-tab="chat"]`).classList.add('active');
        document.getElementById(`${prefix}chat-tab`).classList.add('active');
        chatInput.focus();
    });

    // 发送消息处理
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const evalMessage =  eval(`\`${message}\``)

            addMessage(evalMessage, true);
            chatInput.value = '';

            // 触发消息接收回调
            onRecvUserMessage();
        }
    }

    // 发送按钮点击事件
    chatSend.addEventListener('click', sendMessage);

    // 输入框事件处理
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 添加消息到聊天界面
    function addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(`${prefix}message`);
        messageDiv.classList.add(isUser ? `${prefix}user-message` : `${prefix}bot-message`);

        const messageContent = document.createElement('div');
        messageContent.textContent = text;
        messageDiv.appendChild(messageContent);

        // 添加操作按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = `${prefix}message-buttons`;

        if (isUser) {
            const editButton = document.createElement('button');
            editButton.className = `${prefix}message-button`;
            editButton.textContent = '编辑';
            editButton.addEventListener('click', () => {
                const newText = prompt('编辑消息', text);
                if (newText !== null) {
                    messageContent.textContent = newText;
                }
            });
            buttonContainer.appendChild(editButton);
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = `${prefix}message-button`;
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => {
            if (confirm('确定要删除这条消息吗？')) {
                messageDiv.remove();
            }
        });
        buttonContainer.appendChild(deleteButton);

        messageDiv.appendChild(buttonContainer);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 显示"正在输入"指示器
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = `${prefix}typing-indicator`;
        indicator.className = `${prefix}typing-indicator`;
        indicator.innerHTML = 'AI正在思考<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 隐藏"正在输入"指示器
    function hideTypingIndicator() {
        const indicator = document.getElementById(`${prefix}typing-indicator`);
        if (indicator) {
            indicator.remove();
        }
    }

    // 消息接收回调函数 - 使用OpenRouter API获取回复
    async function onRecvUserMessage() {
        const apiKey = GM_getValue('openRouterApiKey', '');
        const model = GM_getValue('openRouterModel', 'openai/gpt-3.5-turbo');
        const maxTokens = GM_getValue('openRouterMaxTokens', 512);

        if (!apiKey) {
            addMessage("请先在设置中配置OpenRouter API Key", false);

            // 自动跳转到设置页面
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${prefix}settings-tab`).classList.add('active');
            return;
        }

        try {
            showTypingIndicator();

            // 获取所有消息作为上下文
            const messages = getAllMessages();

            const response = await fetchOpenRouterResponse(messages, apiKey, model, maxTokens);
            hideTypingIndicator();
            addMessage(response, false);
        } catch (error) {
            hideTypingIndicator();
            console.error("OpenRouter请求失败:", error);
            addMessage("请求OpenRouter API时出错: " + error.message, false);
        }
    }

    // 调用OpenRouter API
    function fetchOpenRouterResponse(messages, apiKey, model, maxTokens) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://openrouter.ai/api/v1/chat/completions",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                "overrideMimeType": "application/json",
                data: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: maxTokens
                }),

                onload: function(response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.choices && data.choices[0] && data.choices[0].message) {
                            resolve(data.choices[0].message.content);
                        } else {
                            reject(new Error("无效的API响应格式"));
                        }
                    } else {
                        reject(new Error(`API请求失败: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 获取所有消息作为上下文
    function getAllMessages() {
        const messages = [];
        const messageElements = chatMessages.querySelectorAll(`.${prefix}message`);

        messageElements.forEach(element => {
            const isUser = element.classList.contains(`${prefix}user-message`);
            const role = isUser ? 'user' : 'assistant';
            const content = element.querySelector('div').textContent;

            messages.push({
                role: role,
                content: content
            });
        });

        return messages;
    }

    // 添加欢迎消息
    addMessage("您好！我是AI助手，有什么可以帮您的吗？", false);

    // 默认聚焦到聊天输入框
    chatInput.focus();

    // 页面加载完成后自动弹出侧边栏
    document.addEventListener('DOMContentLoaded', function() {
        const autoOpen = GM_getValue('autoOpenSidebar', true);
        if (autoOpen) {
            setTimeout(() => {
                sidebarContainer.classList.add(`${prefix}expanded`);
                document.body.classList.add(`${prefix}sidebar-expanded`);
            }, 300);
        }
    });
})();
