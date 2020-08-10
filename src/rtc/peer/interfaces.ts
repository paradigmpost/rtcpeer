import { TypedEventTarget } from '../../util/typed-event-target';

type RTPMediaExtensionsEventMap = {
  track: RTCTrackEvent
};

interface RTPMediaExtensionsEventTarget extends TypedEventTarget<RTPMediaExtensionsEventMap> {
}

export interface RTPMediaExtensions extends Pick<
  RTCPeerConnection & RTPMediaExtensionsEventTarget,
  | 'getSenders'
  | 'getReceivers'
  | 'getTransceivers'
  | 'addTrack'
  | 'removeTrack'
  | 'addTransceiver'
  | 'addEventListener'
> {}

