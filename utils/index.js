const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const utils = {
  message: "Internal server error",

  stringSlug(string) {
    return string
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");
  },

  randomKey(length = 5, stringOnly = false) {
    if (stringOnly) {
      const characters = "abcdefghijklmnopqrstuvwxyz";
      return [...Array(length)]
        .map(() => characters[Math.floor(Math.random() * characters.length)])
        .join("");
    } else {
      return [...Array(length)]
        .map(() => Math.random().toString(36)[2])
        .join("");
    }
  },

  paginate(page, perPage) {
    page = Math.max(Number(page) || 1, 1);
    const limit = Math.max(Number(perPage) || 1, 1);
    const skip = (page - 1) * limit;

    return [{ $skip: skip }, { $limit: limit }];
  },

  async verifyCookieToken(fullToken) {
    try {
      const token = fullToken.split(" ")[1];
      const tokenData = await jwt.verify(token, process.env.AUTH_SECRET);
      return tokenData;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  hasOne(query, from, as, select = []) {
    const $expr = { $eq: ["$_id", `$$${query}`] };
    const pipeline = [{ $match: { $expr } }];
    if (select.length) {
      pipeline.push({
        $project: Object.fromEntries(select.map((key) => [key, 1])),
      });
    }
    return [
      {
        $lookup: {
          from,
          let: { [query]: `$${query}` },
          pipeline,
          as,
        },
      },
      {
        $addFields: {
          [as]: { $arrayElemAt: [`$${as}`, 0] },
        },
      },
    ];
  },

  hasMany(
    from,
    localField,
    foreignField,
    as,
    select = [],
    additionalCriteria = {}
  ) {
    const pipeline = [];
    if (Object.keys(additionalCriteria).length) {
      pipeline.push({
        $match: additionalCriteria,
      });
    }
    if (select.length) {
      pipeline.push({
        $project: Object.fromEntries(select.map((key) => [key, 1])),
      });
    }

    return [
      {
        $lookup: {
          from,
          localField,
          foreignField,
          as,
          pipeline,
        },
      },
    ];
  },

  toggle(field) {
    return [{ $set: { [field]: { $eq: [false, `$${field}`] } } }];
  },

  startDate(date = new Date()) {
    let startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  },

  endDate(date = new Date()) {
    let endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  },

  addDate(days = 0, date = new Date()) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  dateDifferent(start = new Date(), end = new Date()) {
    const { startDate } = utils;
    return (startDate(end) - startDate(start)) / (1000 * 60 * 60 * 24);
  },

  objectID(id) {
    return new ObjectId(id);
  },

  arrayConverter(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  },

  encode(value) {
    return value ? btoa(value) : "";
  },

  decode(value) {
    return value ? atob(value) : "";
  },

  async average(...numbers) {
    return (
      numbers.reduce((sum, num) => sum + (+num || 0), 0) / numbers.length
    ).toFixed(2);
  },

  dateFormat(value = new Date(), sign = "-") {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(value)
      .toLocaleDateString("en-GB", options)
      .replace(/ /g, sign);
  },

  countUniqueDates(start, end) {
    return new Set(
      Array.from(
        {
          length:
            ((max = new Date(end)) - (min = new Date(start))) / 86400000 + 1,
        },
        (_, i) =>
          new Date(min.getTime() + i * 86400000).toISOString().split("T")[0]
      )
    ).size;
  },
};

module.exports = utils;
