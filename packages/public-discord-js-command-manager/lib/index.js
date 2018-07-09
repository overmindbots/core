"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime/core-js/object/define-property");

var _Object$keys = require("@babel/runtime/core-js/object/keys");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  Command: true,
  CommandManager: true,
  CommandRuntimeError: true
};
Object.defineProperty(exports, "Command", {
  enumerable: true,
  get: function () {
    return _Command.default;
  }
});
Object.defineProperty(exports, "CommandManager", {
  enumerable: true,
  get: function () {
    return _CommandManager.default;
  }
});
Object.defineProperty(exports, "CommandRuntimeError", {
  enumerable: true,
  get: function () {
    return _CommandRuntimeError.default;
  }
});
exports.default = void 0;

var _Command = _interopRequireDefault(require("./Command"));

_Object$keys(_Command).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;

  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Command[key];
    }
  });
});

var _CommandManager = _interopRequireDefault(require("./CommandManager"));

_Object$keys(_CommandManager).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;

  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _CommandManager[key];
    }
  });
});

var _CommandRuntimeError = _interopRequireDefault(require("./CommandRuntimeError"));

// TODO: Add default args for commands
// TODO: Fix typings
var _default = {
  Command: _Command.default,
  CommandManager: _CommandManager.default,
  CommandRuntimeError: _CommandRuntimeError.default
}; //# sourceMappingURL=index.js.map

exports.default = _default;