const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;

// Fallback values for missing environment variables
process.env.LIVECHAT_API_URL = process.env.LIVECHAT_API_URL || 'http://103.161.119.68:3000';
process.env.CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';
process.env.LIVECHAT_API_KEY = process.env.LIVECHAT_API_KEY || 'your_api_key_here';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.client = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'pricing.html'));
});

// Pricing API
app.get("/api/pricing/plans", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM pricing_plans WHERE is_active = true ORDER BY price ASC");
        res.json({ plans: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'register.html'));
});


// Upgrade plan API
app.put("/api/auth/upgrade-plan", authenticateToken, async (req, res) => {
    try {
        const { plan_type } = req.body;

        if (!plan_type) {
            return res.status(400).json({ error: "Plan type is required" });
        }

        // Get plan details
        const planResult = await pool.query("SELECT * FROM pricing_plans WHERE name = $1", [plan_type]);
        if (planResult.rows.length === 0) {
            return res.status(400).json({ error: "Invalid plan type" });
        }

        const plan = planResult.rows[0];

        // Update client plan
        const result = await pool.query(
            "UPDATE clients SET plan_type = $1, widget_limit = $2 WHERE id = $3 RETURNING *",
            [plan_type, plan.widget_limit, req.client.clientId]
        );

        res.json({
            message: "Plan upgraded successfully",
            client: result.rows[0],
            plan: plan
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'dashboard.html'));
});

app.get('/widgets', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'widgets.html'));
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'demo.html'));
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, company_name } = req.body;

        if (!name || !email || !password || !company_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM clients WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.query(
            'INSERT INTO clients (name, email, password_hash, company_name, plan_type, widget_limit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, company_name, plan_type, widget_limit',
            [name, email, password_hash, company_name, 'free', 1]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { clientId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            client: user
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query('SELECT * FROM clients WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { clientId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            client: {
                id: user.id,
                name: user.name,
                email: user.email,
                company_name: user.company_name,
                plan_type: user.plan_type,
                widget_limit: user.widget_limit
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, company_name, plan_type, widget_limit FROM clients WHERE id = $1', [req.client.clientId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ client: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Widget routes - Sử dụng Chatwoot Application API
app.get('/api/widgets', authenticateToken, async (req, res) => {
    try {
        let chatwootResponse;
        try {
            chatwootResponse = await axios.get(`${process.env.LIVECHAT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes`, {
                headers: {
                    'api_access_token': process.env.LIVECHAT_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
        } catch (chatwootError) {
            // Return local widgets only if Chatwoot API fails
            const localWidgets = await pool.query('SELECT * FROM widgets WHERE client_id = $1', [req.client.clientId]);
            return res.json({
                livechat_widgets: [],
                widgets: localWidgets.rows,
                livechat_error: `Chatwoot API không khả dụng: ${chatwootError.message}`
            });
        }

        // Lấy local widgets để sync
        const localWidgets = await pool.query('SELECT * FROM widgets WHERE client_id = $1', [req.client.clientId]);

        res.json({
            livechat_widgets: chatwootResponse.data,
            widgets: localWidgets.rows,
            livechat_error: null
        });
    } catch (error) {
        res.status(500).json({
            error: 'LiveChat API is not available',
            livechat_error: error.message,
            widgets: []
        });
    }
});

app.post('/api/widgets', authenticateToken, async (req, res) => {
    try {
        const { widget_name, website_url, welcome_message } = req.body;

        if (!widget_name || !website_url) {
            return res.status(400).json({ error: 'Widget name and website URL are required' });
        }

        // Check widget limit
        const clientResult = await pool.query('SELECT widget_limit FROM clients WHERE id = $1', [req.client.clientId]);
        const widgetLimit = clientResult.rows[0].widget_limit;

        const currentWidgets = await pool.query('SELECT COUNT(*) as count FROM widgets WHERE client_id = $1', [req.client.clientId]);
        if (parseInt(currentWidgets.rows[0].count) >= widgetLimit) {
            return res.status(400).json({ error: `You have reached the widget limit (${widgetLimit}). Please upgrade your plan to create more widgets.` });
        }

        const chatwootResponse = await axios.post(`${process.env.LIVECHAT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes`, {
            name: widget_name,
            channel: {
                type: 'web_widget',
                website_url: website_url,
                welcome_tagline: welcome_message || 'How can we help you?',
                widget_color: '#1f93ff',
                enable_auto_assignment: true
            }
        }, {
            headers: {
                'api_access_token': process.env.LIVECHAT_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Lưu vào local database
        const result = await pool.query(
            'INSERT INTO widgets (client_id, widget_name, website_url, welcome_message, chatwoot_account_id, chatwoot_inbox_id, chatwoot_website_token, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.client.clientId, widget_name, website_url, welcome_message, process.env.CHATWOOT_ACCOUNT_ID, chatwootResponse.data.id, chatwootResponse.data.website_token, true]
        );

        res.status(201).json({
            message: 'Widget created successfully',
            widget: result.rows[0],
            chatwoot_response: chatwootResponse.data
        });
    } catch (error) {
        res.status(500).json({
            error: 'LiveChat API is not available',
            livechat_error: error.message
        });
    }
});

app.put('/api/widgets/:id/toggle', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get widget
        const widgetResult = await pool.query('SELECT * FROM widgets WHERE id = $1 AND client_id = $2', [id, req.client.clientId]);
        if (widgetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        const widget = widgetResult.rows[0];
        const newStatus = !widget.is_active;

        await axios.put(`${process.env.LIVECHAT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes/${widget.chatwoot_inbox_id}`, {
            status: newStatus ? 'active' : 'inactive'
        }, {
            headers: {
                'api_access_token': process.env.LIVECHAT_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Update local database
        const result = await pool.query(
            'UPDATE widgets SET is_active = $1 WHERE id = $2 RETURNING *',
            [newStatus, id]
        );

        res.json({
            message: 'Widget status updated successfully',
            widget: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            error: 'LiveChat API is not available',
            livechat_error: error.message
        });
    }
});

app.patch('/api/widgets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { widget_name, website_url, welcome_message } = req.body;

        if (!widget_name || !website_url) {
            return res.status(400).json({ error: 'Widget name and website URL are required' });
        }

        // Get widget
        const widgetResult = await pool.query('SELECT * FROM widgets WHERE id = $1 AND client_id = $2', [id, req.client.clientId]);
        if (widgetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        const widget = widgetResult.rows[0];

        const chatwootUrl = `${process.env.LIVECHAT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes/${widget.chatwoot_inbox_id}`;

        const chatwootResponse = await axios.patch(chatwootUrl, {
            name: widget_name,
            website_url: website_url,
            welcome_tagline: welcome_message || 'How can we help you?',
            widget_color: '#1f93ff',
            enable_auto_assignment: true
        }, {
            headers: {
                'api_access_token': process.env.LIVECHAT_API_KEY,
                'Content-Type': 'application/json'
            }
        });


        // Update widget in local database
        const result = await pool.query(
            'UPDATE widgets SET widget_name = $1, website_url = $2, welcome_message = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [widget_name, website_url, welcome_message, id]
        );

        res.json({
            message: 'Widget updated successfully',
            widget: result.rows[0],
            chatwoot_response: chatwootResponse.data
        });

    } catch (error) {
        res.status(500).json({
            error: 'LiveChat API is not available',
            livechat_error: error.message
        });
    }
});

app.delete('/api/widgets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get widget
        const widgetResult = await pool.query('SELECT * FROM widgets WHERE id = $1 AND client_id = $2', [id, req.client.clientId]);
        if (widgetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        const widget = widgetResult.rows[0];

        await pool.query('DELETE FROM widgets WHERE id = $1', [id]);

        res.json({ message: 'Widget deleted successfully' });

    } catch (error) {
        res.status(500).json({
            error: 'LiveChat API is not available',
            livechat_error: error.message
        });
    }
});

app.get('/widget/:id.js', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get widget
        const widgetResult = await pool.query('SELECT * FROM widgets WHERE id = $1 AND client_id = $2', [id, req.client.clientId]);
        if (widgetResult.rows.length === 0) {
            return res.status(404).send('Widget not found');
        }

        const widget = widgetResult.rows[0];

        const chatwootResponse = await axios.get(`${process.env.LIVECHAT_API_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes/${widget.chatwoot_website_token}/script`, {
            headers: {
                'api_access_token': process.env.LIVECHAT_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.setHeader('Content-Type', 'application/javascript');
        res.send(chatwootResponse.data);
    } catch (error) {
        res.status(500).send(`// Error: LiveChat API is not available - ${error.message}`);
    }
});

app.listen(PORT);
