async function saveTasks() {
    let tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        let textParts = li.innerText.split(" - ");
        let taskDetails = textParts[1].split(" ");
        let eventType = li.dataset.eventType;
        
        // Store the original input text (remove the formatting)
        let originalText = textParts[0];
        if (eventType === "birthday") {
            originalText = originalText.replace("'s Birthday", "");
        } else if (eventType === "meeting") {
            originalText = originalText.replace("Meeting with ", "");
        } else if (eventType === "call") {
            originalText = originalText.replace("Call with ", "");
        }

        tasks.push({
            text: originalText,
            formattedText: textParts[0].replace("❌", "").trim(),
            date: taskDetails[0],
            time: taskDetails[1].replace(/[()]/g, ""),
            eventType: eventType,
            completed: li.classList.contains("completed")
        });
    });
    
    try {
        // Send each task to the backend
        for (const task of tasks) {
            await fetch('http://localhost:3000/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task)
            });
        }
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
    updateCalendarMarks();
}

async function loadTasks() {
    try {
        const response = await fetch('http://localhost:3000/api/tasks');
        const tasks = await response.json();
        
        let taskList = document.getElementById("taskList");
        taskList.innerHTML = ''; // Clear existing tasks
        
        tasks.forEach(task => {
            let li = document.createElement("li");
            li.innerHTML = `${task.formatted_text} - ${task.date} ${task.time} (${task.event_type}) <button onclick="removeTask(this, '${task.date}', ${task.id})">❌</button>`;
            li.dataset.eventType = task.event_type;
            li.dataset.taskId = task.id;
            if (task.completed) li.classList.add("completed");
            li.addEventListener("click", () => toggleTaskComplete(li));
            taskList.appendChild(li);
            markCalendar(task.date, task.event_type);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function toggleTaskComplete(li) {
    const taskId = li.dataset.taskId;
    const completed = !li.classList.contains("completed");
    
    try {
        await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed })
        });
        
        li.classList.toggle("completed");
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function removeTask(button, taskDate, taskId) {
    try {
        await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        let li = button.parentElement;
        li.remove();
        updateCalendarMarks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function addTask() {
    let taskInput = document.getElementById("taskInput");
    let taskDate = document.getElementById("taskDate").value;
    let taskTime = document.getElementById("taskTime").value;
    let eventType = document.getElementById("eventType").value;
    let taskText = taskInput.value.trim();

    if (taskText === "" || taskDate === "" || taskTime === "") {
        alert("Please enter all required information!");
        return;
    }

    // Format the task text based on event type
    let formattedText;
    switch(eventType) {
        case "birthday":
            formattedText = `${taskText}'s Birthday`;
            break;
        case "meeting":
            formattedText = `Meeting with ${taskText}`;
            break;
        case "call":
            formattedText = `Call with ${taskText}`;
            break;
        default:
            formattedText = taskText;
    }

    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: taskText,
                formattedText: formattedText,
                date: taskDate,
                time: taskTime,
                eventType: eventType,
                completed: false
            })
        });

        if (response.ok) {
            const result = await response.json();
            let taskList = document.getElementById("taskList");
            let li = document.createElement("li");
            li.innerHTML = `${formattedText} - ${taskDate} ${taskTime} (${eventType}) <button onclick="removeTask(this, '${taskDate}', ${result.id})">❌</button>`;
            li.dataset.eventType = eventType;
            li.dataset.taskId = result.id;
            li.addEventListener("click", () => toggleTaskComplete(li));
            taskList.appendChild(li);
            markCalendar(taskDate, eventType);
            taskInput.value = "";
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
    }
}

function updateCalendarMarks() {
    // Clear all event dots
    document.querySelectorAll(".event-dots").forEach(container => {
        container.remove();
    });

    // Re-fetch and mark all tasks
    loadTasks();
}

document.addEventListener("DOMContentLoaded", function() {
    loadTasks();
    generateCalendar();
    
    // Add event listener for event type changes
    document.getElementById("eventType").addEventListener("change", updateTaskPlaceholder);
    // Set initial placeholder based on default selection
    updateTaskPlaceholder();
});

function updateTaskPlaceholder() {
    const eventType = document.getElementById("eventType").value;
    const taskInput = document.getElementById("taskInput");
    
    switch(eventType) {
        case "birthday":
            taskInput.placeholder = "Enter person's name";
            break;
        case "meeting":
            taskInput.placeholder = "Meeting with whom?";
            break;
        case "call":
            taskInput.placeholder = "Call with whom?";
            break;
        default:
            taskInput.placeholder = "Enter a task";
    }
}

function generateCalendar() {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = ""; 

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekDays.forEach(day => {
        let dayHeader = document.createElement("div");
        dayHeader.classList.add("calendar-day");
        dayHeader.style.fontWeight = "bold";
        dayHeader.innerText = day;
        calendar.appendChild(dayHeader);
    });

    for (let i = 0; i < firstDay; i++) {
        let emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day");
        emptyCell.innerText = "";
        calendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        let dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");
        dayCell.innerText = day;
        dayCell.dataset.date = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        calendar.appendChild(dayCell);
    }

    updateCalendarMarks();
}

function markCalendar(taskDate, eventType) {
    document.querySelectorAll(".calendar-day").forEach(dayCell => {
        if (dayCell.dataset.date === taskDate) {
            // Get or create event dots container
            let dotsContainer = dayCell.querySelector(".event-dots");
            if (!dotsContainer) {
                dotsContainer = document.createElement("div");
                dotsContainer.className = "event-dots";
                dayCell.appendChild(dotsContainer);
            }

            // Check if this event type dot already exists
            if (!dotsContainer.querySelector(`.event-dot.${eventType}`)) {
                const dot = document.createElement("div");
                dot.className = `event-dot ${eventType}`;
                dotsContainer.appendChild(dot);
            }
        }
    });
} 