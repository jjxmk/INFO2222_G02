// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Calendar element not found');
        return;
    }

    try {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            slotMinTime: '08:00:00',
            slotMaxTime: '20:00:00',
            allDaySlot: false,
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            height: 'auto',
            themeSystem: 'standard',
            events: [
                {
                    title: 'Team Meeting',
                    start: '2024-03-30T10:00:00',
                    end: '2024-03-30T11:00:00',
                    backgroundColor: '#9C27B0'
                },
                {
                    title: 'Available',
                    start: '2024-03-30T09:00:00',
                    end: '2024-03-30T17:00:00',
                    backgroundColor: '#4CAF50'
                }
            ],
            select: function(info) {
                showAddEventModal(info);
            },
            eventClick: function(info) {
                showEventDetails(info.event);
            }
        });
        
        calendar.render();
        console.log('Calendar initialized successfully');
        
        // Store calendar instance for later use
        calendarEl._calendar = calendar;
    } catch (error) {
        console.error('Error initializing calendar:', error);
    }

    // Initialize other functionalities
    initializeChat();
    initializeTasks();
    initializeWorkLog();

    // Initialize quick action buttons
    const newTaskBtn = document.querySelector('.action-btn.new-task');
    const startMeetingBtn = document.querySelector('.action-btn.start-meeting');
    const addResourceBtn = document.querySelector('.action-btn.add-resource');
    const addMemberBtn = document.querySelector('.add-member-btn');

    console.log('Add Member button found:', !!addMemberBtn);

    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', showNewTaskModal);
    }
    if (startMeetingBtn) {
        startMeetingBtn.addEventListener('click', showStartMeetingModal);
    }
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAddResourceModal();
        });
    }
    if (addMemberBtn) {
        console.log('Adding click event listener to Add Member button');
        addMemberBtn.addEventListener('click', (e) => {
            console.log('Add Member button clicked');
            e.preventDefault();
            e.stopPropagation();
            showAddMemberModal();
        });
    }

    // Initialize video meeting functionality
    initializeVideoMeeting();
});

// User status management
const userStatuses = {
    'John Doe': false,
    'Jane Smith': false,
    'Mike Johnson': false
};

// Simulate online status updates
function initializeUserStatus() {
    // Set current user as online
    const currentUser = 'John Doe'; // This would normally come from authentication
    userStatuses[currentUser] = true;
    updateStatusIndicators();

    // Simulate other users' status changes
    setInterval(() => {
        // Randomly update other users' status
        Object.keys(userStatuses).forEach(user => {
            if (user !== currentUser && Math.random() < 0.3) {
                userStatuses[user] = !userStatuses[user];
                updateStatusIndicators();
            }
        });
    }, 30000); // Check every 30 seconds

    // Update status when user leaves/returns to the page
    document.addEventListener('visibilitychange', () => {
        userStatuses[currentUser] = !document.hidden;
        updateStatusIndicators();
    });

    // Update status before user leaves the page
    window.addEventListener('beforeunload', () => {
        userStatuses[currentUser] = false;
        updateStatusIndicators();
    });
}

function updateStatusIndicators() {
    // Update chat list status indicators
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        const userName = item.querySelector('.chat-name').textContent;
        const statusDot = item.querySelector('.status-indicator');
        if (statusDot) {
            statusDot.className = `status-indicator ${userStatuses[userName] ? 'online' : 'offline'}`;
        }
    });

    // Update user profile status if it exists
    const userProfileStatus = document.querySelector('.user-profile .status-indicator');
    if (userProfileStatus) {
        userProfileStatus.className = `status-indicator ${userStatuses['John Doe'] ? 'online' : 'offline'}`;
    }
}

// Chat functionality
let currentChatUser = null;
const chatData = {
    'John Doe': [],
    'Jane Smith': [],
    'Mike Johnson': []
};

function initializeChat() {
    initializeUserStatus();
    
    const chatList = document.querySelector('.chat-list');
    const messageInput = document.querySelector('.message-input input');
    const sendButton = document.querySelector('.message-input .send-btn');

    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    chatList.appendChild(resizeHandle);

    // Handle chat list resizing
    let isResizing = false;
    let startX;
    let startWidth;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = chatList.offsetWidth;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            
            if (chatList.offsetWidth < 100) {
                chatList.classList.add('collapsed');
            } else {
                chatList.classList.remove('collapsed');
            }
        });
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        
        const width = startWidth + (e.clientX - startX);
        chatList.style.width = Math.max(60, Math.min(300, width)) + 'px';
        
        const chatInfos = document.querySelectorAll('.chat-info');
        chatInfos.forEach(info => {
            info.style.opacity = (width < 100) ? '0' : '1';
        });
    }

    // Double click handle to toggle collapsed state
    resizeHandle.addEventListener('dblclick', () => {
        chatList.classList.toggle('collapsed');
    });

    if (chatList && messageInput && sendButton) {
        // Add click event listeners to chat items
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                chatItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const userName = item.querySelector('.chat-name').textContent;
                currentChatUser = userName;
                showChat(userName);
                
                if (chatList.classList.contains('collapsed')) {
                    chatList.classList.remove('collapsed');
                }
            });
        });

        // Add send message functionality
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Initialize with first chat
        if (chatItems.length > 0) {
            currentChatUser = chatItems[0].querySelector('.chat-name').textContent;
            chatItems[0].classList.add('active');
            showChat(currentChatUser);
        }
    }
}

function sendMessage() {
    if (!currentChatUser) return;
    
    const messageInput = document.querySelector('.message-input input');
    const message = messageInput.value.trim();
    
    if (message) {
        // Add message to chat data
        const myMessage = {
            sender: 'Me',
            text: message,
            time: new Date(),
            isSent: true
        };
        chatData[currentChatUser].push(myMessage);
        
        // Clear input
        messageInput.value = '';
        
        // Update chat display
        showChat(currentChatUser);
        
        // Simulate response after 1 second
        setTimeout(() => {
            const responses = [
                "I'll look into that.",
                "Thanks for letting me know!",
                "Got it, I'll get back to you soon.",
                "That sounds good!",
                "Let me check and get back to you."
            ];
            const response = {
                sender: currentChatUser,
                text: responses[Math.floor(Math.random() * responses.length)],
                time: new Date(),
                isSent: false
            };
            chatData[currentChatUser].push(response);
            showChat(currentChatUser);
        }, 1000);
    }
}

function showChat(userName) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    const messages = chatData[userName] || [];
    messagesContainer.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.isSent ? 'sent' : 'received'}">
            <div class="message-content">
                <div class="message-text">${msg.text}</div>
                <div class="message-time">${formatMessageTime(msg.time)}</div>
            </div>
        </div>
    `).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessageTime(time) {
    if (typeof time === 'string') {
        time = new Date(time);
    }
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Task list functionality
let tasks = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 1, title: 'Complete project proposal', completed: false, dueDate: '2024-03-30', assignee: 'John Doe' },
    { id: 2, title: 'Design user interface', completed: false, dueDate: '2024-03-31', assignee: 'Jane Smith' },
    { id: 3, title: 'Implement authentication', completed: false, dueDate: '2024-04-01', assignee: 'Mike Johnson' }
];

function initializeTasks() {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    function renderTasks() {
        taskList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span><i class="far fa-calendar"></i>${new Date(task.dueDate).toLocaleDateString()}</span>
                        <span><i class="far fa-user"></i>${task.assignee}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to checkboxes
        document.querySelectorAll('.task-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = e.target.checked;
                    e.target.closest('.task-item').classList.toggle('completed');
                    saveTasks();
                    updateTaskCount();
                }
            });
        });
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateTaskCount() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const taskCountElement = document.querySelector('.task-count');
        if (taskCountElement) {
            taskCountElement.textContent = `${completedTasks}/${totalTasks} tasks completed`;
        }
    }

    renderTasks();
    updateTaskCount();
}

function addNewTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const assignee = document.getElementById('taskAssignee').value;
    const addToCalendar = document.getElementById('addToCalendar').checked;

    // Create new task
    const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        title: title,
        description: description,
        completed: false,
        dueDate: dueDate,
        assignee: assignee,
        createdAt: new Date().toISOString()
    };

    // Add task to array
    tasks.push(newTask);

    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Re-render tasks
    initializeTasks();

    // Add to calendar if checked
    if (addToCalendar && window._calendar) {
        window._calendar.addEvent({
            title: title,
            start: dueDate,
            allDay: true,
            backgroundColor: '#4299e1'
        });
    }

    showNotification('Task created successfully!', 'success');
}

// Work log functionality
function initializeWorkLog() {
    const workLogEntries = document.querySelector('.worklog-entries');
    const entries = [
        {
            id: 1,
            user: 'John Doe',
            action: 'Started working on the project proposal',
            timestamp: new Date('2024-03-30T09:00:00')
        },
        {
            id: 2,
            user: 'Jane Smith',
            action: 'Completed the UI design mockups',
            timestamp: new Date('2024-03-30T10:30:00')
        }
    ];

    function renderWorkLog() {
        workLogEntries.innerHTML = entries.map(entry => `
            <div class="worklog-entry">
                <div class="entry-header">
                    <span class="entry-user">${entry.user}</span>
                    <span class="entry-time">${entry.timestamp.toLocaleString()}</span>
                </div>
                <div class="entry-action">${entry.action}</div>
            </div>
        `).join('');
    }

    renderWorkLog();
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Quick action buttons
function showNewTaskModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>New Task</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form id="newTaskForm">
                <div class="form-group">
                    <label for="taskTitle">Task Title</label>
                    <input type="text" id="taskTitle" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="taskDueDate">Due Date</label>
                    <input type="datetime-local" id="taskDueDate" required>
                </div>
                <div class="form-group">
                    <label for="taskAssignee">Assign To</label>
                    <select id="taskAssignee">
                        <option value="John Doe">John Doe</option>
                        <option value="Jane Smith">Jane Smith</option>
                        <option value="Mike Johnson">Mike Johnson</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="addToCalendar">
                        Add to Calendar
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Create Task</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    const form = modal.querySelector('#newTaskForm');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewTask();
        modal.remove();
    });
}

function showStartMeetingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Start Meeting</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="meeting-options">
                <button class="meeting-btn video-btn">
                    <i class="fas fa-video"></i>
                    Start Video Meeting
                </button>
                <button class="meeting-btn audio-btn">
                    <i class="fas fa-phone"></i>
                    Start Audio Call
                </button>
                <div class="meeting-settings">
                    <label>
                        <input type="checkbox" checked> Enable Screen Sharing
                    </label>
                    <label>
                        <input type="checkbox" checked> Enable Recording
                    </label>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const videoBtn = modal.querySelector('.video-btn');
    const audioBtn = modal.querySelector('.audio-btn');

    closeBtn.addEventListener('click', () => modal.remove());
    videoBtn.addEventListener('click', () => {
        startMeeting('video');
        modal.remove();
    });
    audioBtn.addEventListener('click', () => {
        startMeeting('audio');
        modal.remove();
    });
}

function showAddResourceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Resource</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form id="resourceForm">
                <div class="form-group">
                    <label for="resourceTitle">Title</label>
                    <input type="text" id="resourceTitle" required>
                </div>
                <div class="form-group">
                    <label for="resourceType">Type</label>
                    <select id="resourceType" required>
                        <option value="document">Document</option>
                        <option value="link">Link</option>
                        <option value="file">File</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="resourceDescription">Description</label>
                    <textarea id="resourceDescription" rows="3"></textarea>
                </div>
                <div class="form-group" id="fileInputGroup">
                    <label for="resourceFile">Upload File</label>
                    <input type="file" id="resourceFile">
                </div>
                <div class="form-group" id="linkInputGroup" style="display: none;">
                    <label for="resourceLink">Add Link</label>
                    <input type="url" id="resourceLink" placeholder="https://">
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Add Resource</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    const form = modal.querySelector('#resourceForm');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const resourceType = modal.querySelector('#resourceType');
    const fileInputGroup = modal.querySelector('#fileInputGroup');
    const linkInputGroup = modal.querySelector('#linkInputGroup');

    // Show/hide file/link inputs based on resource type
    resourceType.addEventListener('change', () => {
        if (resourceType.value === 'file') {
            fileInputGroup.style.display = 'block';
            linkInputGroup.style.display = 'none';
        } else if (resourceType.value === 'link') {
            fileInputGroup.style.display = 'none';
            linkInputGroup.style.display = 'block';
        } else {
            fileInputGroup.style.display = 'none';
            linkInputGroup.style.display = 'none';
        }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('resourceTitle').value;
        const type = document.getElementById('resourceType').value;
        const description = document.getElementById('resourceDescription').value;
        const file = document.getElementById('resourceFile').files[0];
        const link = document.getElementById('resourceLink').value;

        // Create new resource
        const newResource = {
            id: Date.now(),
            title: title,
            type: type,
            description: description,
            createdAt: new Date().toISOString(),
            createdBy: 'John Doe', // In a real app, this would be the logged-in user
            file: file ? {
                name: file.name,
                size: file.size,
                type: file.type
            } : null,
            link: link || null
        };

        // Add to resources array
        resources.push(newResource);
        
        // Save to localStorage
        localStorage.setItem('resources', JSON.stringify(resources));
        
        // Update the display
        renderResources();
        
        // Show success notification
        showNotification('Resource added successfully!', 'success');
        
        // Close the modal
        modal.remove();
    });

    // Handle modal closing
    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Video Meeting State
let localStream = null;
let peerConnections = {};
let meetingActive = false;

// Initialize video meeting functionality
function initializeVideoMeeting() {
    const videoContainer = document.getElementById('video-meeting-container');
    const localVideo = document.getElementById('localVideo');
    const toggleVideoBtn = document.getElementById('toggleVideo');
    const toggleAudioBtn = document.getElementById('toggleAudio');
    const toggleScreenBtn = document.getElementById('toggleScreen');
    const endCallBtn = document.getElementById('endCall');

    if (!videoContainer || !localVideo || !toggleVideoBtn || !toggleAudioBtn || !toggleScreenBtn || !endCallBtn) {
        console.error('Video meeting elements not found');
        return;
    }

    // Add event listeners for video controls
    toggleVideoBtn.addEventListener('click', toggleVideo);
    toggleAudioBtn.addEventListener('click', toggleAudio);
    toggleScreenBtn.addEventListener('click', toggleScreenShare);
    endCallBtn.addEventListener('click', endMeeting);

    // Initialize meeting tabs
    const tabBtns = document.querySelectorAll('.meeting-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

// Start video meeting
async function startMeeting(type) {
    try {
        // Request camera and microphone access
        localStream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });

        // Display local video
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // Show video meeting container
        const videoContainer = document.getElementById('video-meeting-container');
        if (videoContainer) {
            videoContainer.classList.remove('hidden');
        }

        meetingActive = true;
        showNotification('Meeting started successfully!', 'success');

        // Start meeting timer
        startMeetingTimer();

        // In a real application, you would:
        // 1. Connect to a signaling server
        // 2. Create peer connections for each participant
        // 3. Handle ICE candidates and offer/answer exchange
        // For now, we'll just simulate remote participants
        simulateRemoteParticipants();
    } catch (error) {
        console.error('Error starting meeting:', error);
        showNotification('Failed to start meeting. Please check your camera and microphone permissions.', 'error');
    }
}

// Toggle video
function toggleVideo() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const toggleVideoBtn = document.getElementById('toggleVideo');
        toggleVideoBtn.classList.toggle('disabled');
    }
}

// Toggle audio
function toggleAudio() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const toggleAudioBtn = document.getElementById('toggleAudio');
        toggleAudioBtn.classList.toggle('disabled');
    }
}

// Toggle screen sharing
async function toggleScreenShare() {
    try {
        if (!localStream) return;
        const toggleScreenBtn = document.getElementById('toggleScreen');
        
        if (!toggleScreenBtn.classList.contains('active')) {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track
            const sender = localStream.getVideoTracks()[0];
            if (sender) {
                sender.replaceTrack(videoTrack);
            }
            
            toggleScreenBtn.classList.add('active');
            
            // Handle screen sharing stop
            videoTrack.onended = () => {
                toggleScreenBtn.classList.remove('active');
            };
        }
    } catch (error) {
        console.error('Error sharing screen:', error);
        showNotification('Failed to share screen', 'error');
    }
}

// End meeting
function endMeeting() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Clear remote videos
    const remoteVideos = document.getElementById('remoteVideos');
    if (remoteVideos) {
        remoteVideos.innerHTML = '';
    }
    
    // Hide video container
    const videoContainer = document.getElementById('video-meeting-container');
    if (videoContainer) {
        videoContainer.classList.add('hidden');
    }
    
    meetingActive = false;
    stopMeetingTimer();
    showNotification('Meeting ended', 'success');
}

// Switch meeting tabs
function switchTab(tab) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabBtns = document.querySelectorAll('.meeting-tabs .tab-btn');
    
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tab}-tab`) {
            content.classList.add('active');
        }
    });
    
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
}

// Start meeting timer
function startMeetingTimer() {
    const timerElement = document.querySelector('.meeting-time');
    if (!timerElement) return;
    
    let seconds = 0;
    const timer = setInterval(() => {
        if (!meetingActive) {
            clearInterval(timer);
            return;
        }
        
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }, 1000);
}

// Stop meeting timer
function stopMeetingTimer() {
    const timerElement = document.querySelector('.meeting-time');
    if (timerElement) {
        timerElement.textContent = '00:00:00';
    }
}

// Simulate remote participants (for demo purposes)
function simulateRemoteParticipants() {
    const remoteVideos = document.getElementById('remoteVideos');
    if (!remoteVideos) return;
    
    // Create 3 simulated remote participants
    for (let i = 1; i <= 3; i++) {
        const remoteVideo = document.createElement('video');
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.muted = true;
        
        // Create a canvas to generate a simulated video stream
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw a colored rectangle with participant number
        ctx.fillStyle = `hsl(${i * 120}, 70%, 50%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Participant ${i}`, canvas.width / 2, canvas.height / 2);
        
        // Create a media stream from the canvas
        const stream = canvas.captureStream(30);
        remoteVideo.srcObject = stream;
        
        remoteVideos.appendChild(remoteVideo);
    }
}

// Search functionality
const searchInput = document.querySelector('.search-bar input');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Here you would typically implement search functionality
    // For now, we'll just show a notification
    if (searchTerm.length > 2) {
        showNotification(`Searching for: ${searchTerm}`, 'info');
    }
});

// Add Event Modal
function showAddEventModal(info) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Event</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form id="addEventForm">
                <div class="form-group">
                    <label for="eventTitle">Event Title</label>
                    <input type="text" id="eventTitle" required>
                </div>
                <div class="form-group">
                    <label for="eventType">Event Type</label>
                    <select id="eventType" required>
                        <option value="meeting">Meeting</option>
                        <option value="availability">Availability</option>
                        <option value="deadline">Deadline</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventStart">Start Time</label>
                    <input type="datetime-local" id="eventStart" value="${info.startStr}" required>
                </div>
                <div class="form-group">
                    <label for="eventEnd">End Time</label>
                    <input type="datetime-local" id="eventEnd" value="${info.endStr}" required>
                </div>
                <div class="form-group">
                    <label for="eventDescription">Description</label>
                    <textarea id="eventDescription" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Add Event</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('#addEventForm');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventData = {
            title: document.getElementById('eventTitle').value,
            type: document.getElementById('eventType').value,
            start: document.getElementById('eventStart').value,
            end: document.getElementById('eventEnd').value,
            description: document.getElementById('eventDescription').value
        };
        addEvent(eventData);
        modal.remove();
    });
}

// Event Details Modal
function showEventDetails(event) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Event Details</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="event-details">
                <h4>${event.title}</h4>
                <p><strong>Type:</strong> ${event.extendedProps.type || 'Meeting'}</p>
                <p><strong>Start:</strong> ${event.start.toLocaleString()}</p>
                <p><strong>End:</strong> ${event.end.toLocaleString()}</p>
                <p><strong>Attendees:</strong> ${event.extendedProps.attendees?.join(', ') || 'None'}</p>
                <p><strong>Description:</strong> ${event.extendedProps.description || 'No description'}</p>
            </div>
            <div class="form-actions">
                <button class="edit-btn">Edit Event</button>
                <button class="delete-btn">Delete Event</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const editBtn = modal.querySelector('.edit-btn');
    const deleteBtn = modal.querySelector('.delete-btn');

    closeBtn.addEventListener('click', () => modal.remove());
    editBtn.addEventListener('click', () => {
        modal.remove();
        showEditEventModal(event);
    });
    deleteBtn.addEventListener('click', () => {
        event.remove();
        modal.remove();
        showNotification('Event deleted successfully!', 'success');
    });
}

// Add Event Function
function addEvent(eventData) {
    const calendar = document.getElementById('calendar')._calendar;
    const eventColor = getEventColor(eventData.type);
    
    calendar.addEvent({
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        color: eventColor,
        extendedProps: {
            type: eventData.type,
            attendees: eventData.attendees,
            description: eventData.description
        }
    });

    showNotification('Event added successfully!', 'success');
}

// Get Event Color
function getEventColor(type) {
    switch(type) {
        case 'meeting':
            return '#9C27B0';
        case 'availability':
            return '#4CAF50';
        case 'deadline':
            return '#F44336';
        default:
            return '#2196F3';
    }
}

// Edit Event Modal
function showEditEventModal(event) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Event</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form id="editEventForm">
                <div class="form-group">
                    <label for="editedTitle">Title</label>
                    <input type="text" id="editedTitle" value="${event.title}" required>
                </div>
                <div class="form-group">
                    <label for="editedType">Type</label>
                    <select id="editedType" required>
                        <option value="meeting" ${event.extendedProps.type === 'meeting' ? 'selected' : ''}>Meeting</option>
                        <option value="availability" ${event.extendedProps.type === 'availability' ? 'selected' : ''}>Availability</option>
                        <option value="deadline" ${event.extendedProps.type === 'deadline' ? 'selected' : ''}>Deadline</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editedStart">Start Time</label>
                    <input type="datetime-local" id="editedStart" value="${event.start.toISOString().split('T')[0] + 'T' + event.start.toISOString().split('T')[1]}" required>
                </div>
                <div class="form-group">
                    <label for="editedEnd">End Time</label>
                    <input type="datetime-local" id="editedEnd" value="${event.end.toISOString().split('T')[0] + 'T' + event.end.toISOString().split('T')[1]}" required>
                </div>
                <div class="form-group">
                    <label for="editedAttendees">Attendees</label>
                    <select id="editedAttendees" multiple>
                        <option value="John Doe" ${event.extendedProps.attendees?.includes('John Doe') ? 'selected' : ''}>John Doe</option>
                        <option value="Jane Smith" ${event.extendedProps.attendees?.includes('Jane Smith') ? 'selected' : ''}>Jane Smith</option>
                        <option value="Mike Johnson" ${event.extendedProps.attendees?.includes('Mike Johnson') ? 'selected' : ''}>Mike Johnson</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editedDescription">Description</label>
                    <textarea id="editedDescription" rows="3">${event.extendedProps.description || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('#editEventForm');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editedEvent = {
            title: document.getElementById('editedTitle').value,
            type: document.getElementById('editedType').value,
            start: document.getElementById('editedStart').value,
            end: document.getElementById('editedEnd').value,
            attendees: Array.from(document.getElementById('editedAttendees').selectedOptions).map(option => option.value),
            description: document.getElementById('editedDescription').value
        };
        editEvent(event, editedEvent);
        modal.remove();
    });
}

// Edit Event Function
function editEvent(event, editedEvent) {
    event.setProp('title', editedEvent.title);
    event.setProp('start', editedEvent.start);
    event.setProp('end', editedEvent.end);
    event.setProp('color', getEventColor(editedEvent.type));
    event.setExtendedProp('type', editedEvent.type);
    event.setExtendedProp('attendees', editedEvent.attendees);
    event.setExtendedProp('description', editedEvent.description);
    showNotification('Event updated successfully!', 'success');
}

// Mock data for demonstration
const mockUsers = [
    { id: 1, name: 'John Doe', status: 'Working on UI', avatar: 'https://via.placeholder.com/40' },
    { id: 2, name: 'Jane Smith', status: 'Available', avatar: 'https://via.placeholder.com/40' },
    { id: 3, name: 'Mike Johnson', status: 'In a meeting', avatar: 'https://via.placeholder.com/40' }
];

const mockEvents = [
    { id: 1, title: 'Team Meeting', date: '2024-03-30T10:00:00', type: 'meeting' },
    { id: 2, title: 'Project Deadline', date: '2024-03-31T17:00:00', type: 'deadline' },
    { id: 3, title: 'Code Review', date: '2024-04-01T14:00:00', type: 'meeting' }
];

// Calendar functionality
function generateCalendarGrid() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let calendarHTML = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="previousMonth()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h4>${today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
            <button class="calendar-nav-btn" onclick="nextMonth()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
        </div>
        <div class="calendar-days">
    `;

    let currentDay = firstDay.getDay();
    for (let i = 0; i < currentDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const hasEvent = mockEvents.some(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === today.getMonth() &&
                   eventDate.getFullYear() === today.getFullYear();
        });

        calendarHTML += `
            <div class="calendar-day ${hasEvent ? 'has-event' : ''}" onclick="showDayEvents(${day})">
                ${day}
                ${hasEvent ? '<span class="event-dot"></span>' : ''}
            </div>
        `;
    }

    calendarHTML += '</div>';
    document.querySelector('.calendar-grid').innerHTML = calendarHTML;
    updateEventList();
}

function updateEventList() {
    const eventList = document.querySelector('.event-list');
    eventList.innerHTML = mockEvents.map(event => `
        <div class="event-item" onclick="showEventDetails(${event.id})">
            <i class="fas ${getEventIcon(event.type)}"></i>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${formatDate(event.date)}</div>
            </div>
        </div>
    `).join('');
}

function getEventIcon(type) {
    switch(type) {
        case 'meeting':
            return 'fa-video';
        case 'deadline':
            return 'fa-flag';
        default:
            return 'fa-calendar';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('default', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function showDayEvents(day) {
    const dayEvents = mockEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day;
    });

    if (dayEvents.length > 0) {
        const eventsHTML = dayEvents.map(event => `
            <div class="event-item">
                <i class="fas ${getEventIcon(event.type)}"></i>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${formatDate(event.date)}</div>
                </div>
            </div>
        `).join('');

        const modal = document.createElement('div');
        modal.className = 'modal day-events-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Events for ${day}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${eventsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

function showEventDetails(eventId) {
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return;

    const modal = document.createElement('div');
    modal.className = 'modal event-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Event Details</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p><strong>Type:</strong> ${event.type}</p>
                    <p><strong>Date:</strong> ${formatDate(event.date)}</p>
                    <div class="form-actions">
                        <button class="edit-btn">Edit Event</button>
                        <button class="delete-btn">Delete Event</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Calendar navigation
function previousMonth() {
    // Implement previous month navigation
    console.log('Previous month');
}

function nextMonth() {
    // Implement next month navigation
    console.log('Next month');
}

// Fullscreen calendar
document.getElementById('calendar-fullscreen').addEventListener('click', () => {
    const modal = document.getElementById('calendar-modal');
    modal.style.display = 'block';
    generateFullscreenCalendar();
});

function generateFullscreenCalendar() {
    const content = document.querySelector('.calendar-fullscreen-content');
    content.innerHTML = `
        <div class="fullscreen-calendar">
            <div class="calendar-grid">
                ${document.querySelector('.calendar-grid').innerHTML}
            </div>
        </div>
        <div class="calendar-events">
            <h4>All Events</h4>
            <div class="event-list">
                ${mockEvents.map(event => `
                    <div class="event-item">
                        <i class="fas ${getEventIcon(event.type)}"></i>
                        <div class="event-info">
                            <div class="event-title">${event.title}</div>
                            <div class="event-time">${formatDate(event.date)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Availability Modal
function showAvailabilityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Set Your Availability</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form id="availabilityForm">
                <div class="form-group">
                    <label>Recurring Availability</label>
                    <div class="recurring-options">
                        <label>
                            <input type="checkbox" id="monday" name="days"> Monday
                        </label>
                        <label>
                            <input type="checkbox" id="tuesday" name="days"> Tuesday
                        </label>
                        <label>
                            <input type="checkbox" id="wednesday" name="days"> Wednesday
                        </label>
                        <label>
                            <input type="checkbox" id="thursday" name="days"> Thursday
                        </label>
                        <label>
                            <input type="checkbox" id="friday" name="days"> Friday
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="availabilityStart">Start Time</label>
                    <input type="time" id="availabilityStart" value="09:00" required>
                </div>
                <div class="form-group">
                    <label for="availabilityEnd">End Time</label>
                    <input type="time" id="availabilityEnd" value="17:00" required>
                </div>
                <div class="form-group">
                    <label>Date Range</label>
                    <div class="date-range">
                        <input type="date" id="rangeStart" required>
                        <span>to</span>
                        <input type="date" id="rangeEnd" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Set Availability</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Set default date range
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    document.getElementById('rangeStart').value = today.toISOString().split('T')[0];
    document.getElementById('rangeEnd').value = twoWeeksFromNow.toISOString().split('T')[0];

    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const form = modal.querySelector('#availabilityForm');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const availabilityData = {
            days: Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.id),
            startTime: document.getElementById('availabilityStart').value,
            endTime: document.getElementById('availabilityEnd').value,
            rangeStart: document.getElementById('rangeStart').value,
            rangeEnd: document.getElementById('rangeEnd').value
        };
        setAvailability(availabilityData);
        modal.remove();
    });
}

function setAvailability(data) {
    const calendar = document.getElementById('calendar')._calendar;
    const currentUser = 'John Doe'; // In a real app, this would be the logged-in user
    const userColor = '#4CAF50'; // Each user should have their own color

    const start = new Date(data.rangeStart);
    const end = new Date(data.rangeEnd);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayName = days[date.getDay()];
        if (data.days.includes(dayName)) {
            const eventStart = new Date(date);
            const eventEnd = new Date(date);
            
            const [startHours, startMinutes] = data.startTime.split(':');
            const [endHours, endMinutes] = data.endTime.split(':');
            
            eventStart.setHours(parseInt(startHours), parseInt(startMinutes), 0);
            eventEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0);

            calendar.addEvent({
                title: 'Available',
                start: eventStart,
                end: eventEnd,
                color: userColor,
                extendedProps: {
                    type: 'availability',
                    user: currentUser
                }
            });
        }
    }

    showNotification('Availability set successfully!', 'success');
}

function showAvailabilityDetails(event) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Availability Details</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="availability-details">
                <p><strong>User:</strong> ${event.extendedProps.user}</p>
                <p><strong>Time:</strong> ${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}</p>
                <p><strong>Date:</strong> ${event.start.toLocaleDateString()}</p>
            </div>
            <div class="form-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    const editBtn = modal.querySelector('.edit-btn');
    const deleteBtn = modal.querySelector('.delete-btn');

    closeBtn.addEventListener('click', () => modal.remove());
    editBtn.addEventListener('click', () => {
        modal.remove();
        showAvailabilityModal();
    });
    deleteBtn.addEventListener('click', () => {
        event.remove();
        modal.remove();
        showNotification('Availability removed successfully!', 'success');
    });
}

// Link Management
function initializeLinkManagement() {
    const addLinkBtn = document.querySelector('.add-link-btn');
    const linkInputForm = document.querySelector('.link-input-form');
    const linkInput = document.getElementById('linkInput');
    const saveLinkBtn = document.querySelector('.save-link-btn');
    const cancelLinkBtn = document.querySelector('.cancel-link-btn');

    if (!addLinkBtn || !linkInputForm || !linkInput || !saveLinkBtn || !cancelLinkBtn) {
        console.error('Link management elements not found');
        return;
    }

    // Show form when Add Link button is clicked
    addLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        linkInputForm.classList.remove('hidden');
        linkInput.focus();
    });

    // Hide form when Cancel button is clicked
    cancelLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        linkInputForm.classList.add('hidden');
        linkInput.value = '';
    });

    // Handle saving the link
    saveLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = linkInput.value.trim();
        if (url) {
            // Create a new link item
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            linkItem.innerHTML = `
                <i class="fas fa-link"></i>
                <a href="${url}" target="_blank">${url}</a>
                <button class="delete-link-btn">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Add delete functionality
            const deleteBtn = linkItem.querySelector('.delete-link-btn');
            deleteBtn.addEventListener('click', () => {
                linkItem.remove();
            });

            // Add the link item to the header buttons
            const headerButtons = document.querySelector('.header-buttons');
            if (headerButtons) {
                headerButtons.appendChild(linkItem);
            }

            // Reset form
            linkInput.value = '';
            linkInputForm.classList.add('hidden');

            // Show success notification
            showNotification('Link added successfully!', 'success');
        }
    });

    // Handle Enter key in input
    linkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveLinkBtn.click();
        }
    });

    // Close form when clicking outside
    document.addEventListener('click', (e) => {
        if (!linkInputForm.contains(e.target) && !addLinkBtn.contains(e.target)) {
            linkInputForm.classList.add('hidden');
        }
    });
}

// Member Invitation
function initializeMemberInvitation() {
    const addMemberBtn = document.querySelector('.add-member-btn');
    if (!addMemberBtn) {
        console.error('Add member button not found');
        return;
    }

    addMemberBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showAddMemberModal();
    });
}

function showAddMemberModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Invite Members</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <form class="member-invite-form">
                <div class="form-group">
                    <label>Email Addresses</label>
                    <div class="email-list">
                        <input type="email" class="email-input" placeholder="Enter email address">
                    </div>
                </div>
                <div class="form-group">
                    <label for="memberRole">Role</label>
                    <select id="memberRole" class="role-select">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="inviteMessage">Message (Optional)</label>
                    <textarea id="inviteMessage" rows="3" placeholder="Add a personal message to your invitation"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Send Invitations</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const form = modal.querySelector('.member-invite-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const emailInput = modal.querySelector('.email-input');
    const emailList = modal.querySelector('.email-list');

    // Handle email input
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (email && isValidEmail(email)) {
                addEmailTag(email);
                emailInput.value = '';
            }
        }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailTags = modal.querySelectorAll('.email-tag');
        const emails = Array.from(emailTags).map(tag => tag.textContent.trim());
        const role = document.getElementById('memberRole').value;
        const message = document.getElementById('inviteMessage').value;

        console.log('Collected emails:', emails); // Debug log

        if (emails.length === 0) {
            showNotification('Please add at least one email address', 'error');
            return;
        }

        // Send invitations to the backend
        sendInvitations(emails, role, message);
        modal.remove();
    });

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
}

function addEmailTag(email) {
    const emailList = document.querySelector('.email-list');
    const emailInput = document.querySelector('.email-input');
    
    const tag = document.createElement('div');
    tag.className = 'email-tag';
    tag.innerHTML = `
        ${email}
        <span class="remove-email" title="Remove email">
            <i class="fas fa-times"></i>
        </span>
    `;

    // Insert before the input
    emailList.insertBefore(tag, emailInput);

    // Add remove functionality
    tag.querySelector('.remove-email').addEventListener('click', () => {
        tag.remove();
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function sendInvitations(emails, role, message) {
    // For now, just show a success message
    showNotification(`Invitations sent to ${emails.length} member${emails.length > 1 ? 's' : ''}!`, 'success');
}

// Resource Management
let resources = JSON.parse(localStorage.getItem('resources')) || [];

function addResource() {
    const title = document.getElementById('resourceTitle').value;
    const type = document.getElementById('resourceType').value;
    const description = document.getElementById('resourceDescription').value;
    const file = document.getElementById('resourceFile').files[0];
    const link = document.getElementById('resourceLink').value;

    const newResource = {
        id: Date.now(),
        title: title,
        type: type,
        description: description,
        createdAt: new Date().toISOString(),
        createdBy: 'John Doe', // In a real app, this would be the logged-in user
        file: file ? {
            name: file.name,
            size: file.size,
            type: file.type
        } : null,
        link: link || null
    };

    resources.push(newResource);
    localStorage.setItem('resources', JSON.stringify(resources));
    renderResources();
    showNotification('Resource added successfully!', 'success');
}

function renderResources() {
    console.log('Rendering resources:', resources);
    const resourcesList = document.querySelector('.resources-list');
    if (!resourcesList) {
        console.error('Resources list element not found');
        return;
    }

    if (resources.length === 0) {
        resourcesList.innerHTML = '<div class="no-resources">No resources added yet</div>';
        return;
    }

    resourcesList.innerHTML = resources.map(resource => `
        <div class="resource-item" data-id="${resource.id}">
            <div class="resource-icon ${resource.type}">
                <i class="fas ${getResourceIcon(resource.type)}"></i>
            </div>
            <div class="resource-info">
                <div class="resource-title">${resource.title}</div>
                <div class="resource-meta">
                    <span><i class="far fa-user"></i> ${resource.createdBy}</span>
                    <span><i class="far fa-clock"></i> ${formatDate(resource.createdAt)}</span>
                </div>
            </div>
            <div class="resource-actions">
                ${resource.file ? `
                    <button class="resource-action-btn download" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                ` : ''}
                ${resource.link ? `
                    <a href="${resource.link}" target="_blank" class="resource-action-btn" title="Open Link">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                ` : ''}
                <button class="resource-action-btn delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners for resource actions
    resourcesList.querySelectorAll('.resource-item').forEach(item => {
        const deleteBtn = item.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteResource(item.dataset.id));
        }

        const downloadBtn = item.querySelector('.download');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => downloadResource(item.dataset.id));
        }
    });
}

function getResourceIcon(type) {
    switch(type) {
        case 'document':
            return 'fa-file-alt';
        case 'link':
            return 'fa-link';
        case 'file':
            return 'fa-file';
        default:
            return 'fa-file';
    }
}

function deleteResource(id) {
    resources = resources.filter(resource => resource.id !== parseInt(id));
    localStorage.setItem('resources', JSON.stringify(resources));
    renderResources();
    showNotification('Resource deleted successfully!', 'success');
}

function downloadResource(id) {
    const resource = resources.find(r => r.id === parseInt(id));
    if (resource && resource.file) {
        // In a real app, this would trigger the actual file download
        showNotification('Downloading file...', 'info');
    }
}

// Initialize resources when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    renderResources();
});

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing components...');
    
    // Initialize components in the correct order
    initializeLinkManagement();
    initializeMemberInvitation();
    initializeCalendar();
    initializeChat();
    initializeTasks();
    initializeWorkLog();
    initializeVideoMeeting();

    // Initialize quick action buttons
    const newTaskBtn = document.querySelector('.action-btn.new-task');
    const startMeetingBtn = document.querySelector('.action-btn.start-meeting');
    const addResourceBtn = document.querySelector('.action-btn.add-resource');
    const addMemberBtn = document.querySelector('.add-member-btn');

    console.log('Add Member button found:', !!addMemberBtn);

    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', showNewTaskModal);
    }
    if (startMeetingBtn) {
        startMeetingBtn.addEventListener('click', showStartMeetingModal);
    }
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showAddResourceModal();
        });
    }
    if (addMemberBtn) {
        console.log('Adding click event listener to Add Member button');
        addMemberBtn.addEventListener('click', (e) => {
            console.log('Add Member button clicked');
            e.preventDefault();
            e.stopPropagation();
            showAddMemberModal();
        });
    }

    // Initialize resources
    renderResources();
}); 