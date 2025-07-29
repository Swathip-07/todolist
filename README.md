#  Todo Calendar App

A full-stack **Todo Calendar** web application that allows users to create, view, and manage scheduled tasks or events with specific date and time. 
Tasks are stored in a MySQL database, and both backend and frontend work seamlessly together.

---

##  Live Demo

👉 [Frontend Deployed on Vercel](https://todolist-amber-alpha.vercel.app/)

---

##  Project Structure

```
todolist/
├── project/
│   ├── backend/        # Node.js + Express backend with MySQL
│   │   └── server.js
│   │   └── db.js
│   │   └── package.json
│   ├── frontend/       # HTML, CSS, JavaScript frontend
│   │   └── index.html
│   │   └── style.css
│   │   └── script.js
```

---

##  Tools & Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Database Connector**: mysql2 (NPM package)
- **CORS Middleware**: cors (NPM package)
- **Environment Configuration**: dotenv
- **Dev Tool**: nodemon
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Localhost 

---

## 🚀 Features

- Add new tasks/events with date, time, and type
- View tasks in calendar-like interface
- Tasks stored persistently in MySQL database
- RESTful API for task CRUD operations
- Lightweight frontend with real-time updates

---

##  Local Setup Instructions

###  Prerequisites

- Node.js & npm installed
- MySQL installed and running

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Swathip-07/todolist.git
cd todolist/project
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

- Configure MySQL credentials in `db.js` if needed (e.g., user/password)
- Ensure a MySQL database named `todo_calendar` exists (it will be auto-created if not)
- Start the server:

```bash
npm start
```

> Server runs at: `http://localhost:3000`

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
```

#### Option 1: Open `index.html` in a browser manually  

---

##  API Endpoints

| Method | Endpoint                      | Description                 |
|--------|-------------------------------|-----------------------------|
| GET    | `/api/tasks`                  | Get all tasks               |
| POST   | `/api/tasks`                  | Add new task                |
| GET    | `/check-data`                 | View raw DB contents (HTML) |
      |

---


##  Author & Credits

Made by Swathi P  
Contact: swathip200467@gmail.com

---



