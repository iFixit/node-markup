module.exports = {
   borderWidth: 4,
   strokeWidth: 0,
   outlineWidth: 1,
   outlineStyle: '#FFF',

   /**
    * Provide a custom stroke function that draws a fat white line THEN a
    * narrower colored line on top.
    */
   _stroke: function(ctx) {
      var myScale = this.scaleX;
      function scale(x) { return (x / myScale); }
      ctx.lineWidth = scale(this.borderWidth + this.outlineWidth);
      ctx.strokeStyle = this.outlineStyle;
      ctx.stroke();

      ctx.lineWidth = scale(this.borderWidth - this.outlineWidth);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
   }
};
