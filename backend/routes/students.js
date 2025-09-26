const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  console.log("--> Request received for GET /api/students");
  try {
    const result = await pool.query(
      "SELECT student_id, name, department FROM students"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all students:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT student_id, name, department FROM students WHERE student_id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching student with ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { semester_id, day } = req.query;

  try {
    let query = `
      SELECT c.course_name, cs.day_of_week, cs.start_time, cs.end_time, cs.room
      FROM ClassSchedule AS cs
      JOIN Courses AS c ON cs.course_id = c.course_id
      JOIN Enrollments AS e ON c.course_id = e.course_id
      WHERE e.student_id = $1
    `;
    const params = [id];

    if (semester_id) {
      params.push(semester_id);
      query += ` AND cs.semester_id = $${params.length}`;
    }
    if (day) {
      params.push(day);
      query += ` AND cs.day_of_week = $${params.length}`;
    }

    query += ` ORDER BY cs.start_time;`; // Order the schedule chronologically

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching schedule for student ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id/enrollments", async (req, res) => {
  const { id } = req.params;
  const { semester_id } = req.query;

  try {
    let query = `
      SELECT c.course_name, s.name AS semester_name
      FROM Enrollments AS e
      JOIN Courses AS c ON e.course_id = c.course_id
      JOIN Semesters AS s ON e.semester_id = s.semester_id
      WHERE e.student_id = $1
    `;
    const params = [id];

    if (semester_id) {
      params.push(semester_id);
      query += ` AND e.semester_id = $${params.length}`;
    }

    query += ` ORDER BY s.start_date, c.course_name;`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching enrollments for student ID ${id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

router.get("/:id/placements", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT r.company_name, p.status, p.ctc_lpa
      FROM Placements AS p
      JOIN Recruiters AS r ON p.company_id = r.company_id
      WHERE p.student_id = $1
      ORDER BY r.company_name;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching placements for student ID ${id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

module.exports = router;
