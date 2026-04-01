const BASE_URL = "https://neural-quad-backend.onrender.com";

const input = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");

const totalEl = document.getElementById("total-tasks");
const completedEl = document.getElementById("completed-tasks");
const pendingEl = document.getElementById("pending-tasks");
const progressFill = document.getElementById("progress-fill");
const taskCountEl = document.getElementById("task-count");

let tasks = [];
let history = [];

/* =========================
   FETCH TASKS
========================= */
async function fetchTasks() {
  try {
    const res = await fetch(`${BASE_URL}/tasks`);
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

/* =========================
   UPDATE COUNT
========================= */
function updateCount() {
  const count = tasks.length;

  if (count === 0) {
    taskCountEl.textContent = "No tasks today 🎉";
  } else {
    taskCountEl.textContent =
      `You've got ${count} ${count === 1 ? "task" : "tasks"} today`;
  }
}

/* =========================
   RENDER TASKS
========================= */
function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `<div class="empty">No tasks yet 🚀</div>`;
  }

  tasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task" + (task.completed ? " completed" : "");

    div.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? "checked" : ""}>
        <span>${task.text}</span>
      </div>
      <button class="delete-btn">✕</button>
    `;

    // TOGGLE
    div.querySelector("input").onclick = async () => {
      await fetch(`${BASE_URL}/tasks/${task.id}`, {
        method: "PUT"
      });
      fetchTasks();
    };

    // DELETE
    div.querySelector(".delete-btn").onclick = async () => {
      div.style.transform = "scale(0.8)";
      div.style.opacity = "0";

      setTimeout(async () => {
        await fetch(`${BASE_URL}/tasks/${task.id}`, {
          method: "DELETE"
        });
        fetchTasks();
      }, 200);
    };

    taskList.appendChild(div);
  });

  updateAnalytics();
}

/* =========================
   ANALYTICS
========================= */
function updateAnalytics() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const pending = total - done;

  totalEl.textContent = total;
  completedEl.textContent = done;
  pendingEl.textContent = pending;

  const percent = total === 0 ? 0 : (done / total) * 100;
  progressFill.style.width = percent + "%";

  updateCount();
  updateChart(done);
}

/* =========================
   CHART
========================= */
function updateChart(doneToday) {
  const canvas = document.getElementById("chartCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  canvas.width = 300;
  canvas.height = 80;

  ctx.clearRect(0, 0, 300, 80);

  history.push(doneToday);
  if (history.length > 7) history.shift();

  ctx.beginPath();
  ctx.strokeStyle = "#9c52ff";
  ctx.lineWidth = 2;

  history.forEach((val, i) => {
    let x = i * 40;
    let y = 80 - val * 10;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

/* =========================
   ADD TASK (FIXED)
========================= */
addBtn.onclick = async () => {
  const text = input.value.trim();

  if (!text) {
    alert("Enter a task first");
    return;
  }

  try {
    console.log("Sending task:", text);

    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    console.log("Response:", data);

    input.value = "";
    fetchTasks();

  } catch (err) {
    console.error("Error:", err);
    alert("Backend error");
  }
};

/* =========================
   ENTER KEY
========================= */
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addBtn.click();
});

/* =========================
   INIT
========================= */
fetchTasks();