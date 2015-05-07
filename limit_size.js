module.exports = {
   _minSize: function() {
      if (!this.sizeLimits || !this.sizeLimits[0] || !this.canvas)
         return false;

      return this.sizeLimits[0] * this._canvasSize();
   },

   _maxSize: function() {
      if (!this.sizeLimits || !this.sizeLimits[1] || !this.canvas)
         return false;

      return this.sizeLimits[1] * this._canvasSize();
   },

   _canvasSize: function() {
      return Math.max(this.canvas.width, this.canvas.height);
   },

   _withSizeLimitations: function(callback, skipMax) {
      this._limitSize = true;
      this._skipMax = skipMax;
      callback.apply(this);
      this._skipMax = false;
      this._limitSize = false;
   },

   _set: function(key, value) {
      var newValue = value;
      if (key === 'scaleX') {
         if (this._limitByDiagonal) {
            if (this._exceedsDiagonalLimit(value, this.scaleY)) {
               return this;
            }
         } else {
            var newWidth = this.width * value;
            newValue = this._limitDimension(newWidth) / this.width;
         }
      } else if (key === 'scaleY') {
         if (this._limitByDiagonal) {
            if (this._exceedsDiagonalLimit(this.scaleX, value)) {
               return this;
            }
         } else {
            var newHeight = this.height * value;
            newValue = this._limitDimension(newHeight) / this.height;
         }
      }

      return this.callParent(key, newValue);
   },

   /**
    * Returns true if the given scale values would cause this shape to exceed
    * the min/max diagonal size.
    *
    * When this returns true, the shape will have already been scaled to the
    * min / max size and attempted _set() call should not be passed on to the
    * parent class.
    */
   _exceedsDiagonalLimit: function(scaleX, scaleY) {
      if (!this._shouldLimit()) {
         return;
      }
      var w = this.width * scaleX;
      var h = this.height * scaleY;
      var rad = Math.sqrt(w * w + h * h);
      var clampedRad = this._limitDimension(rad);
      if (rad !== clampedRad) {
         var ratio = clampedRad / rad;
         // Use callSuper() here to bypass the _set() function we implemented
         // above.
         this.callSuper('_set', 'scaleX', scaleX * ratio);
         this.callSuper('_set', 'scaleY', scaleY * ratio);
         return true;
      }
   },

   _limitDimension: function(x) {
      if (!this._shouldLimit()) {
         return x;
      }

      var min = this._minSize();
      var max = this._skipMax ? false : this._maxSize();

      if (min !== false) {
         // Sometimes we have to limit negative values too (see: scaleX)
         if (Math.abs(x) < min)
            return x >= 0 ? min : -min;
      }

      if (max !== false) {
         if (Math.abs(x) > max)
            return x >= 0 ? max : -max;
      }
      return x;
   },

   _shouldLimit: function() {
      // The _isMoving condition seems backwards. It's because fabric has it
      // on during scaling *and* moving but fires this a few times with
      // isMoving off during an actual move.
      return this._limitSize || this.isMoving;
   }
};

