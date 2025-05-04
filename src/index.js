const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config(); 

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 1) Get availability between two dates
app.get('/availability', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Missing from/to params' });

    const start = new Date(from);
    const end   = new Date(to);

    // fetch all bookings that overlap [from..to]
    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          { startDate: { lte: end } },
          { endDate:   { gte: start } }
        ]
      },
      select: { startDate: true, endDate: true }
    });

    // build one entry per day
    const availability = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isBooked = bookings.some(b => {
        const s = new Date(b.startDate), e = new Date(b.endDate);
        return s <= d && d <= e;
      });
      availability.push({ date: dateStr, booked: isBooked });
    }

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2) Create a booking (with optional outline file)
app.post('/book', upload.single('outline'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    const { startDate, endDate, technology, clientName, mode, location, costPerDay } = data;
    const start = new Date(startDate), end = new Date(endDate);

    // conflict check
    const conflict = await prisma.booking.findFirst({
      where: {
        AND: [
          { startDate: { lte: end } },
          { endDate:   { gte: start } }
        ]
      }
    });
    if (conflict) {
      return res.status(409).json({ error: 'Dates already booked' });
    }

    // handle outline file
    let outlinePath = null;
    if (req.file) {
      const target = path.join('uploads', `${Date.now()}-${req.file.originalname}`);
      fs.renameSync(req.file.path, target);
      outlinePath = target;
    }

    // persist booking
    await prisma.booking.create({
      data: {
        startDate:  start,
        endDate:    end,
        technology,
        clientName,
        mode,
        location:   location || null,
        costPerDay: parseFloat(costPerDay),
        outlinePath
      }
    });

    res.status(201).json({ message: 'Booking created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// start server
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
