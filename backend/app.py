from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB = "database.db"


# =========================
# DATABASE INIT
# =========================
def init_db():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0
    )
    """)

    conn.commit()
    conn.close()


init_db()


# =========================
# GET TASKS
# =========================
@app.route("/tasks", methods=["GET"])
def get_tasks():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks")
    rows = cursor.fetchall()

    tasks = []
    for row in rows:
        tasks.append({
            "id": row[0],
            "text": row[1],
            "completed": bool(row[2])
        })

    conn.close()
    return jsonify(tasks)


# =========================
# ADD TASK
# =========================
@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.get_json()
    text = data.get("text")

    if not text:
        return jsonify({"error": "Task text is required"}), 400

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("INSERT INTO tasks (text) VALUES (?)", (text,))
    conn.commit()

    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "id": new_id,
        "text": text,
        "completed": False
    })


# =========================
# TOGGLE TASK
# =========================
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("SELECT completed FROM tasks WHERE id=?", (task_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    new_value = 0 if row[0] else 1

    cursor.execute(
        "UPDATE tasks SET completed=? WHERE id=?",
        (new_value, task_id)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "id": task_id,
        "completed": bool(new_value)
    })


# =========================
# DELETE TASK
# =========================
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True})


# =========================
# ROOT ROUTE (OPTIONAL TEST)
# =========================
@app.route("/")
def home():
    return "Neural Quad Backend Running 🚀"


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    