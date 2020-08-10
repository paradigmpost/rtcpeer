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
 * @class RTCPeer
 *
 * A simple wrapper for RTCPeerConnection that implements perfect negotiation.
 *
 * @example
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

  constructor() {
    super();
    this.connection = new RTCPeerConnection();
    this.connection.addEventListener('track', (ev) => this.onTrack(ev));
    this.connection.addEventListener('icecandidate', (ev) => this.onIceCandidate(ev));
    this.connection.addEventListener('negotiationneeded', (ev) => this.onNegotiationNeeded(ev));
  }

  /**
   * Signaling server message handlers
   *
   * When setting up a signaling server mechanism, messages from the corresponding RTCPeer should call these methods.
   */

  async handleCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      await this.connection.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignored) throw err;
    }
  }

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
