var Fabric = require('fabric').fabric || fabric;
var extend = Fabric.util.object.extend;
var mixin = require('./mixin');

var Circle = Fabric.util.createClass(Fabric.Circle, {
   // Inherited variables with new values.
   type: 'circle',
   padding: 5,
   originX: 'center',
   originY: 'center',
   lockRotation: true,
   lockUniScaling: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   lockUniScaling: true,
   fill: 'transparent',
   centerTransform: true,

   // New fields.
   shapeName: 'circle',
   color: 'red',
   // Min and Max size to enforce (false == no enforcement)
   minSize: false,
   maxSize: false,

   /**
    * Resizes this shape using the two mouse coords (first is treated as the
    * center, second is the outside edge.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      var xdiff = x2 - this.left;
      var ydiff = y2 - this.top;
      var radius = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
      this.scaleToWidth(this._limitDimension(radius * 2));
      this.setCoords();
   },

   /**
    * Increment the size of the circle about its center.
    */
   incrementSize: function(increment) {
      this.scaleToWidth(this.currentWidth + increment);
      this.setCoords();
   },

   toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
         color: this.color,
         minSize: this.minSize,
         maxSize: this.maxSize,
         borderWidth: this.borderWidth,
         stroke: this.stroke,
         shapeName: this.shapeName,
         outlineWidth: this.outlineWidth,
         outlineStyle: this.outlineStyle
      });
   }
});

var proto = Circle.prototype;
mixin(proto, require('./highlighted_stroke.mixin'));
mixin(proto, require('./limit_size'));
mixin(proto, require('./nudge'));


Circle.fromObject = function(object) {
   return new Circle(object);
};


module.exports.klass = Circle;
