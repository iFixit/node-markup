var Fabric = require('fabric').fabric;
var mixin = require('./src/mixin');

var Arrow = Fabric.util.createClass(require('./shape_line').klass, {
   type: 'arrow',
   shapeName: 'arrow',

   _stroke: function(ctx) {
      var angle = this._getAngle();
      var rad = this._getLength();
      var canvasSize = this._canvasSize();

      var size = Math.min(canvasSize / 20, (rad / 10) + canvasSize / 80);
      var headWidthRadians = Math.PI / 6;
      var x  = Math.cos(angle - headWidthRadians) * size;
      var y  = Math.sin(angle - headWidthRadians) * size;
      var x2 = Math.cos(angle + headWidthRadians) * size;
      var y2 = Math.sin(angle + headWidthRadians) * size;
      ctx.translate(-this._getDeltaX() / 2, -this._getDeltaY() / 2);
      ctx.moveTo(x, y);
      ctx.lineTo(0, 0);
      ctx.lineTo(x2, y2);

      this.callSuper('_stroke', ctx);
   }
});

module.exports.klass = Arrow;
