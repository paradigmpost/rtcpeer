import { Fragment, FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/compat";
import { RTCPeerManager } from "../../../index.js";
import { DeclarativeFrame, Video } from "./components";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
    // tslint:disable-next-line:no-var-requires
    require("preact/debug");
}

const getRandomNumber = () => window.crypto.getRandomValues(new Uint32Array(16384)).reduce((total, each) => total + each, 0);

const whiteNoise = async (width: number, height: number) => {
    const canvas = Object.assign(document.createElement("canvas"), {
        width,
        height
    });
    const ctx = canvas.getContext("2d")!;
    ctx.fillRect(0, 0, width, height);
    const p = ctx.getImageData(0, 0, width, height);
    requestAnimationFrame(function draw() {
        for (let i = 0; i < p.data.length; i++) {
            p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
        }
        ctx.putImageData(p, 0, 0);
        requestAnimationFrame(draw);
    });
    // this is a Working Draft spec, but is implemented in FF and Chrome, so we use `any`
    return (canvas as any).captureStream() as MediaStream;
};

interface Message {
    candidate?: any;
    description?: any;
    id: string;
}

const CameraPeer: FunctionalComponent<{
    id: string,
    message: Message | null;
    otherPeers: string[],
    send: (_: { [key: string]: any, from: string, to: string }) => void;
}> = ({ children: _1, ref: _2, ...props }) => {
    const { id: _id, message, otherPeers, send } = props;
    const [busy, setBusy] = useState(false);
    const [peerManager, setPeerManager] = useState<RTCPeerManager | null>(null);
    const [recvStreams, setRecvStreams] = useState<{ [key: string]: MediaStream | null }>({});
    const [sendStream, setSendStream] = useState<MediaStream | null>(null);

    // if (Object.keys(recvStreams).length > 0) {
    //     console.log("we have a recvStream!!:", recvStreams);
    // }

    useEffect(() => {
        setPeerManager(new RTCPeerManager(_id));
    }, []);

    useEffect(() => {
        peerManager?.addEventListener("candidate", ({ id, event }) => {
            const { candidate } = event;
            send({ to: id, from: peerManager!.id, candidate });
        });
        peerManager?.addEventListener("description", ({ id, event }) => {
            const { description } = event;
            send({ to: id, from: peerManager!.id, description });
        });
        peerManager?.addEventListener("streams", ({ id, event }) => {
            const { streams } = event;
            // make sure it's a string key
            setRecvStreams(Object.assign(recvStreams, { ["_" + id]: streams[0] || null }));
        });

        if (peerManager) otherPeers.forEach(peerId => peerManager.addPeer(peerId));
    }, [peerManager]);

    useEffect(() => {
        console.log('recvStreams:', recvStreams);
    }, [recvStreams])

    useEffect(() => {
        if (message == null) return;
        const { id, candidate, description } = message;

        if (candidate) {
            peerManager?.handleCandidate(id, candidate);
            return;
        }

        if (description) {
            peerManager?.handleDescription(id, description);
            return;
        }
    }, [message]);

    const getUserCamera = async () => {
        // return await navigator.mediaDevices.getUserMedia({video: true});
        return await whiteNoise(160, 120);
    };

    const onCameraChecked = async (ev: Event) => {
        const checkbox = ev.target as HTMLInputElement;
        const endStream = (stream: MediaStream) => {
            stream.getTracks().forEach(t => t.stop());
        };

        if (checkbox.checked) {
            setBusy(true);
            if (sendStream) endStream(sendStream);
            setSendStream(null);

            const stream = await getUserCamera();
            peerManager!.addStream(stream);
            setSendStream(stream);
            setBusy(false);
        } else {
            if (sendStream) endStream(sendStream);
        }
    };

    return (
        <Fragment>
            <table>
                <tr>
                    <td>
                        <b>{_id}</b>
                    </td>
                    <td>
                        <label>
                            <input
                                type="checkbox"
                                disabled={busy}
                                onClick={onCameraChecked}
                            />
                            Camera
                        </label>
                    </td>
                </tr>
                <tr>
                    {Object.keys(recvStreams).map(k => recvStreams[k]!).map((stream) => (
                        <td>
                            <Video
                                width={160}
                                height={120}
                                autoplay={true}
                                srcObject={stream}
                            />
                        </td>
                    ))}
                </tr>
            </table>
        </Fragment>
    );
};

const peers = [
  getRandomNumber().toString(),
  getRandomNumber().toString(),
  getRandomNumber().toString(),
];

const App: FunctionalComponent = () => {
    const [messages, setMessages] = useState<{ [key: string]: Message | null }>({});

    const send: ((data: { to: string, from: string, candidate?: RTCIceCandidate, description?: RTCSessionDescription }) => void) = ({ to, from, ...partialMessage }) => {
        const message: Message = { ...partialMessage, id: from };
        
        setMessages({
          ...messages,
          [to]: message
        });
    };

    return (
        <div id="app">
            <h1>Cameras App</h1>
            {peers.map((id) => (
              <DeclarativeFrame>
                <CameraPeer id={id} message={messages[id]} otherPeers={peers.filter(other => other != id)} send={send} />
              </DeclarativeFrame>
            ))}
        </div>
    );
};

export default App;
