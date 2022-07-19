var { Int } = require("./src/utils");

function convertMarkupToJSON(callback, markup, infile, outfile) {
  var json = {};

  var GM = require("gm");
  GM(infile).size(function (err, size) {
    if (err) throw err;

    json["dimensions"] = size;
    json["finalDimensions"] = size;

    json["instructions"] = {};

    var instructions = markup.split(";");
    for (var i = 0; i < instructions.length; ++i) {
      if (instructions[i] == "") continue;

      var args = instructions[i].split(",");
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
          var instruction = {};
          instruction[command] = line;

          json["instructions"]["draw"].push(instruction);
          break;
        default:
      }
    }

    json["sourceFile"] = infile;
    json["destinationFile"] = outfile;

    if (stroke != null) {
      json.instructions.strokeWidth = stroke;
    }

    callback(json);
  });
}

module.exports = convertMarkupToJSON;
