import { Fragment, FunctionalComponent, h } from "preact";
import { useEffect, useState } from "preact/compat";
import { RTCPeer } from "../../../index.js";
import { DeclarativeFrame, Video } from "./components";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
    // tslint:disable-next-line:no-var-requires
    require("preact/debug");
}

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
}

const CameraPeer: FunctionalComponent<{
    message: Message | null;
    send: (_: { [key: string]: any }) => void;
}> = ({ children: _1, ref: _2, ...props }) => {
    const { message, send } = props;
    const [busy, setBusy] = useState(false);
    const [peer, setPeer] = useState<RTCPeer | null>(null);
    const [recvStream, setRecvStream] = useState<MediaStream | null>(null);
    const [sendStream, setSendStream] = useState<MediaStream | null>(null);

    if (recvStream != null) {
        console.log("we have a recvStream!!:", recvStream);
    }

    useEffect(() => {
        setPeer(new RTCPeer());
    }, []);

    useEffect(() => {
        console.log("peer:", peer);
        peer?.addEventListener("candidate", ({ candidate }) =>
            send({ candidate })
        );
        peer?.addEventListener("description", ({ description }) =>
            send({ description })
        );
        peer?.addEventListener("streams", ({ streams }) =>
            setRecvStream(streams[0] || null)
        );
    }, [peer]);

    useEffect(() => {
        console.log("message:", message);
        if (message == null) return;
        const { candidate, description } = message;

        if (candidate) {
            peer?.handleCandidate(candidate);
            return;
        }

        if (description) {
            peer?.handleDescription(description);
            return;
        }
    }, [message]);

    const getUserCamera = async () => {
        // return await navigator.mediaDevices.getUserMedia({video: true});
        return await whiteNoise(160, 120);
    };

    const onCameraChecked = async (ev: Event) => {
        const checkbox = ev.target as HTMLInputElement;

        if (checkbox.checked) {
            setBusy(true);
            const stream = await getUserCamera();
            peer!.addTrack(stream.getTracks()[0], stream);
            if (!sendStream) setSendStream(stream);
            setBusy(false);
        } else {
            peer!.track?.stop();
        }
    };

    return (
        <Fragment>
            {recvStream != null && (
                <Video
                    width={160}
                    height={120}
                    autoplay={true}
                    srcObject={recvStream}
                />
            )}
            <label>
                <input
                    type="checkbox"
                    disabled={busy}
                    onClick={onCameraChecked}
                />
                Camera
            </label>
        </Fragment>
    );
};

const App: FunctionalComponent = () => {
    const [recv1, send1] = useState<Message | null>(null);
    const [recv2, send2] = useState<Message | null>(null);

    return (
        <div id="app">
            <h1>Cameras App</h1>
            <DeclarativeFrame>
                <CameraPeer message={recv1} send={send2} />
            </DeclarativeFrame>
            <DeclarativeFrame>
                <CameraPeer message={recv2} send={send1} />
            </DeclarativeFrame>
        </div>
    );
};

export default App;
