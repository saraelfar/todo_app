import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());  // State for storing selected date-time
  const [currentTime, setCurrentTime] = useState(""); // State for the current time

  const tasksCollection = collection(db, "tasks");

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchTasks(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString()); // Update the current time
    }, 1000);
    return () => clearInterval(interval); // Clear interval on unmount
  }, []);

  // Fetch tasks for the logged-in user, sorted by due date
  const fetchTasks = async (userId) => {
    const q = query(tasksCollection, where("userId", "==", userId), orderBy("dueDate"));
    const data = await getDocs(q);
    setTasks(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  // Handle login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error("Login failed: " + error.message);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    setTasks([]);
    toast.info("Logged out successfully!");
  };

  // Add a new task
  const addTask = async () => {
    if (taskInput.trim() === "") {
      toast.error("Task cannot be empty!");
      return;
    }

    // Get the selected date and time (convert to Firestore timestamp)
    const dueDate = selectedDate;

    await addDoc(tasksCollection, {
      text: taskInput,
      isCompleted: false,
      userId: user.uid,
      dueDate: dueDate,  // Store the due date as a timestamp
    });

    setTaskInput("");
    setSelectedDate(new Date());  // Reset selected date after adding
    toast.success("Task added successfully!");
    fetchTasks(user.uid);
  };

  // Save task after editing
  const saveTask = async () => {
    if (!currentTaskId) return;
    const taskDoc = doc(db, "tasks", currentTaskId);
    await updateDoc(taskDoc, { text: taskInput });
    setTaskInput("");
    setIsEditing(false);
    setCurrentTaskId(null);
    toast.success("Task updated successfully!");
    fetchTasks(user.uid); // Fetch tasks after update
  };

  // Toggle task completion status
  const completeTask = async (task) => {
    const taskDoc = doc(db, "tasks", task.id);
    await updateDoc(taskDoc, { isCompleted: !task.isCompleted });
    toast.success("Task completed!");
    fetchTasks(user.uid); // Fetch tasks after status update
  };

  // Set task for editing
  const editTask = (task) => {
    setTaskInput(task.text);
    setIsEditing(true);
    setCurrentTaskId(task.id);
    setSelectedDate(task.dueDate.toDate());  // Set the selected date-time for editing
  };

  // Delete a task
  const deleteTask = async (id) => {
    const taskDoc = doc(db, "tasks", id);
    await deleteDoc(taskDoc);
    toast.info("Task deleted.");
    fetchTasks(user.uid); // Fetch tasks after delete
  };

  return (
    <div className="App">
      <header>
        <h1>🎀 To-Do List 🎀</h1>
        {user ? (
          <div>
            <p>Welcome, {user.displayName ? user.displayName : user.email}!</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        )}
      </header>
      <main>
        {user ? (
          <>
            <div className="task-input">
              <input
                className="city-search"
                type="text"
                placeholder="What do you need to do?"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
              <div className="date-picker-container">
                <label htmlFor="task-date">Choose due date and time:</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  id="task-date"
                />
              </div>
              {isEditing ? (
                <button onClick={saveTask}>💾 Save</button>
              ) : (
                <button onClick={addTask}>➕ Add</button>
              )}
            </div>
            <div className="task-list">
              {tasks.length === 0 ? (
                <p>No tasks added yet. Start planning! 📝</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-item ${task.isCompleted ? "completed" : ""}`}
                  >
                    <span>{task.text}</span>
                    <span className="task-time">
                      Due: {task.dueDate.toDate().toLocaleString()}
                    </span>
                    <div className="task-actions">
                      <button onClick={() => completeTask(task)}>
                        <FaCheck />
                      </button>
                      <button onClick={() => editTask(task)}>
                        <FaEdit />
                      </button>
                      <button onClick={() => deleteTask(task.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="current-time">
              <p>Current time: {currentTime}</p> {/* Display current time */}
            </div>
          </>
        ) : (
          <p>Please log in to manage your tasks.</p>
        )}
      </main>
      <ToastContainer />
    </div>
  );
};

export default App;
