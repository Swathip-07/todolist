const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize DB: create table if it doesn't exist
const initDB = () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            text VARCHAR(255) NOT NULL,
            formatted_text VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    pool.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating tasks table:', err);
        } else {
            console.log('✅ Tasks table is ready');
        }
    });
};

initDB();

// Test Route
app.get('/', (req, res) => {
    res.send('Server is running! Try /check-data to see database contents.');
});

// Route: Check database contents
app.get('/check-data', (req, res) => {
    console.log('Accessing /check-data route');

    pool.query('SHOW TABLES', (err, tables) => {
        if (err) {
            console.error('Error showing tables:', err);
            return res.send(`Error checking tables: ${err.message}`);
        }

        let output = '<h2>Database Tables:</h2><pre>' + JSON.stringify(tables, null, 2) + '</pre>';

        pool.query('SELECT * FROM tasks', (err, tasks) => {
            if (err) {
                console.error('Error querying tasks:', err);
                output += `<br>Error reading tasks: ${err.message}`;
                return res.send(output);
            }

            output += '<h2>Tasks in Database:</h2>';
            if (tasks.length === 0) {
                output += '<p>No tasks found in database.</p>';
            } else {
                output += '<table border="1" style="border-collapse: collapse; width: 100%;">';
                output += '<tr><th>ID</th><th>Text</th><th>Formatted Text</th><th>Date</th><th>Time</th><th>Event Type</th><th>Completed</th></tr>';
                tasks.forEach(task => {
                    output += `<tr>
                        <td>${task.id}</td>
                        <td>${task.text}</td>
                        <td>${task.formatted_text}</td>
                        <td>${task.date}</td>
                        <td>${task.time}</td>
                        <td>${task.event_type}</td>
                        <td>${task.completed ? 'Yes' : 'No'}</td>
                    </tr>`;
                });
                output += '</table>';
            }

            output += '<h2>Database Connection Info:</h2>';
            output += `<pre>
Database: ${process.env.DB_NAME}
Host: ${process.env.DB_HOST}
User: ${process.env.DB_USER}
</pre>`;

            res.send(output);
        });
    });
});

// API Endpoints
app.get('/api/tasks', (req, res) => {
    console.log('GET /api/tasks - Fetching all tasks');
    pool.query('SELECT * FROM tasks ORDER BY date, time', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.post('/api/tasks', (req, res) => {
    console.log('POST /api/tasks - Adding new task:', req.body);
    const { text, formattedText, date, time, eventType, completed } = req.body;

    if (!text || !formattedText || !date || !time || !eventType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO tasks (text, formatted_text, date, time, event_type, completed)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    pool.query(query, [text, formattedText, date, time, eventType, completed || false], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    console.log('PUT /api/tasks/:id - Updating task:', req.params.id);
    const { completed } = req.body;

    pool.query('UPDATE tasks SET completed = ? WHERE id = ?', [completed, req.params.id], (err) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Task updated successfully' });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    console.log('DELETE /api/tasks/:id - Deleting task:', req.params.id);

    pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});

app.get('/api/tasks/debug', (req, res) => {
    pool.query('SELECT * FROM tasks ORDER BY date, time', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            let html = '<h1>Stored Tasks</h1>';
            html += '<table border="1"><tr><th>ID</th><th>Text</th><th>Formatted Text</th><th>Date</th><th>Time</th><th>Event Type</th><th>Completed</th><th>Created At</th></tr>';

            results.forEach(task => {
                html += `<tr>
                    <td>${task.id}</td>
                    <td>${task.text}</td>
                    <td>${task.formatted_text}</td>
                    <td>${task.date}</td>
                    <td>${task.time}</td>
                    <td>${task.event_type}</td>
                    <td>${task.completed ? 'Yes' : 'No'}</td>
                    <td>${task.created_at}</td>
                </tr>`;
            });

            html += '</table>';
            res.send(html);
        } else {
            res.json(results);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
