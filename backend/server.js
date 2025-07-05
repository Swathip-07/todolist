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

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Connect to MySQL and set up database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database created or already exists');
        
        // Switch to the created database
        connection.query(`USE ${process.env.DB_NAME}`, (err) => {
            if (err) {
                console.error('Error switching to database:', err);
                return;
            }
            console.log('Using database:', process.env.DB_NAME);
            
            // Create tasks table if it doesn't exist
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
            
            connection.query(createTableQuery, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    return;
                }
                console.log('Tasks table ready');
                
                // Check if table is empty
                connection.query('SELECT COUNT(*) as count FROM tasks', (err, result) => {
                    if (err) {
                        console.error('Error counting tasks:', err);
                        return;
                    }
                    console.log(`Current number of tasks in database: ${result[0].count}`);
                });
            });
        });
    });
});

// Simple test route
app.get('/', (req, res) => {
    res.send('Server is running! Try /check-data to see database contents.');
});

// Route to check database contents
app.get('/check-data', (req, res) => {
    console.log('Accessing /check-data route');
    
    // First, check if we can query the database
    connection.query('SHOW TABLES', (err, tables) => {
        if (err) {
            console.error('Error showing tables:', err);
            return res.send(`Error checking tables: ${err.message}`);
        }
        
        console.log('Tables in database:', tables);
        
        let output = '<h2>Database Tables:</h2>';
        output += '<pre>' + JSON.stringify(tables, null, 2) + '</pre>';
        
        // Now check tasks table
        connection.query('SELECT * FROM tasks', (err, tasks) => {
            if (err) {
                console.error('Error querying tasks:', err);
                output += `<br>Error reading tasks: ${err.message}`;
                return res.send(output);
            }
            
            console.log('Tasks found:', tasks.length);
            
            output += '<h2>Tasks in Database:</h2>';
            if (tasks.length === 0) {
                output += '<p>No tasks found in database.</p>';
            } else {
                output += '<table border="1" style="border-collapse: collapse; width: 100%;">';
                output += '<tr><th>ID</th><th>Text</th><th>Formatted Text</th><th>Date</th><th>Time</th><th>Event Type</th><th>Completed</th></tr>';
                tasks.forEach(task => {
                    output += `<tr>
                        <td>${task.id}</td>
                        <td>${task.text || ''}</td>
                        <td>${task.formatted_text || ''}</td>
                        <td>${task.date}</td>
                        <td>${task.time}</td>
                        <td>${task.event_type}</td>
                        <td>${task.completed ? 'Yes' : 'No'}</td>
                    </tr>`;
                });
                output += '</table>';
            }
            
            // Add debug information
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

// Routes
app.get('/api/tasks', (req, res) => {
    console.log('GET /api/tasks - Fetching all tasks');
    connection.query('SELECT * FROM tasks ORDER BY date, time', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Found ${results.length} tasks`);
        res.json(results);
    });
});

app.post('/api/tasks', (req, res) => {
    console.log('POST /api/tasks - Adding new task:', req.body);
    const { text, formattedText, date, time, eventType, completed } = req.body;
    
    // Validate required fields
    if (!text || !formattedText || !date || !time || !eventType) {
        console.error('Missing required fields:', { text, formattedText, date, time, eventType });
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'INSERT INTO tasks (text, formatted_text, date, time, event_type, completed) VALUES (?, ?, ?, ?, ?, ?)';
    
    connection.query(query, [text, formattedText, date, time, eventType, completed || false], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Task added successfully, ID:', result.insertId);
        res.status(201).json({ id: result.insertId });
    });
});

app.put('/api/tasks/:id', (req, res) => {
    console.log('PUT /api/tasks/:id - Updating task:', req.params.id);
    const { completed } = req.body;
    const query = 'UPDATE tasks SET completed = ? WHERE id = ?';
    
    connection.query(query, [completed, req.params.id], (err) => {
        if (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Task updated successfully');
        res.status(200).json({ message: 'Task updated successfully' });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    console.log('DELETE /api/tasks/:id - Deleting task:', req.params.id);
    connection.query('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error('Error deleting task:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Task deleted successfully');
        res.status(200).json({ message: 'Task deleted successfully' });
    });
});

// Debug route to view all tasks
app.get('/api/tasks/debug', (req, res) => {
    console.log('GET /api/tasks/debug - Fetching all tasks with details');
    connection.query('SELECT * FROM tasks ORDER BY date, time', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        const formattedResults = results.map(task => ({
            id: task.id,
            text: task.text,
            formatted_text: task.formatted_text,
            date: task.date,
            time: task.time,
            event_type: task.event_type,
            completed: task.completed ? 'Yes' : 'No',
            created_at: task.created_at
        }));
        
        // Send both JSON and HTML format
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            let html = '<h1>Stored Tasks</h1>';
            html += '<table border="1"><tr><th>ID</th><th>Text</th><th>Formatted Text</th><th>Date</th><th>Time</th><th>Event Type</th><th>Completed</th><th>Created At</th></tr>';
            
            formattedResults.forEach(task => {
                html += `<tr>
                    <td>${task.id}</td>
                    <td>${task.text}</td>
                    <td>${task.formatted_text}</td>
                    <td>${task.date}</td>
                    <td>${task.time}</td>
                    <td>${task.event_type}</td>
                    <td>${task.completed}</td>
                    <td>${task.created_at}</td>
                </tr>`;
            });
            
            html += '</table>';
            res.send(html);
        } else {
            res.json(formattedResults);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Try these URLs in your browser:');
    console.log(`1. http://localhost:${PORT}/check-data - View all database contents`);
    console.log(`2. http://localhost:${PORT}/api/tasks/debug - View tasks in detail`);
    console.log(`3. http://localhost:${PORT}/api/tasks - Get tasks as JSON`);
}); 