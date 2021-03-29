import { IPacket } from "../socket/model";

export enum RemotePlayCommand {
    Standby = 0x50,
    Login = 0x05,
    Heartbeat = 0x1fe,
}

export enum RemotePlayResponseType {
    Passcode = 0x4,
    Login = 0x05,
    Heartbeat = 0xfe,
}

export class RemotePlayIncomingPacket implements IPacket {
    constructor(
        public readonly type: number,
        private readonly buffer: Buffer,
    ) {}

    public toBuffer(): Buffer {
        return this.buffer;
    }
}

export class RemotePlayOutgoingPacket implements IPacket {
    constructor(
        public readonly type: number,
        private readonly payload?: Buffer,
    ) {}

    public toBuffer(): Buffer {
        const prelude = Buffer.alloc(8 + (this.payload?.length ?? 0));
        prelude.writeInt32LE(this.payload?.length ?? 0);
        prelude.writeInt16LE(this.type, 4);
        prelude.writeInt16LE(0, 6);

        return this.payload
            ? Buffer.concat([prelude, this.payload])
            : prelude;
    }
}
