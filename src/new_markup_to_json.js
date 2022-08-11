const { Int } = require("./utils");
const GM = require("gm");

const pos = (x, y) => ({ x: Int(x), y: Int(y) });
const dim = (x, y) => ({ width: Int(x), height: Int(y) });
const color = "(black|red|orange|yellow|green|blue|indigo|violet)";

const MarkupParser = {
  crop: {
    regex: new RegExp(`crop,(\\d+)x(\\d+),(\\d+)x(\\d+)`),
    t: (m) => ({
      block: "crop",
      instruction: {
        from: pos(m[1], m[2]),
        size: dim(m[3], m[4]),
      },
    }),
  },
  circle: {
    regex: new RegExp(`circle,(\\d+)x(\\d+),(\\d+),${color}`),
    t: (m) => ({
      block: "draw",
      id: "circle",
      instruction: {
        from: pos(m[1], m[2]),
        radius: Int(m[3]),
        color: m[4],
      },
    }),
  },
  rectangle: {
    regex: new RegExp(`rectangle,(\\d+)x(\\d+),(\\d+)x(\\d+),${color}`),
    t: (m) => ({
      block: "draw",
      id: "rectangle",
      instruction: {
        from: pos(m[1], m[2]),
        size: dim(m[3], m[4]),
        color: m[5],
      },
    }),
  },
  line: {
    regex: new RegExp(`(line|arrow|gap),(\\d+)x(\\d+),(\\d+)x(\\d+),${color}`),
    t: (m) => ({
      block: "draw",
      id: m[1],
      instruction: {
        from: pos(m[2], m[3]),
        to: pos(m[4], m[5]),
        color: m[6],
      },
    }),
  },
};

function convertMarkupToJSON(markup, infile, outfile, stroke) {
  return GMGetSize(infile).then((size) => {
    const json = {
      sourceFile: infile,
      destinationFile: outfile,

      dimensions: size,
      finalDimensions: size,

      instructions: {},
    };

    const instructions = markup
      .trim()
      .split(";")
      .filter((x) => x);

    instructions.forEach((instruction) => {
      const result = parseInstruction(instruction);
      if (result.block === "crop") {
        json["instructions"]["crop"] = result.instruction;
        json["finalDimensions"] = result.instruction["size"];
      }
      if (result.block === "draw") {
        if (!json["instructions"]["draw"]) {
          json["instructions"]["draw"] = [];
        }
        const drawCommand = { [result.id]: result.instruction };
        json["instructions"]["draw"].push(drawCommand);
      }
    });

    if (stroke != null) {
      json.instructions.strokeWidth = stroke;
    }

    return json;
  });
}

function parseInstruction(instruction) {
  for (const { regex, t } of Object.values(MarkupParser)) {
    const match = regex.exec(instruction);
    if (match && match[0] === instruction) {
      return t(match);
    }
  }
  throw `Could not parse markup instruction: '${instruction}'`;
}

function GMGetSize(infile) {
  return new Promise((resolve, reject) => {
    GM(infile).size(function (err, size) {
      if (err) {
        reject(err);
      }
      resolve(size);
    });
  });
}

module.exports = convertMarkupToJSON;
