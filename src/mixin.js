function Mixin(proto, properties) {
  for (const property in properties) {
    const value = properties[property];
    if (proto[property] && typeof value == "function") {
      inherit(proto, property, value);
    } else {
      proto[property] = value;
    }
  }
}

function inherit(proto, property, func) {
  const parentFunc = proto[property];
  proto[property] = function () {
    const old = this.callParent;
    this.callParent = parentFunc;
    const ret = func.apply(this, arguments);
    if (old) {
      this.callParent = old;
    }
    return ret;
  };
}

module.exports = Mixin;
