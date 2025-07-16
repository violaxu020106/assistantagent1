document.addEventListener('DOMContentLoaded', () => {
    // --- SiliconFlow API Configuration ---
    const SILICONFLOW_API_KEY = 'sk-hnwlfhrbiydfzzbwyqlbjnjrqxghvyijbzlgyzxdsnhkatjz';
    const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
    const MODEL_NAME = 'Qwen/Qwen3-30B-A3B';
    const BACKEND_API_URL = 'http://localhost:3000/api/data';

    // --- Element Selectors ---
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBox = document.getElementById('chat-box');
    const monthYear = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const todoList = document.getElementById('todo-list');
    const todoTextInput = document.getElementById('todo-text-input');
    const todoDdlInput = document.getElementById('todo-ddl-input');
    const addTodoBtn = document.getElementById('add-todo-btn');

    // --- Modal Elements ---
    const modal = document.getElementById('event-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveEventBtn = document.getElementById('save-event-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const eventDateKeyInput = document.getElementById('event-date-key');
    const eventIndexInput = document.getElementById('event-index');
    const eventTimeInput = document.getElementById('event-time-input');
    const eventTitleInput = document.getElementById('event-title-input');

    // --- State Management ---
    let currentDate = new Date();
    let events = {};
    let todos = [];

    // --- Data Persistence Functions (now using Backend API) ---
    const saveData = async () => {
        try {
            await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events, todos }),
            });
        } catch (error) {
            console.error("Error saving data to backend:", error);
            addMessage("错误：无法连接到后端服务器，数据可能不会被保存。", "system-error");
        }
    };

    const loadData = async () => {
        try {
            const response = await fetch(BACKEND_API_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch data from backend');
            }
            const data = await response.json();
            events = data.events || {};
            todos = data.todos || [];
        } catch (error) {
            console.error("Error loading data from backend:", error);
            addMessage("警告：无法从后端加载数据。您所做的更改将在下次成功连接前无法保存。", "system-error");
            // Initialize with empty data if backend is down
            events = {};
            todos = [];
        }
    };


    // --- To-Do List Functions ---
    const renderTodos = () => {
        todoList.innerHTML = '';
        todos.sort((a, b) => (a.completed - b.completed) || (new Date(a.ddl) - new Date(b.ddl)));
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.dataset.id = todo.id;
            if (todo.completed) li.classList.add('completed');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('todo-checkbox');
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                todo.completed = checkbox.checked;
                saveData(); // Use new save function
                renderTodos();
            });

            const textSpan = document.createElement('span');
            textSpan.classList.add('todo-text');
            textSpan.textContent = todo.text;

            li.appendChild(checkbox);
            li.appendChild(textSpan);

            if (todo.ddl) {
                const ddlSpan = document.createElement('span');
                ddlSpan.classList.add('todo-ddl');
                ddlSpan.textContent = todo.ddl;
                li.appendChild(ddlSpan);
            }

            // --- Add Delete Button ---
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-todo-btn');
            deleteBtn.innerHTML = '&times;'; // A simple 'x' character
            
            li.appendChild(deleteBtn);
            
            todoList.appendChild(li);
        });
    };

    const handleAddTodo = () => {
        const text = todoTextInput.value.trim();
        if (text === '') return;
        const newTodo = { id: Date.now(), text: text, ddl: todoDdlInput.value, completed: false };
        todos.push(newTodo);
        todoTextInput.value = '';
        todoDdlInput.value = '';
        saveData(); // Use new save function
        renderTodos();
    };

    // --- Calendar Functions ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = `<div class="day-name">日</div><div class="day-name">一</div><div class="day-name">二</div><div class="day-name">三</div><div class="day-name">四</div><div class="day-name">五</div><div class="day-name">六</div>`;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYear.textContent = `${year}年 ${month + 1}月`;
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        for (let i = firstDay; i > 0; i--) {
            const day = document.createElement('div');
            day.classList.add('day', 'other-month');
            day.innerHTML = `<span class="day-number">${prevLastDate - i + 1}</span>`;
            calendarGrid.appendChild(day);
        }

        for (let i = 1; i <= lastDate; i++) {
            const day = document.createElement('div');
            day.classList.add('day');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            day.innerHTML = `<span class="day-number">${i}</span><div class="events"></div>`;
            if (year === new Date().getFullYear() && month === new Date().getMonth() && i === new Date().getDate()) {
                day.classList.add('today');
            }
            if (events[dateStr]) {
                const eventsContainer = day.querySelector('.events');
                events[dateStr].forEach((eventText, index) => { // Add index here
                    const eventDiv = document.createElement('div');
                    eventDiv.classList.add('event');
                    eventDiv.textContent = eventText;
                    
                    // --- Add Click Listener to Open Modal ---
                    eventDiv.addEventListener('click', () => {
                        openEventModal(dateStr, index);
                    });

                    eventsContainer.appendChild(eventDiv);
                });
            }
            calendarGrid.appendChild(day);
        }

        const nextDays = (7 - (firstDay + lastDate) % 7) % 7;
        for (let i = 1; i <= nextDays; i++) {
            const day = document.createElement('div');
            day.classList.add('day', 'other-month');
            day.innerHTML = `<span class="day-number">${i}</span>`;
            calendarGrid.appendChild(day);
        }
    };

    // --- Chat Functions ---
    const addMessage = (text, sender, className = '') => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (className) messageDiv.classList.add(className);
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleSend = async () => {
        const text = userInput.value.trim();
        if (text === '') return;
        addMessage(text, 'user');
        userInput.value = '';
        addMessage('AI 正在思考中...', 'assistant', 'thinking');
        try {
            const response = await fetch(SILICONFLOW_API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SILICONFLOW_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { role: "system", content: `你是一个智能个人助理。你的任务是根据用户输入的自然语言，判断其意图是安排一个有明确时间的“日程”还是一个需要在未来某个时间点完成的“待办事项”。\n- **意图判断**:\n  - 如果用户描述的是一个有具体日期和时间的约定，比如“明天下午3点开会”或“周五晚上7点去看电影”，这应该被视为一个“日程”，请使用 'create_event' 工具。\n  - 如果用户描述的是一个需要完成的任务，但没有严格的时间点，比如“提醒我今天下午买牛奶”或“下周三之前提交报告”，这应该被视为一个“待办事项”，请使用 'create_todo' 工具。\n- **工具使用**:\n  - \`create_event\`: 用于创建日历日程。需要 'date' (YYYY-MM-DD), 'title' (10字以内总结), 和可选的 'time' (HH:MM)。\n  - \`create_todo\`: 用于创建待办事项。需要 'text' (任务描述) 和可选的 'ddl' (截止日期 YYYY-MM-DD)。\n- **准确性**: 严格按照用户提供的信息提取参数。如果信息不明确，请向用户提问。今天的日期是 ${new Date().toISOString().split('T')[0]}。` },
                        { role: 'user', content: text }
                    ],
                    tools: [
                        { type: "function", function: { name: "create_event", description: "为用户创建一个有明确时间的日历日程。", parameters: { type: "object", properties: { date: { type: "string", description: "事件的日期 (YYYY-MM-DD)" }, time: { type: "string", description: "事件的时间 (HH:MM)" }, title: { type: "string", description: "总结性的事件标题(10字以内)" } }, required: ["date", "title"] } } },
                        { type: "function", function: { name: "create_todo", description: "为用户创建一个待办事项。", parameters: { type: "object", properties: { text: { type: "string", description: "待办事项的具体内容" }, ddl: { type: "string", description: "待办事项的截止日期 (YYYY-MM-DD)" } }, required: ["text"] } } }
                    ],
                    tool_choice: "auto"
                }),
            });

            if (!response.ok) throw new Error(`API 请求失败: ${response.status}`);
            
            const data = await response.json();
            document.querySelector('.thinking')?.remove();
            const assistantMessage = data.choices[0].message;

            let eventsCreated = false;
            let todosCreated = false;
            let hasFaultyToolCall = false;

            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                assistantMessage.tool_calls.forEach(toolCall => {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (toolCall.function.name === 'create_event') {
                            if (args.date && args.title) {
                                const dateStr = args.date;
                                const eventText = args.time ? `${args.time} ${args.title}` : args.title;
                                if (!events[dateStr]) events[dateStr] = [];
                                events[dateStr].push(eventText);
                                addMessage(`好的，已为您安排日程：${dateStr} 的 "${eventText}"。`, 'assistant');
                                eventsCreated = true;
                            } else { hasFaultyToolCall = true; }
                        } else if (toolCall.function.name === 'create_todo') {
                            if (args.text) {
                                const newTodo = { id: Date.now(), text: args.text, ddl: args.ddl || '', completed: false };
                                todos.push(newTodo);
                                addMessage(`好的，已为您添加待办事项：“${args.text}"。`, 'assistant');
                                todosCreated = true;
                            } else { hasFaultyToolCall = true; }
                        }
                    } catch (e) {
                        hasFaultyToolCall = true;
                        console.error("解析工具调用参数时出错:", e);
                    }
                });
            }

            if (eventsCreated || todosCreated) {
                await saveData(); // Save data if any changes were made
            }

            if (eventsCreated) renderCalendar();
            if (todosCreated) renderTodos();

            if (assistantMessage.content) {
                addMessage(assistantMessage.content, 'assistant');
            } else if (hasFaultyToolCall && !eventsCreated && !todosCreated) {
                addMessage('抱歉，我没能完全理解您的指令。可以请您用更明确的方式再说一遍吗？', 'assistant');
            }
        } catch (error) {
            console.error('调用 API 时出错:', error);
            document.querySelector('.thinking')?.remove();
            addMessage(`抱歉，连接AI助手时出现问题: ${error.message}`, 'assistant');
        }
    };

    // --- Modal Control Functions ---
    const openEventModal = (dateKey, eventIndex) => {
        const eventString = events[dateKey][eventIndex];
        // Simple regex to split time and title
        const match = eventString.match(/(\d{2}:\d{2})\s*(.*)/);

        if (match) {
            eventTimeInput.value = match[1];
            eventTitleInput.value = match[2];
        } else {
            eventTimeInput.value = '';
            eventTitleInput.value = eventString;
        }

        eventDateKeyInput.value = dateKey;
        eventIndexInput.value = eventIndex;
        modal.style.display = 'flex';
    };

    const closeEventModal = () => {
        modal.style.display = 'none';
    };

    // --- Event Listeners for Modal ---
    saveEventBtn.addEventListener('click', async () => {
        const dateKey = eventDateKeyInput.value;
        const index = parseInt(eventIndexInput.value, 10);
        const newTime = eventTimeInput.value;
        const newTitle = eventTitleInput.value.trim();

        if (!newTitle) {
            alert('事件标题不能为空！');
            return;
        }

        const newEventString = newTime ? `${newTime} ${newTitle}` : newTitle;
        
        // Update the event in the local state
        events[dateKey][index] = newEventString;

        // Save to backend and re-render
        await saveData();
        renderCalendar();
        closeEventModal();
    });

    deleteEventBtn.addEventListener('click', async () => {
        const dateKey = eventDateKeyInput.value;
        const index = parseInt(eventIndexInput.value, 10);

        // Remove the event from the array
        events[dateKey].splice(index, 1);

        // If the day has no more events, remove the key
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }
        
        // Save to backend and re-render
        await saveData();
        renderCalendar();
        closeEventModal();
    });

    closeModalBtn.addEventListener('click', closeEventModal);
    // Also close modal if clicking on the overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEventModal();
        }
    });


    // --- Event Listeners and Initial Load ---
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    addTodoBtn.addEventListener('click', handleAddTodo);
    todoTextInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddTodo(); });

    todoList.addEventListener('click', (e) => {
        const target = e.target;

        // --- Handle Delete Button Click ---
        if (target.classList.contains('delete-todo-btn')) {
            const li = target.closest('li');
            const todoId = parseInt(li.dataset.id, 10);
            todos = todos.filter(t => t.id !== todoId);
            saveData();
            renderTodos();
            return; // Stop further processing
        }
        
        // --- Handle DDL Click to Edit ---
        if (target.classList.contains('todo-ddl')) {
            const li = target.closest('li');
            const todoId = parseInt(li.dataset.id, 10);
            const todo = todos.find(t => t.id === todoId);
            if (!todo) return;
            
            const currentDdl = todo.ddl;
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = currentDdl;
            dateInput.classList.add('todo-edit-input'); 

            li.replaceChild(dateInput, target);
            dateInput.focus();

            const saveDdlEdit = () => {
                const newDdl = dateInput.value;
                if (newDdl !== currentDdl) {
                    todo.ddl = newDdl;
                    saveData();
                }
                renderTodos();
            };

            dateInput.addEventListener('blur', saveDdlEdit);
            dateInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') dateInput.blur();
                else if (e.key === 'Escape') renderTodos();
            });

            return; // Stop further processing
        }

        // Check if a to-do item's text was clicked
        if (target && target.classList.contains('todo-text')) {
            if (document.querySelector('.todo-edit-input')) return;
            const li = target.closest('li');
            const todoId = parseInt(li.dataset.id, 10);
            const todo = todos.find(t => t.id === todoId);
            if (!todo) return;
            const currentText = todo.text;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.classList.add('todo-edit-input');
            li.replaceChild(input, target);
            input.focus();
            const saveEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== currentText) {
                    todo.text = newText;
                    saveData(); // Use new save function
                }
                renderTodos();
            };
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { input.blur(); } 
                else if (e.key === 'Escape') { renderTodos(); }
            });
        }
    });

    // Initial Load from Backend
    (async () => {
        await loadData();
        renderTodos();
        renderCalendar();
    })();
});