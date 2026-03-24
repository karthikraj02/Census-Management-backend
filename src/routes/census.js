const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /vote
 * Add a new census entry
 * Body: { name, is_vaccinated, birthdate, gender }
 */
router.post('/vote', async (req, res) => {
  try {
    const { name, is_vaccinated, birthdate, gender } = req.body;

    // Validation
    if (!name || !birthdate || gender === undefined) {
      return res.status(400).json({ error: 'name, birthdate, and gender are required' });
    }

    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({ error: 'gender must be male, female, or other' });
    }

    // Parse birthdate - accepts DD-MM-YYYY or ISO formats
    let parsedDate;
    if (/^\d{2}-\d{2}-\d{4}$/.test(birthdate)) {
      const [day, month, year] = birthdate.split('-');
      parsedDate = new Date(`${year}-${month}-${day}`);
    } else {
      parsedDate = new Date(birthdate);
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid birthdate format. Use DD-MM-YYYY' });
    }

    // Ensure date is not in the future and within 100 years
    const now = new Date();
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(now.getFullYear() - 100);

    if (parsedDate > now) {
      return res.status(400).json({ error: 'birthdate cannot be in the future' });
    }
    if (parsedDate < hundredYearsAgo) {
      return res.status(400).json({ error: 'birthdate cannot be more than 100 years ago' });
    }

    const [inserted] = await db('people')
      .insert({
        name: name.trim(),
        is_vaccinated: is_vaccinated === true || is_vaccinated === 'true',
        birthdate: parsedDate,
        gender: gender.toLowerCase(),
      })
      .returning(['id', 'name', 'is_vaccinated', 'birthdate', 'gender']);

    res.status(201).json({ message: 'Record added successfully', data: inserted });
  } catch (err) {
    console.error('POST /vote error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /data
 * Retrieve all census entries
 */
router.get('/data', async (req, res) => {
  try {
    const rows = await db('people')
      .select('id', 'name', 'is_vaccinated', 'birthdate', 'gender')
      .orderBy('created_at', 'desc');

    const data = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      is_vaccinated: row.is_vaccinated,
      birthdate: formatDate(row.birthdate),
      gender: row.gender,
    }));

    res.json({ data });
  } catch (err) {
    console.error('GET /data error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /counts?is_vaccinated=true|false
 * For the line chart: count of vaccinated/unvaccinated per age
 */
router.get('/counts', async (req, res) => {
  try {
    const { is_vaccinated } = req.query;

    if (is_vaccinated === undefined) {
      return res.status(400).json({ error: 'is_vaccinated query param is required (true or false)' });
    }

    const vaccinatedBool = is_vaccinated === 'true';

    const rows = await db('people')
      .select(
        db.raw('EXTRACT(YEAR FROM AGE(birthdate))::int AS age'),
        db.raw('COUNT(*)::int AS count')
      )
      .where('is_vaccinated', vaccinatedBool)
      .groupByRaw('EXTRACT(YEAR FROM AGE(birthdate))')
      .orderByRaw('EXTRACT(YEAR FROM AGE(birthdate))');

    const data = rows.map((row) => ({
      age: row.age,
      count: row.count,
    }));

    res.json({ data });
  } catch (err) {
    console.error('GET /counts error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /results
 * For the bar chart: count per gender per age
 */
router.get('/results', async (req, res) => {
  try {
    const rows = await db('people')
      .select(
        db.raw('EXTRACT(YEAR FROM AGE(birthdate))::int AS age'),
        'gender',
        db.raw('COUNT(*)::int AS count')
      )
      .groupByRaw('EXTRACT(YEAR FROM AGE(birthdate)), gender')
      .orderByRaw('EXTRACT(YEAR FROM AGE(birthdate)), gender');

    const data = rows.map((row) => ({
      age: row.age,
      gender: row.gender,
      count: row.count,
    }));

    res.json({ data });
  } catch (err) {
    console.error('GET /results error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Helper: format Date to DD-MM-YYYY
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

module.exports = router;
