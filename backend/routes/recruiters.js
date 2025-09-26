const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT company_id, company_name, job_roles FROM Recruiters ORDER BY company_name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching all recruiters:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT company_id, company_name, job_roles FROM Recruiters WHERE company_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching recruiter with ID ${id}:`, err.message);
    res.status(500).send("Server error");
  }
});

router.get("/:id/placements", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p.placement_id, s.student_id, s.name as student_name, s.department, p.status, p.ctc_lpa
      FROM Placements AS p
      JOIN Students AS s ON p.student_id = s.student_id
      WHERE p.company_id = $1
      ORDER BY s.name;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(
      `Error fetching placements for company ID ${id}:`,
      err.message
    );
    res.status(500).send("Server error");
  }
});

module.exports = router;
