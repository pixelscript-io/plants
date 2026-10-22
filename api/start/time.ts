import { Settings } from 'luxon'

// SQLite stores timestamps as text with no zone. The code writes UTC, so read them back as UTC
// whatever the server's own time zone is (otherwise heartbeat ages and incident times shift).
Settings.defaultZone = 'utc'
