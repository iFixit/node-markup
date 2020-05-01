var Fabric = require('fabric').fabric;
var extend = Fabric.util.object.extend;
var mixin = require('./mixin');

var Circle = Fabric.util.createClass(Fabric.Circle, {
   // Inherited variables with new values.
   type: 'circle',
   padding: 5,
   originX: 'center',
   originY: 'center',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   lockUniScaling: true,
   fill: 'transparent',
   centeredScaling: true,

   // New fields.
   shapeName: 'circle',
   color: 'red',
   sizeLimits: [0.03, 0.4],

   /**
    * Resizes this shape using the two mouse coords (first is treated as the
    * center, second is the outside edge.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      var xdiff = x2 - this.left;
      var ydiff = y2 - this.top;
      var radius = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
      var diameter = this._limitDimension(radius * 2);
      this.setRadius(diameter / 2);
      this.setCoords();
   }
});

var proto = Circle.prototype;
mixin(proto, require('./clone.mixin'));
mixin(proto, require('./highlighted_stroke.mixin'));
mixin(proto, require('./limit_size'));
mixin(proto, require('./nudge'));

/**
 * Increment the size of the circle about its center.
 * Note: At the end so it overwrites the one in the `nudge` mixin
 */
proto.incrementSize = function(increment) {
   var r = this.radius + increment / 2;
   this.setRadius(this._limitDimension(r * 2) / 2);
   this.setCoords();
};

module.exports.klass = Circle;
