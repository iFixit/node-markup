var Fabric = require('fabric').fabric || fabric;
var isNode = typeof window == 'undefined';
var mixin = require('./mixin');

var Line = Fabric.util.createClass(Fabric.Line, {
   type: 'line',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   strokeLineCap: 'round',
   strokeLineJoin: 'round',
   fill: 'transparent',

   // New fields.
   shapeName: 'line',
   sizeLimits: [0.04, 0.4],
});

var proto = Line.prototype;
mixin(proto, require('./clone.mixin'));
mixin(proto, require('./highlighted_stroke.mixin'));
mixin(proto, require('./limit_size'));
mixin(proto, require('./nudge'));
mixin(proto, require('./two_point_interactivity'));

// Overrides the method from the to_object.mixin beccause the
// constructor of Line is differen than the rest of the shapes.
proto.clone = function() {
   var obj = this.toObject();
   var points = [obj.x1, obj.y1, obj.x2, obj.y2];
   return new this.constructor(points, obj);
};

module.exports.klass = Line;
