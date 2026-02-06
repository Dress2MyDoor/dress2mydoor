import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import Dress from './models/Dress.js';
import Booking from './models/Booking.js';
import ContactSubmission from './models/ContactSubmission.js';
import { sendBookingConfirmation, sendContactConfirmation, notifyAdminBooking, notifyAdminContact } from './emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://domanicr2015_db_user:fv7yElI7bKTgBetP@dress2mydoor.t5oz4f7.mongodb.net/?appName=Dress2MyDoor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// ============================================================================
// DRESS ENDPOINTS
// ============================================================================

// GET all dresses with optional filters
app.get('/api/dresses', async (req, res) => {
    try {
        const { type, size, colour } = req.query;
        
        let filter = {};
        if (type) filter.type = type;
        if (colour) filter.colour = colour;
        if (size) filter.sizes = { $in: [size] };

        const dresses = await Dress.find(filter);
        res.json(dresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single dress by ID
app.get('/api/dresses/:id', async (req, res) => {
    try {
        const dress = await Dress.findOne({ id: req.params.id });
        if (!dress) return res.status(404).json({ error: 'Dress not found' });
        res.json(dress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Initialize dresses (admin only)
function requireAdminAuth(req, res, next) {
    const adminToken = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || null;
    if (!adminToken) return res.status(403).json({ error: 'Admin token not configured' });

    const auth = req.headers['authorization'] || req.headers['x-admin-token'];
    if (!auth) return res.status(401).json({ error: 'Missing admin credentials' });

    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
    if (token !== adminToken) return res.status(401).json({ error: 'Invalid admin token' });

    next();
}

app.post('/api/dresses/seed', requireAdminAuth, async (req, res) => {
    try {
        // Clear existing dresses
        await Dress.deleteMany({});

        // If a JSON payload with dresses is provided, use that (admin only)
        let initialDresses = [];
        if (Array.isArray(req.body?.dresses) && req.body.dresses.length > 0) {
            initialDresses = req.body.dresses.map((d, i) => ({
                id: d.id || i + 1,
                name: d.name || `Dress ${i + 1}`,
                price: d.price || 0,
                type: d.type || 'other',
                sizes: d.sizes || ['s','m','l'],
                colour: d.colour || 'unknown',
                image: d.image || ''
            }));
        } else {
            // Try to parse gallerypage.html to keep seed in sync with frontend
            try {
                const html = await fs.readFile(new URL('./gallerypage.html', import.meta.url), 'utf8');
                const itemRegex = /<div\s+class="gallery-item"([^>]*)>([\s\S]*?)<\/div>/gi;
                let match;
                let idCounter = 1;
                while ((match = itemRegex.exec(html)) !== null) {
                    const attrs = match[1];
                    const block = match[2];

                    // parse data- attributes from attrs
                    const dataAttrMatch = /data-(\w+)="([^"]*)"/gi;
                    const data = {};
                    let dam;
                    while ((dam = dataAttrMatch.exec(attrs)) !== null) {
                        data[dam[1]] = dam[2];
                    }

                    const imgMatch = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/i.exec(block);
                    const priceMatch = /<p[^>]*class="price"[^>]*>\s*\$?([0-9]+)/i.exec(block);
                    const nameFromP = /<p>([^<]+)<\/p>/i.exec(block);

                    const image = imgMatch ? imgMatch[1].trim() : (data.image || null);
                    const name = data.name || ((imgMatch && imgMatch[2]) ? imgMatch[2].trim() : (nameFromP ? nameFromP[1].trim() : `Dress ${idCounter}`));
                    const price = data.price ? parseInt(data.price, 10) : (priceMatch ? parseInt(priceMatch[1], 10) : 0);

                    const type = data.type || (name.toLowerCase().includes('wedding') ? 'wedding' : 'other');
                    const sizes = data.sizes ? data.sizes.split(',').map(s=>s.trim()) : ['s','m','l'];
                    const colour = data.colour || (image ? (image.toLowerCase().includes('white') ? 'white' : 'unknown') : 'unknown');

                    if (image) {
                        initialDresses.push({
                            id: idCounter++,
                            name,
                            price,
                            type,
                            sizes,
                            colour,
                            image
                        });
                    }
                }
            } catch (parseErr) {
                console.warn('Could not parse gallerypage.html for seed data, falling back to defaults:', parseErr.message);
            }
        }

        // Fallback to hardcoded list if parsing failed or produced none
        if (!initialDresses || initialDresses.length === 0) {
            initialDresses = [
                {
                    id: 1,
                    name: "Elegant Wedding Dress",
                    price: 299,
                    type: "wedding",
                    sizes: ["xs", "s", "m", "l", "xl"],
                    colour: "white",
                    image: "fbdscoleyharrop-209.jpg"
                },
                {
                    id: 2,
                    name: "Casual Summer Dress",
                    price: 149,
                    type: "casual",
                    sizes: ["s", "m", "l"],
                    colour: "blue",
                    image: "fbdscoleyharrop-205.jpg"
                },
                {
                    id: 3,
                    name: "Evening Gown",
                    price: 399,
                    type: "evening",
                    sizes: ["xs", "s", "m", "l"],
                    colour: "black",
                    image: "fbdscoleyharrop-100.jpg"
                },
                {
                    id: 4,
                    name: "Cocktail Dress",
                    price: 199,
                    type: "cocktail",
                    sizes: ["xs", "s", "m", "l"],
                    colour: "red",
                    image: "fbdscoleyharrop-213.jpg"
                },
                {
                    id: 5,
                    name: "Party Dress",
                    price: 179,
                    type: "party",
                    sizes: ["s", "m", "l", "xl"],
                    colour: "gold",
                    image: "fbdscoleyharrop-245.jpg"
                },
                {
                    id: 6,
                    name: "Prom Dress",
                    price: 349,
                    type: "prom",
                    sizes: ["xs", "s", "m"],
                    colour: "blue",
                    image: "fbdscoleyharrop-253.jpg"
                }
            ];
        }

        await Dress.insertMany(initialDresses);
        res.json({ message: 'Dresses seeded successfully', count: initialDresses.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// BOOKING ENDPOINTS
// ============================================================================

// POST - Create booking request
app.post('/api/bookings', async (req, res) => {
    try {
        const { name, email, phone, date, time, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const booking = new Booking({
            name,
            email,
            phone,
            date,
            time,
            message,
            status: 'pending'
        });

        await booking.save();

        // Send confirmation emails
        try {
            await sendBookingConfirmation({ name, email, phone, date, time, message });
            await notifyAdminBooking({ name, email, phone, date, time, message });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the booking if email fails
        }

        res.status(201).json({ 
            message: 'Booking request submitted successfully',
            bookingId: booking._id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - All bookings (admin only)
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH - Update booking status (admin only)
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// CONTACT ENDPOINTS
// ============================================================================

// POST - Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const submission = new ContactSubmission({
            name,
            email,
            phone,
            message,
            status: 'unread'
        });

        await submission.save();

        // Send confirmation emails
        try {
            await sendContactConfirmation({ name, email, phone, message });
            await notifyAdminContact({ name, email, phone, message });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the submission if email fails
        }

        res.status(201).json({ 
            message: 'Message received successfully',
            submissionId: submission._id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - All contact submissions (admin only)
app.get('/api/contact', async (req, res) => {
    try {
        const submissions = await ContactSubmission.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH - Update contact submission status (admin only)
app.patch('/api/contact/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const submission = await ContactSubmission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running' });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Endpoints available:');
    console.log('  GET  /api/dresses');
    console.log('  POST /api/bookings');
    console.log('  POST /api/contact');
    console.log('  GET  /api/health');
});
