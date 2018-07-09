"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _create = _interopRequireDefault(require("@babel/runtime/core-js/object/create"));

var _setPrototypeOf = _interopRequireDefault(require("@babel/runtime/core-js/object/set-prototype-of"));

var __extends = void 0 && (void 0).__extends || function () {
  var extendStatics = _setPrototypeOf.default || {
    __proto__: []
  } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };

  return function (d, b) {
    extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? (0, _create.default)(b) : (__.prototype = b.prototype, new __());
  };
}();

var CommandManagerError =
/** @class */
function (_super) {
  __extends(CommandManagerError, _super);

  function CommandManagerError(error, data) {
    var _this = _super.call(this, error.message) || this;

    _this.name = 'CommandManagerError';
    _this.data = data || {};
    _this.path = error.path;
    _this.code = error.code;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(_this, _this.constructor);
    } else {
      _this.stack = new Error(error.message).stack;
    }

    return _this;
  }

  return CommandManagerError;
}(Error);

var _default = CommandManagerError; //# sourceMappingURL=CommandRuntimeError.js.map

exports.default = _default;