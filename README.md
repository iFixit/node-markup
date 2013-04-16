# Node Markup #

## About ##

Node Markup is a helper library for
[kangax's Fabric.js][fabricjs] to make it easier to
crop images and add markup such as circles and rectangles. Node Markup has
frontend (web site) and backend (Node.js) support for rendering identical
images on both sides.

## Installation ##

### Backend ###

1. [Install Node.js][nodejs_install]
2. Install Node Markup dependencies

     `$ npm install`

3. From the terminal, you can call ImageMarkupCall.js

     `$ node ImageMarkupCall.js --json '[json_string]'`

### Frontend ###

***TODO:*** The JSON schema is mostly undocumented, and the frontend works in a
very different way from the backend, so the frontend will be more or less
trial-and-error for the user (you) until I've finished documenting it.

* Do not include sourceFile or destinationFile in the frontend JSON. You can
add a source image manually to the Fabric.js canvas, or leave it blank.

Long story short:

1. Include Fabric.js and ImageMarkupBuilder.js in the HTML

2. Create a `<canvas>` DOM object in the HTML

3. Run that `<canvas>` object through `fabric.Canvas`

     `var fabric = new fabric.Canvas('canvasid');`

4. Run that fabric object trough `ImageMarkupBuilder`

     `var markupBuilder = new ImageMarkupBuilder(fabric);`

5. Send a JSON **object** *(not string)* through for processing

     `markupBuilder.processJSON(jsonObject);`

[fabricjs]: https://github.com/kangax/fabric.js/
[nodejs_install]: https://github.com/joyent/node/wiki/Installation