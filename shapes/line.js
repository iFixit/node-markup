var Fabric = require("fabric").fabric;
var mixin = require("../src/mixin");

var Line = Fabric.util.createClass(Fabric.Line, {
  type: "line",
  lockRotation: true,
  transparentCorners: false,
  fill: "transparent",
  objectCaching: false,

  // New fields.
  shapeName: "line",
  sizeLimits: [0.04, 0.4],

  render: function (ctx) {
    const offFactor = this.borderWidth / 2.0;

    this.top -= offFactor;
    this.left -= offFactor;

    this.callSuper("render", ctx);
  },
});

var proto = Line.prototype;
mixin(proto, require("../mixins/clone.mixin"));
mixin(proto, require("../mixins/highlighted_stroke.mixin"));
mixin(proto, require("../mixins/limit_size"));
mixin(proto, require("../mixins/nudge"));
mixin(proto, require("../mixins/two_point_interactivity"));

// Overrides the method from the to_object.mixin beccause the
// constructor of Line is differen than the rest of the shapes.
proto.clone = function () {
  var obj = this.toObject();
  var points = [obj.x1, obj.y1, obj.x2, obj.y2];
  return new this.constructor(points, obj);
};

module.exports.klass = Line;
