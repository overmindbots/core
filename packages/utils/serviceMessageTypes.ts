export enum ClientMsgTypes {
  HANDSHAKE = 'HANDSHAKE',
  SHARD_READY = 'SHARD_READY',
  REPORT_GUILD_CREATE = 'REPORT_GUILD_CREATE',
  REPORT_GUILD_DELETE = 'REPORT_GUILD_DELETE',
  SHARD_SHUTTING_DOWN = 'SHARD_SHUTTING_DOWN',
}
export enum ServerMsgTypes {
  HANDSHAKE = 'HANDSHAKE',
  TERMINATE = 'TERMINATE',
  LOG_TO_TEAM = 'LOG_TO_TEAM',
}

export interface ShardReadyClientMsg {
  type: ClientMsgTypes.SHARD_READY;
  payload: {
    guildCount: number;
    memberCount: number;
    hasTeamDiscord: boolean;
  };
}
export interface ShardShuttingDownClientMsg {
  type: ClientMsgTypes.SHARD_SHUTTING_DOWN;
  payload: {
    shardId?: number;
    podId: string;
  };
}
export interface HandshakeClientMsg {
  type: ClientMsgTypes.HANDSHAKE;
  payload: {
    podId: string;
    shardId?: number;
  };
}
export interface ReportGuildCreateClientMsg {
  type: ClientMsgTypes.REPORT_GUILD_CREATE;
  payload: {
    name: string;
    memberCount: number;
  };
}
export interface ReportGuildDeleteClientMsg {
  type: ClientMsgTypes.REPORT_GUILD_DELETE;
  payload: {
    name: string;
    memberCount: number;
  };
}

export interface HandshakeServerMsg {
  type: ServerMsgTypes.HANDSHAKE;
  payload: {
    shardId: number;
    totalShards: number;
  };
}
export interface TerminateServerMsg {
  type: ServerMsgTypes.TERMINATE;
}
export interface LogToTeamServerMsg {
  type: ServerMsgTypes.LOG_TO_TEAM;
  payload: string;
}

export type ServiceClientMessage =
  | ShardReadyClientMsg
  | ShardShuttingDownClientMsg
  | HandshakeClientMsg
  | ReportGuildCreateClientMsg
  | ReportGuildDeleteClientMsg;

export type ServiceServerMessage =
  | HandshakeServerMsg
  | TerminateServerMsg
  | LogToTeamServerMsg;
