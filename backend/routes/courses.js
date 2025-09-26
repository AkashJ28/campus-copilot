const express = require("express");
const router = express.Router();
const pool = require("../db");

/*
 Query Params: ?department=
 */
router.get("/", async (req, res) => {
  const { department } = req.query;
  try {
    let query = `
      SELECT c.course_id, c.course_name, c.credits, c.department, p.name as professor_name
      FROM Courses AS c
      LEFT JOIN Professors AS p ON c.professor_id = p.professor_id
    `;
    const params = [];

    if (department) {
      params.push(department);
      query += ` WHERE c.department = $1`;
    }

    query += ` ORDER BY c.course_name;`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all courses:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT c.course_id, c.course_name, c.credits, c.department, p.professor_id, p.name as professor_name
      FROM Courses AS c
      LEFT JOIN Professors AS p ON c.professor_id = p.professor_id
      WHERE c.course_id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching course with ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

/*
  Query Params: ?semester_id=
 */
router.get("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { semester_id } = req.query;

  if (!semester_id) {
    return res
      .status(400)
      .json({ error: "A semester_id query parameter is required." });
  }

  try {
    const query = `
      SELECT day_of_week, start_time, end_time, room
      FROM ClassSchedule
      WHERE course_id = $1 AND semester_id = $2
      ORDER BY
        CASE day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          ELSE 6
        END,
        start_time;
    `;
    const result = await pool.query(query, [id, semester_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching schedule for course ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

/*
  Query Params: ?q=
 */
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ error: "A search query parameter 'q' is required." });
  }

  try {
    const query = `
      SELECT course_id, course_name, department
      FROM Courses
      WHERE course_name ILIKE $1
      ORDER BY course_name;
    `;
    const result = await pool.query(query, [`%${q}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error searching for courses with query "${q}":`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

module.exports = router;
