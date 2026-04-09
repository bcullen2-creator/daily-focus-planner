const STORAGE_KEY = "daily-focus-planner-tasks";

const elements = {
  form: document.querySelector("#task-form"),
  titleInput: document.querySelector("#task-title"),
  categorySelect: document.querySelector("#task-category"),
  prioritySelect: document.querySelector("#task-priority"),
  dueDateInput: document.querySelector("#task-due-date"),
  focusList: document.querySelector("#focus-list"),
  workList: document.querySelector("#work-list"),
  personalList: document.querySelector("#personal-list"),
  completedList: document.querySelector("#completed-list"),
  focusCount: document.querySelector("#focus-count"),
  workCount: document.querySelector("#work-count"),
  personalCount: document.querySelector("#personal-count"),
  completedCount: document.querySelector("#completed-count"),
  template: document.querySelector("#task-template")
};

let tasks = loadTasks();

elements.form.addEventListener("submit", handleAddTask);
document.addEventListener("click", handleTaskAction);

renderTasks();

function handleAddTask(event) {
  event.preventDefault();

  const title = elements.titleInput.value.trim();
  const category = elements.categorySelect.value;
  const priority = elements.prioritySelect.value;
  const dueDate = elements.dueDateInput.value;

  if (!title) {
    elements.titleInput.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    category,
    priority,
    dueDate,
    completed: false,
    createdAt: Date.now()
  });

  persistTasks();
  renderTasks();
  elements.form.reset();
  elements.titleInput.focus();
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const taskElement = button.closest("[data-task-id]");
  if (!taskElement) {
    return;
  }

  const taskId = taskElement.dataset.taskId;
  const action = button.dataset.action;

  if (action === "toggle") {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
  }

  if (action === "delete") {
    tasks = tasks.filter((task) => task.id !== taskId);
  }

  persistTasks();
  renderTasks();
}

function renderTasks() {
  clearLists();

  const activeTasks = tasks.filter((task) => !task.completed).sort(compareTasks);
  const activeWorkTasks = activeTasks.filter((task) => task.category === "work");
  const activePersonalTasks = activeTasks.filter((task) => task.category === "personal");
  const focusTasks = activeTasks.slice(0, 3);
  const completedTasks = tasks
    .filter((task) => task.completed)
    .sort((firstTask, secondTask) => secondTask.createdAt - firstTask.createdAt);

  focusTasks.forEach((task) => {
    elements.focusList.append(createTaskElement(task));
  });

  activeWorkTasks.forEach((task) => {
    elements.workList.append(createTaskElement(task));
  });

  activePersonalTasks.forEach((task) => {
    elements.personalList.append(createTaskElement(task));
  });

  completedTasks.forEach((task) => {
    elements.completedList.append(createTaskElement(task));
  });

  elements.focusCount.textContent = `${focusTasks.length} selected`;
  elements.workCount.textContent = formatCount(activeWorkTasks.length, "task");
  elements.personalCount.textContent = formatCount(activePersonalTasks.length, "task");
  elements.completedCount.textContent = formatCount(completedTasks.length, "done");
}

function createTaskElement(task) {
  const fragment = elements.template.content.cloneNode(true);
  const item = fragment.querySelector(".task-item");
  const title = fragment.querySelector(".task-title");
  const badge = fragment.querySelector(".task-badge");
  const priorityBadge = fragment.querySelector(".priority-badge");
  const dueDate = fragment.querySelector(".due-date");
  const toggleButton = fragment.querySelector('[data-action="toggle"]');

  item.dataset.taskId = task.id;
  item.dataset.category = task.category;
  item.dataset.priority = task.priority;
  item.dataset.completed = String(task.completed);

  title.textContent = task.title;
  badge.textContent = capitalize(task.category);
  priorityBadge.textContent = `${capitalize(task.priority)} priority`;
  dueDate.textContent = task.dueDate ? formatDate(task.dueDate) : "No due date";
  toggleButton.textContent = task.completed ? "Restore" : "Complete";

  return fragment;
}

function clearLists() {
  elements.focusList.innerHTML = "";
  elements.workList.innerHTML = "";
  elements.personalList.innerHTML = "";
  elements.completedList.innerHTML = "";
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Check tomorrow's work priorities",
        category: "work",
        priority: "high",
        dueDate: getRelativeDate(1),
        completed: false,
        createdAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        title: "Plan one personal errand for the weekend",
        category: "personal",
        priority: "medium",
        dueDate: getRelativeDate(3),
        completed: false,
        createdAt: Date.now()
      }
    ];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch (error) {
    console.error("Unable to parse saved tasks.", error);
    return [];
  }
}

function formatCount(count, label) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function compareTasks(firstTask, secondTask) {
  const priorityDifference = getPriorityRank(firstTask.priority) - getPriorityRank(secondTask.priority);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const firstDueTime = firstTask.dueDate ? new Date(firstTask.dueDate).getTime() : Number.POSITIVE_INFINITY;
  const secondDueTime = secondTask.dueDate ? new Date(secondTask.dueDate).getTime() : Number.POSITIVE_INFINITY;
  if (firstDueTime !== secondDueTime) {
    return firstDueTime - secondDueTime;
  }

  return secondTask.createdAt - firstTask.createdAt;
}

function getPriorityRank(priority) {
  const priorityRanks = {
    high: 0,
    medium: 1,
    low: 2
  };

  return priorityRanks[priority] ?? 3;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function getRelativeDate(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0];
}
