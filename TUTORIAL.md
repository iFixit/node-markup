# Builder JSON #

## Introduction ##

The Builder JSON format provides instructions to Node Markup's `ImageMarkupBuilder` (or `ImageMarkupCall` if done from command line).

## Specification ##

The Builder JSON schema is made up of the following top elements:

* `dimensions`: The original dimensions of the image/canvas. This is a (`height`, `width`) tuple.
* `finalDimensions`: The final dimensions of the image/canvas. This is a (`height`, `width`) tuple.
* `instructions`: A set of image modifcation instructions (described below).

####*Node.js-specific elements*####

* `sourceFile`: The source JPEG to apply markup instructions to.
* `destinationFile`: The destination JPEG to save to.

####*Frontend- or HTML-specific elements*####

* `previewInstructions`: Instructions (described below) to support downsizing an image to fit in a smaller container.

      * `ratio`: The ratio of original size to preview size. For example, if the original image width is 1024px and the preview container size is 640px, `ratio = 1024 / 640 = 1.6`.

*If `previewInstructions.ratio` is specified, give absolute pixel coordinates/sizes in `draw` instructions based on the preview size. They will be upscaled automatically.*

###Instructions Specification###

`instructions` is a set of markup instructions:

* `crop`: Instructions to crop the image

      * `from`: Top-left pixel coordinates of crop. This is an (`x`, `y`) tuple.

      * `size`: Pixel size of crop. This is a (`height`, `width`) tuple.

* `draw`: An array of markup drawing instructions (described below)

####Markup Drawing Instructions####

* `circle`: Instructions to draw a circle

      * `color`: A color name (e.g. 'red')

      * `from`: An (`x`, `y`) tuple of the center of the circle

      * `radius`: The pixel radius of the circle

* `rectangle`: Instructions to draw a rectangle

      * `color`: A color name (e.g. 'red')

      * `from`: An (`x`, `y`) tuple of the top-left corner of the rectangle

      * size: A (`height`, `width`) tuple of the size of the rectangle.

## Sample JSON String ##

`{
  "dimensions": {
    "width": 3260,
    "height": 2445
  },
  "finalDimensions": {
    "width": 2588,
    "height": 1941
  },
  "instructions": {
    "crop": {
      "from": {
        "x": 330,
        "y": 330
      },
      "size": {
        "width": 2588,
        "height": 1941
      }
    },
    "draw": [
      {
        "circle": {
          "from": {
            "x": 522,
            "y": 505
          },
          "radius": 147,
          "color": "red"
        }
      },
      {
        "rectangle": {
          "from": {
            "x": 1602,
            "y": 605
          },
          "size": {
            "width": 131,
            "height": 131
          },
          "color": "black"
        }
      }
    ]
  },
  "sourceFile": ".\/source.jpg",
  "destinationFile": ".\/destination.jpg"
}`

# Builder Markup String #

`ImageMarkupCall` supports a semicolon-separated Markup string for more compact drawing instruction specification.

- The string does **not** include `sourceFile` and `destinationFile` information like the JSON schema does, so that will need to be provided separately in command-line arguments.

Example:

`crop,330x330,2588x1941;circle,1921x466,70,black;rectangle,369x973,131x131,red;rectangle,1602x605,131x131,black`

## Specification ##

`crop,[x],[y],[width]x[height]`

`circle,[x],[y],[radius],[color]`

`rectangle,[x],[y],[width]x[height],[color]`
