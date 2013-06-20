var Fabric = require('fabric').fabric || fabric;

module.exports.klass = Fabric.util.createClass(Fabric.Circle, {
   type: 'circle',
   strokeWidth: 0,
   borderWidth: 4,
   padding: 5,
   originX: 'center',
   originY: 'center',

   // Min and Max size to enforce (false == no enforcement)
   minSize: false,
   maxSize: false,

   centerTransform: true,

   outlineWidth: 1,
   outlineStyle: '#FFF',

   _stroke: function(ctx) {
      var myScale = this.scaleX;
      function scaleU(x) { return x / myScale; }
      ctx.lineWidth = scaleU(this.borderWidth + this.outlineWidth);
      ctx.strokeStyle = this.outlineStyle;
      ctx.stroke();

      ctx.lineWidth = scaleU(this.borderWidth - this.outlineWidth);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
   },

   render: function(ctx) {
      this._limitSize();
      this.callSuper('render', ctx);
   },

   _limitSize: function() {
      var newRadius = this.getRadiusX();

      if (this.minSize !== false && newRadius < this.minSize) {
         this.scaleX = this.scaleY = this.minSize / this.radius;
      } else if (this.maxSize !== false && newRadius > this.maxSize) {
         this.scaleX = this.scaleY = this.maxSize / this.radius;
      }
   }
});

