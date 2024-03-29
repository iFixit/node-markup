var { Int, cleanJSON } = require("./src/utils");
var convertMarkupToJSON = require("./src/markup_to_json");
var ImageMarkupBuilder = require("./ImageMarkupBuilder").Builder;
var Fabric = require("fabric").fabric;

const path = require("path");

const RequiredCommands =
  "Invalid usage: Please provide exactly one of the `markup` or the `json` commands";
var yargs = require("yargs")
  .command("json <json_string>", "Process JSON input", {}, jsonCommand)
  .command(
    "markup <markup_string>",
    "Process markup string input",
    {
      input: {
        requiresArg: true,
        demandOption: true,
        describe: "Input image file to apply markup on",
        string: true,
      },
      output: {
        requiresArg: true,
        demandOption: true,
        describe: "Output image file to write to",
        string: true,
      },
      stroke: {
        requiresArg: true,
        describe: "Stroke width to apply.",
        number: true,
      },
    },
    markupCommand
  )
  .check((argv) => argv._.length <= 1 || RequiredCommands)
  .command(
    "$0",
    "Default command (shim for flags)",
    {
      json: {
        requiresArg: true,
        describe: "String of JSON",
        string: true,
        conflicts: ["markup", "input", "output", "stroke"],
      },
      markup: {
        requiresArg: true,
        describe: "String of Markup",
        string: true,
        conflicts: "json",
        implies: ["input", "output"],
      },
      input: {
        requiresArg: true,
        describe: "Input image file to apply markup on",
        string: true,
      },
      output: {
        requiresArg: true,
        describe: "Output image file to write to",
        string: true,
      },
      stroke: {
        requiresArg: true,
        describe: "Stroke width to apply.",
        number: true,
      },
    },
    shimForFlags
  )
  .option("debug", {
    describe: "Enable debug output.",
  })
  .alias("h", "help")
  .strict()
  .wrap(null);

var argv = yargs.argv;

function jsonCommand(argv) {
  var parsed = JSON.parse(argv.json_string);
  processJSON(parsed);
}

function markupCommand(argv) {
  const stroke = argv.stroke ? Int(argv.stroke) : null;

  convertMarkupToJSON(argv.markup_string, argv.input, argv.output, stroke).then(
    processJSON
  );
}

// Support flag form arguments (--json and --markup) for backwards CLI
// compatibility. Yargs is not able to support commands with long flag format.
// Even using aliases, the parser gets confused. Admittedly using options flags
// as commands was misguided on the original interface. In order preserve the
// existing behavior, we can continue to use flags, and this shim, to support
// flag form commands (actually options, just on the default command).
// Once we've deprecated these, we can drop this function, drop
// the `command $0` default command, and resume the `check` for exactly one
// command.
function shimForFlags(argv) {
  if (!argv.json && !argv.markup) {
    console.error(RequiredCommands);
    process.exit(-1);
  }

  if (argv.json) {
    argv.json_string = argv.json;
    return jsonCommand(argv);
  }

  if (argv.markup) {
    argv.markup_string = argv.markup;
    return markupCommand(argv);
  }
}

function processJSON(json) {
  cleanJSON(json);

  if (json.sourceFile) {
    json.sourceFile = `file://${path.resolve(json.sourceFile)}`;
  }

  var finalSize = json["finalDimensions"];
  var canvas = new Fabric.StaticCanvas(null, {
    width: finalSize["width"],
    height: finalSize["height"],
    renderOnAddRemove: false,
  });
  var builder = ImageMarkupBuilder(canvas);

  builder.processJSON(json, function () {
    if (argv.debug) {
      console.log(builder.getMarkupString());
    }
  });
}
