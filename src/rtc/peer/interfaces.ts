import { TypedEventTarget } from '../../util/typed-event-target';

type RTPMediaExtensionsEventMap = {
  track: RTCTrackEvent
};

export interface RTPMediaExtensions extends TypedEventTarget<RTPMediaExtensionsEventMap> {
    getReceivers(): RTCRtpReceiver[];
    getSenders(): RTCRtpSender[];
    getTransceivers(): RTCRtpTransceiver[];
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
    removeTrack(sender: RTCRtpSender): void;
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null;
}