var Adapter, Log, NodeRedisPubsub, RedisAdapter, TextMessage, Url, User, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

_ref = require('hubot'), Adapter = _ref.Adapter, TextMessage = _ref.TextMessage, User = _ref.User;

NodeRedisPubsub = require('node-redis-pubsub');

Url = require('url');

Log = require('log');

RedisAdapter = (function(_super) {
  __extends(RedisAdapter, _super);

  function RedisAdapter(robot) {
    this.robot = robot;
    this.onReceive = __bind(this.onReceive, this);
    this.reply = __bind(this.reply, this);
    this.topic = __bind(this.topic, this);
    this.send = __bind(this.send, this);
    RedisAdapter.__super__.constructor.call(this, this.robot);
    this.log = new Log(process.env.HUBOT_REDISADAPTER_LOG || 'info');
    this.robot.on('error', (function(_this) {
      return function(err, msg) {
        _this.log.error(err);
        if (msg) {
          return _this.log.error(msg);
        }
      };
    })(this));
  }

  RedisAdapter.prototype.run = function() {
    var pubsubOpts, redisUrl;
    this.log.info('Initializing Redis adapter');
    redisUrl = Url.parse(process.env.HUBOT_REDISADAPTER_URL || 'redis://localhost:6379');
    pubsubOpts = {
      host: redisUrl.hostname,
      port: redisUrl.port,
      auth: redisUrl.auth,
      scope: process.env.HUBOT_REDISADAPTER_SCOPE || 'hubot-redis-adapter'
    };
    this.pubsub = new NodeRedisPubsub(pubsubOpts);
    return this.pubsub.on('receive', this.onReceive, (function(_this) {
      return function() {
        _this.log.info("Redis adapter initialized and waiting for messages on " + pubsubOpts.scope + ":receive");
        return _this.emit('connected');
      };
    })(this));
  };

  RedisAdapter.prototype.send = function() {
    var envelope, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this.log.debug('Sending message to Redis:');
    this.log.debug(JSON.stringify(envelope));
    this.log.debug(strings);
    return this.pubsub.emit("send-to-room:" + envelope.room, {
      envelope: envelope,
      strings: strings
    });
  };

  RedisAdapter.prototype.topic = function() {
    var envelope, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this.pubsub.emit('topic', {
      envelope: envelope,
      strings: strings
    });
  };

  RedisAdapter.prototype.reply = function() {
    var envelope, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this.pubsub.emit('reply', {
      envelope: envelope,
      strings: strings
    });
  };

  RedisAdapter.prototype.onReceive = function(data) {
    var message;
    this.log.debug("Received message from Redis: " + (JSON.stringify(data)));
    message = this.deserialize(data);
    this.log.debug("Passing message to bot: " + (JSON.stringify(message)));
    return this.receive(message);
  };

  RedisAdapter.prototype.deserialize = function(data) {
    var user, userId, userName, userOptions;
    userId = data.userId || "unknown user";
    userName = data.userName || userId;
    userOptions = {
      name: data.userName || userId,
      room: data.room || "unknown room"
    };
    user = this.robot.brain.userForId(userId, userOptions);
    switch (data.messageType) {
      case 'TextMessage':
        return new TextMessage(user, data.text, data.messageId);
      default:
        return this.log.warn("Couldn't deserialize message: " + (JSON.stringify(message)));
    }
  };

  return RedisAdapter;

})(Adapter);

exports.use = function(robot) {
  return new RedisAdapter(robot);
};

//# sourceMappingURL=hubot-redis-adapter.js.map
