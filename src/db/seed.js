require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./index");
const { uuidv7 } = require("uuidv7");

function getAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 17) return "teenager";
  if (age <= 64) return "adult";
  return "senior";
}

async function runSchema() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("✓ Schema applied");
}

async function seed() {
  const dataPath = path.join(__dirname, "profiles.json");
  if (!fs.existsSync(dataPath)) {
    console.error("✗ Put seed_profiles.json at src/db/profiles.json first");
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  // handles both { profiles: [...] } and plain array
  const profiles = Array.isArray(parsed) ? parsed : parsed.profiles || [];
  console.log(`→ Seeding ${profiles.length} profiles...`);

  const CHUNK = 100;
  let inserted = 0,
    skipped = 0;

  for (let i = 0; i < profiles.length; i += CHUNK) {
    const chunk = profiles.slice(i, i + CHUNK);
    const parts = [];
    const vals = [];
    let idx = 1;

    for (const p of chunk) {
      const age = parseInt(p.age, 10);
      const ageGroup = p.age_group || getAgeGroup(age);
      parts.push(
        `($${idx},$${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9})`,
      );
      vals.push(
        p.id || uuidv7(),
        p.name,
        p.gender,
        parseFloat(p.gender_probability),
        age,
        ageGroup,
        p.country_id,
        p.country_name,
        parseFloat(p.country_probability),
        p.created_at ? new Date(p.created_at) : new Date(),
      );
      idx += 10;
    }

    const sql = `
      INSERT INTO profiles
        (id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at)
      VALUES ${parts.join(",")}
      ON CONFLICT (name) DO NOTHING
    `;
    const result = await pool.query(sql, vals);
    inserted += result.rowCount;
    skipped += chunk.length - result.rowCount;
  }

  console.log(`✓ Done — ${inserted} inserted, ${skipped} skipped`);
}

async function main() {
  try {
    await runSchema();
    await seed();
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
