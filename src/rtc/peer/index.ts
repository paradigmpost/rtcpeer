import {
  RTCPeerCandidateEvent,
  RTCPeerDescriptionEvent,
  RTCPeerEventMap,
  RTCPeerStreamsEvent
} from "./events";

import { unexpectedError } from '../../util/unexpected-error';
import { TypedEventTarget } from '../../util/typed-event-target';

export class RTCPeer extends TypedEventTarget<RTCPeerEventMap> {
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

    const localGuid = this.guidFromDescription(this.connection.localDescription);
    const remoteGuid = this.guidFromDescription(description);

    return localGuid == null || remoteGuid == null || localGuid > remoteGuid;
  }

  private guidFromDescription(description: RTCSessionDescription | null): string | null {
    return description?.sdp
      .split("\n")
      .filter(str => str.match(/^o=/))
      .pop()
      ?.replace(/^o=/, '') || null;
  }

  /**
   * RTCPeerConnection Event Handlers
   */

  // TODO: should we attempt to disable ICE Trickling?
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
   * Media
   */

  // TODO: support more than 1 track per session
  // - currentDirection may not be supported? https://caniuse.com/#search=currentDirection
  get track(): MediaStreamTrack | null {
    const transceiver = this.connection.getTransceivers()
      .filter(t => t.currentDirection != 'stopped')
      .pop();

    return transceiver?.sender.track || null;
  }

  // we want to use the same media stream that is the source for the track, so that if it is stopped the tx also hopefully stops
  addTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.track?.stop()
    this.connection.addTrack(track, stream);
  }

}
