const pool = require("../db");
const { parseNLQuery } = require("../services/nlpParser");
const { buildProfilesQuery } = require("../services/filterBuilder");

async function searchProfiles(req, res) {
  try {
    const { q, page, limit } = req.query;

    const filters = parseNLQuery(q);
    if (!filters) {
      return res.status(422).json({
        status: "error",
        message: "Unable to interpret query",
      });
    }

    const queryParams = { ...filters, page: page || 1, limit: limit || 10 };
    const {
      countQuery,
      countValues,
      dataQuery,
      dataValues,
      page: pg,
      limit: lmt,
    } = buildProfilesQuery(queryParams);

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countValues),
      pool.query(dataQuery, dataValues),
    ]);

    return res.status(200).json({
      status: "success",
      page: pg,
      limit: lmt,
      total: parseInt(countResult.rows[0].count, 10),
      data: dataResult.rows,
    });
  } catch (err) {
    console.error("searchProfiles error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { searchProfiles };
