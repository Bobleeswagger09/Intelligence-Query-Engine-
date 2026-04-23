const VALID_GENDERS = ["male", "female"];
const VALID_AGE_GROUPS = ["child", "teenager", "adult", "senior"];
const VALID_SORT_BY = ["age", "created_at", "gender_probability"];
const VALID_ORDERS = ["asc", "desc"];

function validateProfilesQuery(req, res, next) {
  const {
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by,
    order,
    page,
    limit,
  } = req.query;

  if (gender !== undefined && !VALID_GENDERS.includes(gender))
    return res.status(422).json({
      status: "error",
      message: "Invalid query parameters: gender must be male or female",
    });

  if (age_group !== undefined && !VALID_AGE_GROUPS.includes(age_group))
    return res.status(422).json({
      status: "error",
      message: `Invalid query parameters: age_group must be one of ${VALID_AGE_GROUPS.join(", ")}`,
    });

  if (country_id !== undefined && !/^[A-Za-z]{2}$/.test(country_id))
    return res.status(422).json({
      status: "error",
      message:
        "Invalid query parameters: country_id must be a 2-letter ISO code",
    });

  if (min_age !== undefined) {
    const v = Number(min_age);
    if (!Number.isInteger(v) || v < 0)
      return res.status(422).json({
        status: "error",
        message:
          "Invalid query parameters: min_age must be a non-negative integer",
      });
    req.query.min_age = v;
  }

  if (max_age !== undefined) {
    const v = Number(max_age);
    if (!Number.isInteger(v) || v < 0)
      return res.status(422).json({
        status: "error",
        message:
          "Invalid query parameters: max_age must be a non-negative integer",
      });
    req.query.max_age = v;
  }

  if (
    req.query.min_age !== undefined &&
    req.query.max_age !== undefined &&
    req.query.min_age > req.query.max_age
  )
    return res.status(422).json({
      status: "error",
      message:
        "Invalid query parameters: min_age cannot be greater than max_age",
    });

  for (const field of ["min_gender_probability", "min_country_probability"]) {
    if (req.query[field] !== undefined) {
      const v = parseFloat(req.query[field]);
      if (isNaN(v) || v < 0 || v > 1)
        return res.status(422).json({
          status: "error",
          message: `Invalid query parameters: ${field} must be a float between 0 and 1`,
        });
      req.query[field] = v;
    }
  }

  if (sort_by !== undefined && !VALID_SORT_BY.includes(sort_by))
    return res.status(422).json({
      status: "error",
      message: `Invalid query parameters: sort_by must be one of ${VALID_SORT_BY.join(", ")}`,
    });

  if (order !== undefined && !VALID_ORDERS.includes(order.toLowerCase()))
    return res.status(422).json({
      status: "error",
      message: "Invalid query parameters: order must be asc or desc",
    });

  if (page !== undefined) {
    const v = Number(page);
    if (!Number.isInteger(v) || v < 1)
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters: page must be a positive integer",
      });
    req.query.page = v;
  }

  if (limit !== undefined) {
    const v = Number(limit);
    if (!Number.isInteger(v) || v < 1 || v > 50)
      return res.status(422).json({
        status: "error",
        message:
          "Invalid query parameters: limit must be an integer between 1 and 50",
      });
    req.query.limit = v;
  }

  next();
}

function validateSearchQuery(req, res, next) {
  const { q, page, limit } = req.query;

  if (!q || q.trim() === "")
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameters: q is required",
    });

  if (page !== undefined) {
    const v = Number(page);
    if (!Number.isInteger(v) || v < 1)
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters: page must be a positive integer",
      });
    req.query.page = v;
  }

  if (limit !== undefined) {
    const v = Number(limit);
    if (!Number.isInteger(v) || v < 1 || v > 50)
      return res.status(422).json({
        status: "error",
        message:
          "Invalid query parameters: limit must be an integer between 1 and 50",
      });
    req.query.limit = v;
  }

  next();
}

module.exports = { validateProfilesQuery, validateSearchQuery };
