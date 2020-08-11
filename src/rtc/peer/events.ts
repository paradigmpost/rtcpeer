export type RTCPeerEventMap = {
  candidate: RTCPeerCandidateEvent;
  description: RTCPeerDescriptionEvent;
  streams: RTCPeerStreamsEvent;
};

/**
 * Contains a [[RTCIceCandidate]] forwarded from an [[RTCPeerConnection]] instance, to be sent to another [[RTCPeer]].
 *
 * @noInheritDoc
 */
export class RTCPeerCandidateEvent extends Event {
  constructor(public candidate: RTCIceCandidate | null) {
    super("candidate");
  }
}

/**
 * Contains a [[RTCSessionDescription]] forwarded from an [[RTCPeerConnection]] instance, to be sent to another [[RTCPeer]].
 *
 * @noInheritDoc
 */
export class RTCPeerDescriptionEvent extends Event {
  constructor(public description: RTCSessionDescription) {
    super("description");
  }
}

/**
 * Contains a readonly array of [[MediaStream]]'s forwarded from an [[RTCPeerConnection]] instance.
 *
 * A listener of this event would be the "receiver" of the contained streams, i.e. not the "sender".
 *
 * @noInheritDoc
 */
export class RTCPeerStreamsEvent extends Event {
  constructor(public streams: ReadonlyArray<MediaStream>) {
    super("streams");
  }
}
