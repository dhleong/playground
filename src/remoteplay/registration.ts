import _debug from "debug";
import got from "got";

import {
    IDiscoveredDevice,
} from "../discovery/model";
import { RemotePlayCrypto } from "./crypto";
import { RemotePlayVersion, remotePlayVersionFor, remotePlayVersionToString } from "./model";

const debug = _debug("playground:remoteplay:registration");

const REGISTRATION_PORT = 9295;

export interface IRemotePlayCredentials {
    accountId: string;
}

export interface IRemotePlayRegistrationCredentials extends IRemotePlayCredentials {
    pin: string;
}

export class RemotePlayRegistration {
    public async register(
        device: IDiscoveredDevice,
        credentials: IRemotePlayRegistrationCredentials,
    ) {
        const crypto = RemotePlayCrypto.forDeviceAndPin(device, credentials.pin);
        const body = crypto.createSignedPayload({
            "Client-Type": "Windows", // might be nice to use the actual
            "Np-AccountId": credentials.accountId,
        });

        const result = await got.post(this.urlFor(device), {
            body,
            headers: {
                "User-Agent": "remoteplay Windows",
                "RP-Version": this.versionFor(device),
            },
            responseType: "buffer",
        });

        debug("result headers:", result.headers);
        debug("result body:", result.body);

        const decoded = crypto.decrypt(result.body);
        debug("result decrypted:", decoded);

        return decoded;
    }

    private urlFor(device: IDiscoveredDevice) {
        const version = remotePlayVersionFor(device);
        const path = version < RemotePlayVersion.PS4_10
            ? "/sce/rp/regist" // PS4 with system version < 8.0
            : `/sie/${device.type.toLowerCase()}/rp/sess/rgst`;

        return `http://${device.address.address}:${REGISTRATION_PORT}/${path}`;
    }

    private versionFor(device: IDiscoveredDevice) {
        return remotePlayVersionToString(remotePlayVersionFor(device));
    }
}