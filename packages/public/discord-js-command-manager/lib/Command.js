"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CommandBase = exports.ParseArgsResultCodes = exports.CommandExecuteResultCodes = exports.ArgsPatternTypes = exports.DiscordPermissions = void 0;

var _iterator = _interopRequireDefault(require("@babel/runtime/core-js/symbol/iterator"));

var _symbol = _interopRequireDefault(require("@babel/runtime/core-js/symbol"));

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _create = _interopRequireDefault(require("@babel/runtime/core-js/object/create"));

var _setPrototypeOf = _interopRequireDefault(require("@babel/runtime/core-js/object/set-prototype-of"));

var _lodash = require("lodash");

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

var DiscordPermissions;
exports.DiscordPermissions = DiscordPermissions;

(function (DiscordPermissions) {
  DiscordPermissions["CREATE_INSTANT_INVITE"] = "CREATE_INSTANT_INVITE";
  DiscordPermissions["KICK_MEMBERS"] = "KICK_MEMBERS";
  DiscordPermissions["BAN_MEMBERS"] = "BAN_MEMBERS";
  DiscordPermissions["ADMINISTRATOR"] = "ADMINISTRATOR";
  DiscordPermissions["MANAGE_CHANNELS"] = "MANAGE_CHANNELS";
  DiscordPermissions["MANAGE_GUILD"] = "MANAGE_GUILD";
  DiscordPermissions["ADD_REACTIONS"] = "ADD_REACTIONS";
  DiscordPermissions["VIEW_AUDIT_LOG"] = "VIEW_AUDIT_LOG";
  DiscordPermissions["VIEW_CHANNEL"] = "VIEW_CHANNEL";
  DiscordPermissions["SEND_MESSAGES"] = "SEND_MESSAGES";
  DiscordPermissions["SEND_TTS_MESSAGES"] = "SEND_TTS_MESSAGES";
  DiscordPermissions["MANAGE_MESSAGES"] = "MANAGE_MESSAGES";
  DiscordPermissions["EMBED_LINKS"] = "EMBED_LINKS";
  DiscordPermissions["ATTACH_FILES"] = "ATTACH_FILES";
  DiscordPermissions["READ_MESSAGE_HISTORY"] = "READ_MESSAGE_HISTORY";
  DiscordPermissions["MENTION_EVERYONE"] = "MENTION_EVERYONE";
  DiscordPermissions["USE_EXTERNAL_EMOJIS"] = "USE_EXTERNAL_EMOJIS";
  DiscordPermissions["CONNECT"] = "CONNECT";
  DiscordPermissions["SPEAK"] = "SPEAK";
  DiscordPermissions["MUTE_MEMBERS"] = "MUTE_MEMBERS";
  DiscordPermissions["DEAFEN_MEMBERS"] = "DEAFEN_MEMBERS";
  DiscordPermissions["MOVE_MEMBERS"] = "MOVE_MEMBERS";
  DiscordPermissions["USE_VAD"] = "USE_VAD";
  DiscordPermissions["CHANGE_NICKNAME"] = "CHANGE_NICKNAME";
  DiscordPermissions["MANAGE_NICKNAMES"] = "MANAGE_NICKNAMES";
  DiscordPermissions["MANAGE_ROLES"] = "MANAGE_ROLES";
  DiscordPermissions["MANAGE_WEBHOOKS"] = "MANAGE_WEBHOOKS";
  DiscordPermissions["MANAGE_EMOJIS"] = "MANAGE_EMOJIS";
})(DiscordPermissions || (exports.DiscordPermissions = DiscordPermissions = {}));

var ArgsPatternTypes;
exports.ArgsPatternTypes = ArgsPatternTypes;

(function (ArgsPatternTypes) {
  ArgsPatternTypes["ROLE"] = "Role";
  ArgsPatternTypes["CHANNEL"] = "Channel";
  ArgsPatternTypes["NUMBER"] = "Number";
  ArgsPatternTypes["STRING"] = "String";
  ArgsPatternTypes["USER"] = "User";
  ArgsPatternTypes["BOOLEAN"] = "Boolean"; // TODO: Implement
})(ArgsPatternTypes || (exports.ArgsPatternTypes = ArgsPatternTypes = {}));

var CommandExecuteResultCodes;
exports.CommandExecuteResultCodes = CommandExecuteResultCodes;

(function (CommandExecuteResultCodes) {
  CommandExecuteResultCodes["SUCCESS"] = "SUCCESS";
  CommandExecuteResultCodes["INVALID"] = "INVALID";
  CommandExecuteResultCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
})(CommandExecuteResultCodes || (exports.CommandExecuteResultCodes = CommandExecuteResultCodes = {}));

var ParseArgsResultCodes;
exports.ParseArgsResultCodes = ParseArgsResultCodes;

(function (ParseArgsResultCodes) {
  ParseArgsResultCodes["INVALID_COMMAND_FORMAT"] = "INVALID_COMMAND_FORMAT";
  ParseArgsResultCodes["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
  ParseArgsResultCodes["MISSING_ARGS"] = "MISSING_ARGS";
  ParseArgsResultCodes["SUCCESS"] = "SUCCESS";
})(ParseArgsResultCodes || (exports.ParseArgsResultCodes = ParseArgsResultCodes = {}));

var ARGS_REGEX = /"[^"]+"|'[^']+'|`[^`]+`|“[^“]+“|’[^’]+’|\S+/g;
var ARGS_PATTERN_REGEX = /\{(([a-zA-Z0-9]+):([a-zA-Z0-9]+))+\}/g;
var ARGS_PATTERN_ITEM_REGEX = /\{([a-zA-Z0-9]+):([a-zA-Z0-9]+)\}/;
var USER_ARG_REGEX = /^<@(\d+)>$/;
var ROLE_MENTION_ARG_REGEX = /^<@&(\d+)>$/;
var CHANNEL_ARG_REGEX = /^<#(\d+)>$/;
var STRING_ARG_REGEX = /^"([^"]+)"|'([^']+)'|`([^`]+)`|’([^’]+)’|“([^“]+)“|(\S+)$/;

var CommandBase =
/** @class */
function () {
  function CommandBase(_a) {
    var keyword = _a.keyword,
        prefix = _a.prefix,
        message = _a.message;

    var _this = this;

    this.argTypeParsers = (_b = {}, _b[ArgsPatternTypes.NUMBER] = function (value) {
      var res = Number(value);

      if (isNaN(res)) {
        return {
          code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
        };
      }

      return {
        code: ParseArgsResultCodes.SUCCESS,
        data: res
      };
    }, _b[ArgsPatternTypes.STRING] = function (value) {
      // TODO: Prevent mentions here
      return {
        code: ParseArgsResultCodes.SUCCESS,
        data: value
      };
    }, _b[ArgsPatternTypes.CHANNEL] = function (value) {
      var match = value.match(CHANNEL_ARG_REGEX);
      if (!match) return {
        code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
      };
      var id = match[1];

      if (!id) {
        return {
          code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
        };
      }

      var channel = _this.message.mentions.channels.get(id);

      if (!channel) {
        console.warn("Unexpected case ocurred: Channel is mentioned in a message, but message has no such channel in the messageMentions collection");
        return {
          code: ParseArgsResultCodes.RESOURCE_NOT_FOUND
        };
      }

      return {
        code: ParseArgsResultCodes.SUCCESS,
        data: channel
      };
    }, _b[ArgsPatternTypes.ROLE] = function (value) {
      var match = value.match(ROLE_MENTION_ARG_REGEX); // Match by mention

      if (match) {
        var id = match[1];

        if (!id) {
          return {
            code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
          };
        }

        var role_1 = _this.message.mentions.roles.get(id);

        if (!role_1) {
          console.warn("Unexpected case ocurred: Role is mentioned in a message, but message has no such role in the messageMentions collection");
          return {
            code: ParseArgsResultCodes.RESOURCE_NOT_FOUND
          };
        }

        return {
          code: ParseArgsResultCodes.SUCCESS,
          data: role_1
        };
      } // Match by name


      var role = _this.message.guild.roles.find('name', value);

      if (role) {
        return {
          code: ParseArgsResultCodes.SUCCESS,
          data: role
        };
      }

      return {
        code: ParseArgsResultCodes.RESOURCE_NOT_FOUND,
        argValue: value
      };
    }, _b[ArgsPatternTypes.USER] = function (value) {
      // TODO: Support strings
      var match = value.match(USER_ARG_REGEX);
      if (!match) return {
        code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
      };
      var id = match[1];

      if (!id) {
        return {
          code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
        };
      }

      var user = _this.message.mentions.users.get(id);

      if (!user) {
        console.warn("Unexpected case ocurred: User is mentioned in a message, but message has no such user in the messageMentions collection");
        return {
          code: ParseArgsResultCodes.RESOURCE_NOT_FOUND
        };
      }

      return {
        code: ParseArgsResultCodes.SUCCESS,
        data: user
      };
    }, _b[ArgsPatternTypes.BOOLEAN] = function (value) {
      var normalizedValue = value.toLocaleLowerCase();

      if (normalizedValue === 'true') {
        return {
          code: ParseArgsResultCodes.SUCCESS,
          data: true
        };
      }

      if (normalizedValue === 'false') {
        return {
          code: ParseArgsResultCodes.SUCCESS,
          data: true
        };
      }

      return {
        code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
      };
    }, _b);

    this.sendInvalidCommandFormatError = function () {
      _this.message.channel.send("Invalid command format for command: " + _this.prefix + _this.keyword);
    };

    this.sendMissingArgsError = function () {
      _this.message.channel.send("Missing arguments for command: " + _this.prefix + _this.keyword);
    };

    this.sendArgsResourceNotFound = function (_a) {
      var argName = _a.argName,
          argType = _a.argType,
          argValue = _a.argValue;
      var valueString = argValue ? " with value \"" + argValue + "\"" : '';

      _this.message.channel.send("Could not find " + argType + " (" + argName + ")" + valueString);
    };

    this.sendUnauthorizedMessage = function () {
      _this.message.channel.send('You are not allowed to run this command');
    };

    this.parseArgs = function () {
      var ChildClass = _this.constructor;

      var argsText = _this.message.content.replace("" + _this.prefix + _this.keyword, '');

      var argsSchema = ChildClass.argsSchema;
      var argsMatch = argsText.match(ARGS_REGEX);

      if (argsMatch && !ChildClass.argsPattern) {
        return {
          code: ParseArgsResultCodes.INVALID_COMMAND_FORMAT
        };
      }

      if (argsMatch === null) {
        if (ChildClass.argsPattern) {
          return {
            code: ParseArgsResultCodes.MISSING_ARGS
          };
        }

        return {
          code: ParseArgsResultCodes.SUCCESS
        };
      }

      if (argsMatch.length < (0, _lodash.keys)(argsSchema).length) {
        return {
          code: ParseArgsResultCodes.MISSING_ARGS
        };
      }

      var parsedArgs = {};
      var invalidArgData = {};
      (0, _lodash.every)(argsSchema, function (argType, argName) {
        var argMatch = argsMatch.shift();
        var strippedMatch;
        var quotedMatch = argMatch.match(STRING_ARG_REGEX);

        if (quotedMatch) {
          quotedMatch.shift();
          strippedMatch = (0, _lodash.find)(quotedMatch, function (val) {
            return !!val;
          });
        }

        argMatch = strippedMatch ? strippedMatch : argMatch;

        var parseResult = _this.argTypeParsers[argType](argMatch);

        if (parseResult.code !== ParseArgsResultCodes.SUCCESS) {
          invalidArgData = {
            code: parseResult.code,
            argName: argName,
            argType: argType,
            argValue: parseResult.argValue
          };
          return false;
        }

        parsedArgs[argName] = parseResult.data;
        return true;
      });

      if (invalidArgData.code) {
        return {
          code: invalidArgData.code,
          argName: invalidArgData.argName,
          argType: invalidArgData.argType,
          argValue: invalidArgData.argValue
        };
      }

      _this.args = parsedArgs;
      return {
        code: ParseArgsResultCodes.SUCCESS
      };
    };

    this.parseArgsPattern = function () {
      var argsPattern = _this.constructor.argsPattern;
      if (!argsPattern) return;
      var match = argsPattern.match(ARGS_PATTERN_REGEX);
      var argsPatternMatch = argsPattern.match(ARGS_PATTERN_REGEX);

      if (argsPatternMatch === null) {
        throw new Error("argsPattern \"" + argsPattern + "\" is invalid");
      }

      if (!match) {
        throw new Error("'argsPattern' \"" + argsPattern + "\" '" + _this.constructor.getName() + "' is invalid");
      }

      (0, _lodash.each)(match, function (item) {
        var itemMatch = item.match(ARGS_PATTERN_ITEM_REGEX);

        if (!itemMatch) {
          throw new Error("'argsPattern' argument \"" + item + "\" in '" + _this.constructor.getName() + "' is invalid");
        }

        var argName = itemMatch[1];
        var argType = itemMatch[2];
        _this.constructor.argsSchema[argName] = argType;
      });
    };

    this.validatePermissions = function () {
      var permissionsRequired = _this.constructor.permissionsRequired;

      if (!(0, _lodash.isArray)(permissionsRequired) || !permissionsRequired.length) {
        return true;
      }

      if (!_this.message.member) {
        throw new Error("\n        >> Cannot validate permissions.\n        Member from author '" + _this.message.author.username + "' was not found in message. Defaulting to invalid.");
      }

      return _this.message.member && _this.message.member.hasPermission(permissionsRequired);
    };

    this.ignoreIfPrivateIsDisabled = function () {
      var directMessage = _this.constructor.directMessage;
      return !!directMessage && !!_this.message.guild || !directMessage && !_this.message.guild;
    };

    this.runErrorHandler = function (error) {
      return __awaiter(_this, void 0, void 0, function () {
        var handled, errorHandler;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              handled = false;
              errorHandler = this.onError;
              return [4
              /*yield*/
              , errorHandler ? errorHandler(error) : _promise.default.resolve(false)];

            case 1:
              handled = _a.sent();
              return [2
              /*return*/
              , handled];
          }
        });
      });
    };

    this.execute = function () {
      return __awaiter(_this, void 0, void 0, function () {
        var shouldIgnore, hasPermissions, _a, code, argName, argType, argValue, name_1, type, res;

        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              shouldIgnore = this.ignoreIfPrivateIsDisabled();

              if (shouldIgnore) {
                return [2
                /*return*/
                , {
                  code: CommandExecuteResultCodes.INVALID
                }];
              }

              hasPermissions = this.validatePermissions();

              if (!hasPermissions) {
                this.sendUnauthorizedMessage();
                return [2
                /*return*/
                , {
                  code: CommandExecuteResultCodes.UNAUTHORIZED
                }];
              }

              this.parseArgsPattern();
              _a = this.parseArgs(), code = _a.code, argName = _a.argName, argType = _a.argType, argValue = _a.argValue;
              if (!!hasPermissions) return [3
              /*break*/
              , 2];
              return [4
              /*yield*/
              , this.sendUnauthorizedMessage()];

            case 1:
              _b.sent();

              return [2
              /*return*/
              , {
                code: CommandExecuteResultCodes.UNAUTHORIZED
              }];

            case 2:
              if (code !== ParseArgsResultCodes.SUCCESS) {
                switch (code) {
                  case ParseArgsResultCodes.INVALID_COMMAND_FORMAT:
                    {
                      this.sendInvalidCommandFormatError();
                      return [2
                      /*return*/
                      , {
                        code: CommandExecuteResultCodes.INVALID
                      }];
                    }

                  case ParseArgsResultCodes.RESOURCE_NOT_FOUND:
                    {
                      name_1 = argName || 'Unknown';
                      type = argType;
                      this.sendArgsResourceNotFound({
                        argName: name_1,
                        argType: type,
                        argValue: argValue
                      });
                      return [2
                      /*return*/
                      , {
                        code: CommandExecuteResultCodes.INVALID
                      }];
                    }

                  case ParseArgsResultCodes.MISSING_ARGS:
                    {
                      this.sendMissingArgsError();
                      return [2
                      /*return*/
                      , {
                        code: CommandExecuteResultCodes.INVALID
                      }];
                    }
                }
              }

              return [4
              /*yield*/
              , this.run(this.message, this.args)];

            case 3:
              res = _b.sent();
              return [2
              /*return*/
              , {
                code: CommandExecuteResultCodes.SUCCESS,
                data: res
              }];
          }
        });
      });
    };

    this.prefix = prefix;
    this.message = message;
    this.keyword = keyword;
    this.args = {};
    var ChildClass = this.constructor;
    ChildClass.argsSchema = {};

    if (!ChildClass.keywords) {
      throw new Error("'keywords' is not defined in Command '" + ChildClass.getName() + "'");
    }

    var _b;
  }

  CommandBase.getName = function () {
    return this.name;
  };

  CommandBase.directMessage = false;
  return CommandBase;
}();

exports.CommandBase = CommandBase;

var Command =
/** @class */
function (_super) {
  __extends(Command, _super);

  function Command() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  return Command;
}(CommandBase);

var _default = Command; //# sourceMappingURL=Command.js.map

exports.default = _default;