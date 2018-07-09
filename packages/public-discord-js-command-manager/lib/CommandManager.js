"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ProcessMessageResultCodes = void 0;

var _iterator = _interopRequireDefault(require("@babel/runtime/core-js/symbol/iterator"));

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _lodash = require("lodash");

var _Command = require("./Command");

var _CommandRuntimeError = _interopRequireDefault(require("./CommandRuntimeError"));

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = _promise.default))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = void 0 && (void 0).__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function () {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof _symbol.default === "function" && (g[_iterator.default] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) try {
      if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [0, t.value];

      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;

        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };

        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;

        case 7:
          op = _.ops.pop();

          _.trys.pop();

          continue;

        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }

          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }

          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }

          if (t && _.label < t[2]) {
            _.label = t[2];

            _.ops.push(op);

            break;
          }

          if (t[2]) _.ops.pop();

          _.trys.pop();

          continue;
      }

      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var ProcessMessageResultCodes;
exports.ProcessMessageResultCodes = ProcessMessageResultCodes;

(function (ProcessMessageResultCodes) {
  ProcessMessageResultCodes["FINISHED"] = "FINISHED";
  ProcessMessageResultCodes["ERROR_HANDLED"] = "ERROR_HANDLED";
  ProcessMessageResultCodes["INVALID"] = "INVALID";
  ProcessMessageResultCodes["NON_COMMAND"] = "NON_COMMAND";
  ProcessMessageResultCodes["NO_COMMAND_MATCH"] = "NO_COMMAND_MATCH";
  ProcessMessageResultCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
})(ProcessMessageResultCodes || (exports.ProcessMessageResultCodes = ProcessMessageResultCodes = {}));

var FORBIDDEN_PREFIXES = ['@', '#', '"'];
var KEYWORD_PATTERN = /^\S{1}(\S+)/;

var CommandManager =
/** @class */
function () {
  function CommandManager(_a) {
    var prefix = _a.prefix;

    var _this = this;

    this.messageIsCommand = function (message, prefixOverride) {
      var prefix = prefixOverride || _this.prefix;
      var content = message.content,
          author = message.author;
      var startsWithPrefix = content.startsWith(prefix);
      if (author.bot) return false;
      if (!startsWithPrefix) return false;
      return true;
    };

    this.getKeyword = function (message) {
      var match = message.content.match(KEYWORD_PATTERN);
      if (!match) return null;
      var keyword = match[1];
      return keyword;
    };

    this.identify = function (message) {
      var keyword = _this.getKeyword(message);

      var commandName = (0, _lodash.find)(_this.keywords, function (_, savedKeyword) {
        return savedKeyword === keyword;
      });
      if (!commandName) return;
      var CommandClass = _this.commands[commandName];
      return CommandClass;
    };

    this.processMessage = function (message, opts) {
      return __awaiter(_this, void 0, void 0, function () {
        var prefixOverride, prefix, CommandClass, keyword, command, res, err_1, error, handled;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              prefixOverride = opts && opts.prefix;
              prefix = prefixOverride || this.prefix;

              if ((0, _lodash.includes)(FORBIDDEN_PREFIXES, prefix)) {
                throw new Error("The prefix '" + prefixOverride + "' is forbidden");
              }

              if (!this.messageIsCommand(message, prefix)) {
                return [2
                /*return*/
                , {
                  code: ProcessMessageResultCodes.NON_COMMAND
                }];
              }

              CommandClass = this.identify(message);

              if (!CommandClass) {
                return [2
                /*return*/
                , {
                  code: ProcessMessageResultCodes.NO_COMMAND_MATCH
                }];
              }

              keyword = this.getKeyword(message);
              command = new CommandClass({
                message: message,
                keyword: keyword,
                prefix: prefix
              });
              _a.label = 1;

            case 1:
              _a.trys.push([1, 3,, 5]);

              return [4
              /*yield*/
              , command.execute()];

            case 2:
              res = _a.sent();
              return [3
              /*break*/
              , 5];

            case 3:
              err_1 = _a.sent();
              error = new _CommandRuntimeError.default(err_1, {
                command: command
              });
              return [4
              /*yield*/
              , command.runErrorHandler(error)];

            case 4:
              handled = _a.sent();

              if (handled) {
                return [2
                /*return*/
                , {
                  code: ProcessMessageResultCodes.ERROR_HANDLED,
                  data: error
                }];
              }

              throw error;

            case 5:
              switch (res.code) {
                case _Command.CommandExecuteResultCodes.INVALID:
                  {
                    return [2
                    /*return*/
                    , {
                      code: ProcessMessageResultCodes.INVALID,
                      data: res.data
                    }];
                  }

                case _Command.CommandExecuteResultCodes.UNAUTHORIZED:
                  {
                    return [2
                    /*return*/
                    , {
                      code: ProcessMessageResultCodes.UNAUTHORIZED,
                      data: res.data
                    }];
                  }

                case _Command.CommandExecuteResultCodes.SUCCESS:
                  {
                    return [2
                    /*return*/
                    , {
                      code: ProcessMessageResultCodes.FINISHED,
                      data: res.data
                    }];
                  }
              }

              return [2
              /*return*/
              , {
                code: ProcessMessageResultCodes.ERROR_HANDLED,
                data: res.data
              }];
          }
        });
      });
    };

    this.registerCommand = function (CommandClass) {
      var commandName = CommandClass.getName();

      if (_this.commands[commandName]) {
        throw new Error("Command '" + commandName + "' is already registered.");
      }

      if (!CommandClass.keywords) {
        throw new Error("Command " + commandName + " must have static property 'keywords'");
      }

      var collidingKeyword = (0, _lodash.find)(CommandClass.keywords, function (keyword) {
        return (0, _lodash.includes)((0, _lodash.keys)(_this.keywords), keyword);
      });

      if (collidingKeyword) {
        throw new Error("Command \"" + commandName + "\" has keyword \"" + collidingKeyword + "\" which is already registered by another Command");
      }

      _this.commands[commandName] = CommandClass;
      (0, _lodash.each)(CommandClass.keywords, function (keyword) {
        _this.keywords[keyword] = CommandClass.name;
      });
    };

    if (!prefix) throw new Error('No prefix for commands was passed');

    if ((0, _lodash.includes)(FORBIDDEN_PREFIXES, prefix)) {
      throw new Error("The prefix " + prefix + " is forbidden");
    }

    this.prefix = prefix;
    this.keywords = {};
    this.commands = {};
  }

  return CommandManager;
}();

var _default = CommandManager; //# sourceMappingURL=CommandManager.js.map

exports.default = _default;