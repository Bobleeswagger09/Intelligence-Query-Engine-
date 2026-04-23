const pool = require("../db");
const { buildProfilesQuery } = require("../services/filterBuilder");

async function getProfiles(req, res) {
  try {
    const { countQuery, countValues, dataQuery, dataValues, page, limit } =
      buildProfilesQuery(req.query);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countValues),
      pool.query(dataQuery, dataValues),
    ]);

    return res.status(200).json({
      status: "success",
      page,
      limit,
      total: parseInt(countResult.rows[0].count, 10),
      data: dataResult.rows,
    });
  } catch (err) {
    console.error("getProfiles error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}

async function getProfileById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, gender, gender_probability, age, age_group,
              country_id, country_name, country_probability,
              to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
       FROM profiles WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0)
      return res
        .status(404)
        .json({ status: "error", message: "Profile not found" });

    return res.status(200).json({ status: "success", data: result.rows[0] });
  } catch (err) {
    console.error("getProfileById error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { getProfiles, getProfileById };
