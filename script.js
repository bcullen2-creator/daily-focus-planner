const STORAGE_KEY = "daily-focus-planner-tasks";

const elements = {
  form: document.querySelector("#task-form"),
  titleInput: document.querySelector("#task-title"),
  categorySelect: document.querySelector("#task-category"),
  workList: document.querySelector("#work-list"),
  personalList: document.querySelector("#personal-list"),
  completedList: document.querySelector("#completed-list"),
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

  if (!title) {
    elements.titleInput.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    category,
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

  const activeWorkTasks = tasks.filter((task) => !task.completed && task.category === "work");
  const activePersonalTasks = tasks.filter((task) => !task.completed && task.category === "personal");
  const completedTasks = tasks.filter((task) => task.completed);

  activeWorkTasks.forEach((task) => {
    elements.workList.append(createTaskElement(task));
  });

  activePersonalTasks.forEach((task) => {
    elements.personalList.append(createTaskElement(task));
  });

  completedTasks.forEach((task) => {
    elements.completedList.append(createTaskElement(task));
  });

  elements.workCount.textContent = formatCount(activeWorkTasks.length, "task");
  elements.personalCount.textContent = formatCount(activePersonalTasks.length, "task");
  elements.completedCount.textContent = formatCount(completedTasks.length, "done");
}

function createTaskElement(task) {
  const fragment = elements.template.content.cloneNode(true);
  const item = fragment.querySelector(".task-item");
  const title = fragment.querySelector(".task-title");
  const badge = fragment.querySelector(".task-badge");
  const toggleButton = fragment.querySelector('[data-action="toggle"]');

  item.dataset.taskId = task.id;
  item.dataset.category = task.category;
  item.dataset.completed = String(task.completed);

  title.textContent = task.title;
  badge.textContent = capitalize(task.category);
  toggleButton.textContent = task.completed ? "Restore" : "Complete";

  return fragment;
}

function clearLists() {
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
        completed: false,
        createdAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        title: "Plan one personal errand for the weekend",
        category: "personal",
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
