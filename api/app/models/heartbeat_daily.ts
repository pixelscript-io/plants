import { HeartbeatDailySchema } from '#database/schema'

export default class HeartbeatDaily extends HeartbeatDailySchema {
  static table = 'heartbeat_daily'
}
