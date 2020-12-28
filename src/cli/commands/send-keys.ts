import { Command, command, params } from "clime";
import { KeyPress } from "../../socket/proc/remote-control";
import { RemoteOperation } from "../../socket/remote";

import { DeviceOptions } from "../options";

const nameToOp = Object.keys(RemoteOperation).reduce((m, name) => {
    // eslint-disable-next-line no-param-reassign
    m[name.toLowerCase()] = (RemoteOperation as any)[name] as RemoteOperation;
    return m;
}, {} as {[key: string]: RemoteOperation});

/** Public for testing */
export function parseKeys(keys: string[]): KeyPress[] {
    return keys.map(raw => {
        const [keyName, holdTimeString] = raw.split(":");
        const key = nameToOp[keyName.toLowerCase()];
        if (!key) {
            throw new Error(`Invalid key name: ${key}`);
        }

        if (holdTimeString) {
            const holdTimeMillis = parseInt(holdTimeString, 10);
            if (holdTimeMillis < 0) {
                throw new Error(`Hold time must not be negative: ${holdTimeMillis}`);
            }

            return {
                key,
                holdTimeMillis,
            };
        }

        return { key };
    });
}

@command({
    description: "Send a sequence of keys",
})
export default class extends Command {
    /* eslint-disable @typescript-eslint/indent */
    public async execute(
        @params({
            description: "The keys to send",
            required: true,
            type: String,
        })
        keys: string[],
        deviceSpec: DeviceOptions,
    ) {
        const keyPresses = parseKeys(keys);
        const device = await deviceSpec.findDevice();
        const connection = await device.openConnection();
        try {
            await connection.sendKeys(keyPresses);
        } finally {
            await connection.close();
        }
    }
}
