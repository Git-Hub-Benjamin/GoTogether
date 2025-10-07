import express from "express";
import universities from "../data/us_universities.json";
import { University } from "../types/us_universities";

const router = express.Router();

router.get("/states", (_req, res) => {
  const states = Array.from(
    new Set(universities.map((u: University) => u.state).filter(Boolean))
  ).sort();

  res.json(states);
});

router.get("/", (_req, res) => {
  res.json(
    universities.map((u: University) => ({
      name: u.name,
      domain: u.domains[0] || "",
      state: u.state,
    }))
  );
});

router.get("/:state", (req, res) => {
  const { state } = req.params;

  const filtered = (universities as University[]).filter(
    (u) => u.state.toLowerCase() === state.toLowerCase()
  );

  res.json(
    filtered.map((u) => ({
      name: u.name,
      domain: u.domains[0] || "",
      state: u.state,
    }))
  );
});

export default router;