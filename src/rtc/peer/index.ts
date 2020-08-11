import {
  RTCPeerCandidateEvent,
  RTCPeerDescriptionEvent,
  RTCPeerEventMap,
  RTCPeerStreamsEvent
} from "./events";
import { RTPMediaExtensions } from './interfaces';

import { guidFromDescription } from '../../util/guid-from-description';
import { TypedEventTarget } from '../../util/typed-event-target';
import { unexpectedError } from '../../util/unexpected-error';

/**
 * A simple wrapper for RTCPeerConnection that implements perfect negotiation.
 *
 * ### Usage example
 *
 * ```javascript
 * const peer1 = new RTCPeer();
 * const peer2 = new RTCPeer();
 *
 * peer1.addEventListener('candidate', (c) => peer2.handleCandidate(c));
 * peer2.addEventListener('candidate', (c) => peer1.handleCandidate(c));
 * peer1.addEventListener('description', (d) => peer2.handleDescription(d));
 * peer2.addEventListener('description', (d) => peer1.handleDescription(d));
 *
 * peer1.addEventListener('streams', (stream) => {
 *   const video = document.createElement('video');
 *   video.autoplay = true;
 *   video.srcObject = stream;
 *   document.body.appendChild(video);
 * });
 *
 * const stream = await navigator.mediaDevices.getUserMedia({video: true});
 * peer2.addTrack(stream.getTracks()[0], stream);
 * ```
 *
 * ### Signaling server message handlers
 * 
 * When setting up a signaling server mechanism, messages from a corresponding (and likely remote) RTCPeer's `candidate` and `description` events should call these methods.
 *
 */
export class RTCPeer
  extends TypedEventTarget<RTCPeerEventMap> 
  implements RTPMediaExtensions
{
  private readonly connection: RTCPeerConnection;
  private offered = false;
  private ignored = false;

  private get stable() {
    return this.connection.signalingState == 'stable';
  }

  /**
   * Indicates, via a [[RTCPeerCandidateEvent]], to send an ICE candidate to the associated peer, likely via a signaling server.
   * @event EVENT_CANDIDATE
   */
  static readonly EVENT_CANDIDATE: keyof RTCPeerEventMap = 'candidate';

  /**
   * Indicates, via a [[RTCPeerDescriptionEvent]], to send a session description to the associated peer, likely via a signaling server.
   * @event EVENT_DESCRIPTION
   */
  static readonly EVENT_DESCRIPTION: keyof RTCPeerEventMap = 'description';

  /**
   * Fires a [[RTCPeerStreamsEvent]] whenever the underlying connection fires a "track" event.
   * @event EVENT_STREAMS
   */
  static readonly EVENT_STREAMS: keyof RTCPeerEventMap = 'streams';

  /**
   * Constructs a new RTCPeer and managed RTCPeerConnection.
   *
   * Optionally, override whether the peer is "polite", i.e. if it would forget about its own offer and acknowlege an incoming offer when a connection negotiation collision occurs. By default, RTCPeer determines whether to be [polite in perfect negotiation collisions](WebRTC 1.0 Perfect Negotiation Example) by comparing its connection's session description (SDP) origin field (`o=`) against the other peer's offered SDP. To override this behavior, manually set whether the peer is polite via the parameter.
   *
   * [WebRTC 1.0 Perfect Negotiation Example]: https://w3c.github.io/webrtc-pc/#perfect-negotiation-example
   *
   * @param polite Use to override whether this peer is polite when a negotiation collision occurs. If either no value or `null` are provided, the peer automatically compares SDP origins to determine politeness.
   */
  constructor(private polite: boolean | null = null) {
    super();
    this.connection = new RTCPeerConnection();
    this.connection.addEventListener('track', (ev) => this.onTrack(ev));
    this.connection.addEventListener('icecandidate', (ev) => this.onIceCandidate(ev));
    this.connection.addEventListener('negotiationneeded', (ev) => this.onNegotiationNeeded(ev));
  }

  /**
   * Handle a RTCIceCandidate from the associated RTCPeer, likely sent via a signaling server.
   *
   * Unless the RTCPeer is ignoring incoming candidates due to a negotiation collision (in which case, any errors are caught instead of bubbling up), this method does nothing special beyond adding the candidate to the underlying connection.
   *
   * @category Signaling server message handlers
   * @param candidate the candidate sent from the associated peer
   */
  async handleCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      await this.connection.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignored) throw err;
    }
  }

  /**
   * Handle a RTCSessionDescription, or SDP, from the associated peer, likely sent via a signaling server.
   *
   * This method determines whether or not to acknowlege or ignore the descriptions that are passed to it, thus the majority of the negotiation logic can be found here.
   *
   * If an "answer" is necessary, i.e. if the incoming description is of type `offer` and we are not ignoring the peer's offer due to a collision, a [[RTCPeerDescriptionEvent]] will be emitted as the Promise resolves, to be sent to the other peer.
   *
   * @category Signaling server message handlers
   * @param description the session description (SDP) sent from the associated peer
   */
  async handleDescription(description: RTCSessionDescription): Promise<void> {
    // determine if there's an offer collision and ignore/acknowledge appropriately
    if (this.isCollisionWithDescription(description)) {
      if (!this.isPoliteWithDescription(description)) {
        this.ignored = true;
        return;
      } else {
        // we have to let the connection know of the new description & rollback our offer simultaneously
        await Promise.all([
            this.connection.setLocalDescription({ type: 'rollback' }),
            this.connection.setRemoteDescription(description)
        ]);
      }
    } else {
        // no collision; we have to let the connection know of the new description
        await this.connection.setRemoteDescription(description);
    }

    if (description.type !== 'offer') {
      return;
    }

    // now that the connection knows the remote description, we can update the local description based on createAnswer
    await this.connection.setLocalDescription(await this.connection.createAnswer());
    const responseDescription = this.connection.localDescription;

    if (responseDescription === null) throw unexpectedError('responseDescription should not be null');

    this.dispatchEvent(new RTCPeerDescriptionEvent(responseDescription));
  }

  private isCollisionWithDescription(description: RTCSessionDescription) {
    return description.type == 'offer' && (this.offered || !this.stable);
  }

  private isPoliteWithDescription(description: RTCSessionDescription) {
    if (this.polite !== null) return this.polite;
    if (this.connection.localDescription == null) return true;

    const localGuid = guidFromDescription(this.connection.localDescription);
    const remoteGuid = guidFromDescription(description);

    return localGuid == null || remoteGuid == null || localGuid > remoteGuid;
  }

  /**
   * RTCPeerConnection Event Handlers
   */

  private onIceCandidate(ev: RTCPeerConnectionIceEvent) {
    const { candidate } = ev;
    this.dispatchEvent(new RTCPeerCandidateEvent(candidate));
  }
  
  private async onNegotiationNeeded(_: Event) {
    this.offered = true;

    // in case we return early or an exception is thrown, `offered` still needs to be reset
    try {
      const offer = await this.connection.createOffer();

      // if we are raced by the other peer such that at this point, we are e.g. 'have-*-offer'
      if (!this.stable) return;

      await this.connection.setLocalDescription(offer);
      
      const description = this.connection.localDescription;
      if (description === null) throw unexpectedError('description should not be null');

      this.dispatchEvent(new RTCPeerDescriptionEvent(description));
    } finally {
      this.offered = false;
    }
  }

  private onTrack(ev: RTCTrackEvent) {
    const { streams } = ev;
    this.dispatchEvent(new RTCPeerStreamsEvent(streams));
  }

  /**
   * RTPMediaExtensions
   */

  getSenders(): RTCRtpSender[] { return this.connection.getSenders(); }
  getReceivers(): RTCRtpReceiver[] { return this.connection.getReceivers(); }
  getTransceivers(): RTCRtpTransceiver[] { return this.connection.getTransceivers(); }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
    return this.connection.addTrack(track, ...streams);
  }

  removeTrack(sender: RTCRtpSender): void { this.connection.removeTrack(sender); }
  
  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    return this.connection.addTransceiver(trackOrKind, init);
  }

  get ontrack(): ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null {
    throw new Error('DOM 0 style events are not supported. Use addEventListener instead.');
  }
  set ontrack(_: ((this: RTCPeerConnection, ev: RTCTrackEvent) => any) | null) {
    throw new Error('DOM 0 style events are not supported. Use addEventListener instead.');
  }
}
