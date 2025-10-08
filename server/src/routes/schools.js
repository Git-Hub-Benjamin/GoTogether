import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNIVERSITIES_PATH = path.join(
  __dirname,
  "../data/us_universities.json"
);
const universities = JSON.parse(
  fs.readFileSync(UNIVERSITIES_PATH, "utf-8")
);

const router = Router();

router.get("/:state", (req, res) => {
  const { state } = req.params;
  const filtered = universities.filter(
    (u) => u.state.toLowerCase() === state.toLowerCase()
  );

  res.json(
    filtered.map((u) => ({
      name: u.name,
      state: u.state,
      colors: u.colors
    }))
  );
});

router.get("/domain/:schoolName", (req, res) => {
  const { schoolName } = req.params;
  const normalized = decodeURIComponent(schoolName).toLowerCase();

  const university = universities.find(
    (u) => u.name.toLowerCase() === normalized
  );

  if (!university) {
    return res.status(404).json({ message: "School not found" });
  }

  res.json({
    domain: university.domains[0] || "",
    colors: university.colors,
  });
});

export default router;