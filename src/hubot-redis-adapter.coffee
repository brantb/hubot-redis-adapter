{Adapter, TextMessage, User} = require 'hubot'
NodeRedisPubsub = require 'node-redis-pubsub'
Url = require 'url'
Log = require 'log'

class RedisAdapter extends Adapter
  constructor: (@robot) ->
    super @robot
    @log = new Log process.env.HUBOT_REDISADAPTER_LOG or 'info'
    @robot.on 'error', (err, msg) =>
      @log.error err
      @log.error msg if msg

  run: ->
    @log.info 'Initializing Redis adapter'
    redisUrl = Url.parse process.env.HUBOT_REDISADAPTER_URL or 'redis://localhost:6379'
    pubsubOpts =
      host: redisUrl.hostname
      port: redisUrl.port
      auth: redisUrl.auth
      scope: process.env.HUBOT_REDISADAPTER_SCOPE or 'hubot-redis-adapter'
    @pubsub = new NodeRedisPubsub pubsubOpts
    @pubsub.on 'receive', @onReceive, =>
      @log.info "Redis adapter initialized and waiting for messages on #{pubsubOpts.scope}:receive"
      @emit 'connected'

  send: (envelope, strings...) =>
    @log.debug 'Sending message to Redis:'
    @log.debug JSON.stringify(envelope)
    @log.debug strings
    @pubsub.emit "send-to-room:#{envelope.room}",
      envelope: envelope, strings: strings

  topic: (envelope, strings...) =>
    @pubsub.emit 'topic', envelope: envelope, strings: strings

  reply: (envelope, strings...) =>
    @pubsub.emit 'reply', envelope: envelope, strings: strings

  onReceive: (data) =>
    @log.debug "Received message from Redis: #{JSON.stringify(data)}"
    message = @deserialize data
    @log.debug "Passing message to bot: #{JSON.stringify(message)}"
    @receive message

  deserialize: (data) ->
    # Load user from brain
    userId = data.userId or "unknown user"
    userName = data.userName or userId
    userOptions =
      name: data.userName or userId
      room: data.room or "unknown room"
    user = @robot.brain.userForId userId, userOptions

    # Create message
    # TODO deserialize other messageTypes
    switch data.messageType
      when 'TextMessage' then new TextMessage user, data.text, data.messageId
      else @log.warn "Couldn't deserialize message: #{JSON.stringify(message)}"

exports.use = (robot) ->
  new RedisAdapter robot

