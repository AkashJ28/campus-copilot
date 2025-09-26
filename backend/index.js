require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const studentRoutes = require("./routes/students");
const professorRoutes = require("./routes/professors");
const courseRoutes = require("./routes/courses");

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend API is live and responding!");
});

app.use("/api/students", studentRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/courses", courseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend API server is running on port ${PORT}`);
});
