export type RTCPeerEventMap = {
  candidate: RTCPeerCandidateEvent;
  description: RTCPeerDescriptionEvent;
};

/**
 * Contains a [[RTCIceCandidate]] forwarded from an [[RTCPeerConnection]] instance, to be sent to another [[RTCPeer]].
 *
 * @noInheritDoc
 */
export class RTCPeerCandidateEvent extends Event {
  constructor( public candidate: RTCIceCandidate | null ) {
    super( 'candidate' );
  }
}

/**
 * Contains a [[RTCSessionDescription]] forwarded from an [[RTCPeerConnection]] instance, to be sent to another [[RTCPeer]].
 *
 * @noInheritDoc
 */
export class RTCPeerDescriptionEvent extends Event {
  constructor( public description: RTCSessionDescription ) {
    super( 'description' );
  }
}