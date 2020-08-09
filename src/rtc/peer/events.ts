export type RTCPeerEventMap = {
  candidate: RTCPeerCandidateEvent;
  description: RTCPeerDescriptionEvent;
  streams: RTCPeerStreamsEvent;
}

export class RTCPeerCandidateEvent extends Event {
  constructor(public candidate: RTCIceCandidate | null) {
    super("candidate");
  }
}

export class RTCPeerDescriptionEvent extends Event {
  constructor(public description: RTCSessionDescription) {
    super("description");
  }
}

export class RTCPeerStreamsEvent extends Event {
  constructor(public streams: ReadonlyArray<MediaStream>) {
    super("streams");
  }
}
