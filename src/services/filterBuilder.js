const ALLOWED_SORT = {
  age: "age",
  created_at: "created_at",
  gender_probability: "gender_probability",
};

function buildFilters(params, startIndex = 1) {
  const conditions = [];
  const values = [];
  let idx = startIndex;

  const {
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
  } = params;

  if (gender !== undefined) {
    conditions.push(`gender = $${idx++}`);
    values.push(gender);
  }
  if (age_group !== undefined) {
    conditions.push(`age_group = $${idx++}`);
    values.push(age_group);
  }
  if (country_id !== undefined) {
    conditions.push(`country_id = $${idx++}`);
    values.push(country_id.toUpperCase());
  }
  if (min_age !== undefined) {
    conditions.push(`age >= $${idx++}`);
    values.push(Number(min_age));
  }
  if (max_age !== undefined) {
    conditions.push(`age <= $${idx++}`);
    values.push(Number(max_age));
  }
  if (min_gender_probability !== undefined) {
    conditions.push(`gender_probability >= $${idx++}`);
    values.push(Number(min_gender_probability));
  }
  if (min_country_probability !== undefined) {
    conditions.push(`country_probability >= $${idx++}`);
    values.push(Number(min_country_probability));
  }

  return { conditions, values, nextIndex: idx };
}

function buildProfilesQuery(params) {
  const sort_by = params.sort_by || "created_at";
  const order = (params.order || "asc").toLowerCase();
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 10, 1), 50);
  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  const sortColumn = ALLOWED_SORT[sort_by] || "created_at";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  const { conditions, values, nextIndex } = buildFilters(params);
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(*) FROM profiles ${whereClause}`;

  const dataQuery = `
    SELECT
      id, name, gender, gender_probability,
      age, age_group, country_id, country_name, country_probability,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM profiles
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
  `;

  return {
    countQuery,
    countValues: values,
    dataQuery,
    dataValues: [...values, limit, offset],
    page,
    limit,
  };
}

module.exports = { buildFilters, buildProfilesQuery };
