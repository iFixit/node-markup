const { Int } = require("./utils");
const GM = require("gm");

const pos = (x, y) => ({ x: Int(x), y: Int(y) });
const dim = (x, y) => ({ width: Int(x), height: Int(y) });

const MarkupParser = {
  crop: {
    regex: /crop,(\d+)x(\d+),(\d+)x(\d+)/,
    t: (m) => ({
      block: "crop",
      instruction: {
        from: pos(m[1], m[2]),
        size: dim(m[3], m[4]),
      },
    }),
  },
  circle: {
    regex: /circle,(\d+)x(\d+),(\d+),(\w+)/,
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
    regex: /rectangle,(\d+)x(\d+),(\d+)x(\d+),(\w+)/,
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
    regex: /(line|arrow|gap),(\d+)x(\d+),(\d+)x(\d+),(\w+)/,
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
  return new Promise((resolve) => {
    var json = {};
    GMGetSize(infile).then((size) => {
      json["dimensions"] = size;
      json["finalDimensions"] = size;

      json["instructions"] = {};

      var instructions = markup
        .trim()
        .split(";")
        .filter((_) => _);

      instructions.forEach((instruction) => {
        JSONFromMarkup(instruction, json);
      });

      json["sourceFile"] = infile;
      json["destinationFile"] = outfile;

      if (stroke != null) {
        json.instructions.strokeWidth = stroke;
      }

      resolve(json);
    });
  });
}

function JSONFromMarkup(instruction, json) {
  var args = instruction.split(",");
  var command = args[0];
  switch (command) {
    case "crop":
      var cropPosition = args[1].split("x");
      cropPosition[0] = Int(cropPosition[0]);
      cropPosition[1] = Int(cropPosition[1]);
      var cropFrom = {
        x: cropPosition[0],
        y: cropPosition[1],
      };

      var cropDimensions = args[2].split("x");
      cropDimensions[0] = Int(cropDimensions[0]);
      cropDimensions[1] = Int(cropDimensions[1]);
      var cropSize = {
        width: cropDimensions[0],
        height: cropDimensions[1],
      };

      var crop = {};
      crop["from"] = cropFrom;
      crop["size"] = cropSize;

      json["instructions"]["crop"] = crop;
      json["finalDimensions"] = crop["size"];
      break;
    case "circle":
      if (!json["instructions"]["draw"]) json["instructions"]["draw"] = [];

      var circlePosition = args[1].split("x");
      circlePosition[0] = Int(circlePosition[0]);
      circlePosition[1] = Int(circlePosition[1]);
      var circleFrom = {
        x: circlePosition[0],
        y: circlePosition[1],
      };

      var radius = Int(args[2]);
      var circleColor = args[3];

      var circle = {};
      circle["from"] = circleFrom;
      circle["radius"] = radius;
      circle["color"] = circleColor;

      json["instructions"]["draw"].push({ circle: circle });
      break;
    case "rectangle":
      if (!json["instructions"]["draw"]) json["instructions"]["draw"] = [];

      var rectPosition = args[1].split("x");
      rectPosition[0] = Int(rectPosition[0]);
      rectPosition[1] = Int(rectPosition[1]);
      var rectFrom = {
        x: rectPosition[0],
        y: rectPosition[1],
      };

      var rectDimensions = args[2].split("x");
      rectDimensions[0] = Int(rectDimensions[0]);
      rectDimensions[1] = Int(rectDimensions[1]);
      var rectSize = {
        width: rectDimensions[0],
        height: rectDimensions[1],
      };

      var rectColor = args[3];

      var rectangle = {
        from: rectFrom,
        size: rectSize,
        color: rectColor,
      };

      json["instructions"]["draw"].push({ rectangle: rectangle });
      break;
    case "line":
    case "arrow":
    case "gap":
      if (!json["instructions"]["draw"]) json["instructions"]["draw"] = [];

      var p1 = args[1].split("x");
      var p2 = args[2].split("x");

      var line = {
        from: {
          x: Int(p1[0]),
          y: Int(p1[1]),
        },
        to: {
          x: Int(p2[0]),
          y: Int(p2[1]),
        },
        color: args[3],
      };
      var gapInstruction = {};
      gapInstruction[command] = line;

      json["instructions"]["draw"].push(gapInstruction);
      break;
    default:
  }
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
