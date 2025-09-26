const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT professor_id, name, department FROM professors"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all professors:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT professor_id, name, department FROM professors WHERE professor_id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching professor with ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id/courses", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT course_id, course_name, credits, department
      FROM Courses
      WHERE professor_id = $1
      ORDER BY course_name;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching courses for professor ID ${id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

router.get("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { day } = req.query; // Still allow filtering by day

  try {
    let query = `
      SELECT c.course_name, cs.day_of_week, cs.start_time, cs.end_time, cs.room
      FROM ClassSchedule AS cs
      JOIN Courses AS c ON cs.course_id = c.course_id
      WHERE c.professor_id = $1
    `;
    const params = [id];

    if (day) {
      params.push(day);
      query += ` AND cs.day_of_week = $${params.length}`;
    }

    query += ` ORDER BY cs.start_time;`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching schedule for professor ID ${id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

router.get("/:id/courses/:course_id/students", async (req, res) => {
  const { id, course_id } = req.params;

  try {
    const query = `
      SELECT s.student_id, s.name, s.department
      FROM Students AS s
      JOIN Enrollments AS e ON s.student_id = e.student_id
      WHERE e.course_id = $1
        AND EXISTS (
          SELECT 1 FROM Courses 
          WHERE course_id = $1 AND professor_id = $2
        );
    `;
    const params = [course_id, id];

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching students for course ID ${course_id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

module.exports = router;
