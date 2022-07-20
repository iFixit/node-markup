var { Int, cleanJSON } = require("./src/utils");
var convertMarkupToJSON = require("./src/markup_to_json");
var ImageMarkupBuilder = require("./ImageMarkupBuilder").Builder;
var Fabric = require("fabric").fabric;

const RequiredCommands =
  "Invalid usage: Please provide exactly one of the `markup` or the `json` commands";
var yargs = require("yargs")
  .command("json <json_string>", "Process JSON input", {}, jsonCommand)
  .command(
    "markup <markup_string>",
    "Process markup string input",
    {
      input: {
        demandOption: true,
        describe: "Input image file to apply markup on",
        string: true,
      },
      output: {
        demandOption: true,
        describe: "Output image file to write to",
        string: true,
      },
      stroke: {
        describe: "Stroke width to apply.",
        number: true,
      },
    },
    markupCommand
  )
  .command("$0", "Default command (shim for flags)", {
      json: {
        describe: "String of JSON",
        string: true,
      },
      markup: {
        describe: "String of Markup",
        string: true,
      },
      input: {
        describe: "Input image file to apply markup on",
        string: true,
      },
      output: {
        describe: "Output image file to write to",
        string: true,
      },
      stroke: {
        describe: "Stroke width to apply.",
        number: true,
      },
   }, shimForFlags)
  .option("debug", {
    describe: "Enable debug output.",
  })
  .alias("h", "help")
  .check((argv) => argv._.length === 1 || RequiredCommands)
  .strict()
  .wrap(null);

var argv = yargs.argv;

function jsonCommand(argv) {
  var parsed = JSON.parse(argv.json_string);
  processJSON(parsed);
}

function markupCommand(argv) {
  const stroke = argv.stroke ? Int(argv.stroke) : null;

  convertMarkupToJSON(
    processJSON,
    argv.markup_string,
    argv.input,
    argv.output,
    stroke
  );
}

function shimForFlags(argv) {
   if ((argv.json && argv.markup) || (!argv.json && !argv.markup)) {
      console.error(RequiredCommands);
      process.exit(-1);
   }

   if (argv.json) {
      argv.json_string = argv.json;
      return jsonCommand(argv);
   }

   if (argv.markup) {
      if (!argv.input || !argv.output) {
         console.error("input and output options are required for markup");
         process.exit(-1);
      }
      argv.markup_string = argv.markup
      return markupCommand(argv);
   }
}

function processJSON(json) {
  cleanJSON(json);

  var finalSize = json["finalDimensions"];
  var canvas = Fabric.createCanvasForNode(
    finalSize["width"],
    finalSize["height"]
  );
  var builder = ImageMarkupBuilder(canvas);

  builder.processJSON(json, function () {
    if (argv.debug) {
      console.log(builder.getMarkupString());
    }
  });
}
