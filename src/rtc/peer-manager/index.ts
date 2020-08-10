import { IdentifiableEvent } from '../../util/identifiable-event';
import { TypedEventTarget } from '../../util/typed-event-target';
import { unexpectedError } from '../../util/unexpected-error';

import {
  RTCPeerEventMap,
} from '../peer/events';
import { RTCPeer } from '../peer/index';
import { RTCPeerManagerEventMap } from './events';

export class RTCPeerManager extends TypedEventTarget<RTCPeerManagerEventMap> {

  private readonly peers: { [key: string]: RTCPeer | null } = {};
  private readonly disposables: { [key: string]: (() => void) | null } = {};
  private readonly streams: MediaStream[] = [];

  constructor(public readonly id: string) {
    super();
  }

  /**
   * Signaling server message handlers
   *
   * When setting up a signaling server mechanism, messages from the corresponding RTCPeer should call these methods.
   */

  async handleCandidate(id: string, candidate: RTCIceCandidate): Promise<void> {
    console.log('handleCandidate('+id+'):', candidate);
    if (!this.hasPeer(id)) this.addPeer(id);
    this.peers[id]!.handleCandidate(candidate);
  }

  async handleDescription(id: string, description: RTCSessionDescription): Promise<void> {
    console.log('handleDescription('+id+'):', description);
    if (!this.hasPeer(id)) this.addPeer(id);
    this.peers[id]!.handleDescription(description);
  }

  /**
   * Peer Management
   */

  addPeer(id: string): void {
    console.log('addPeer:', id);
    if (this.peers[id]) {
      throw unexpectedError('peer is already managed');
    }

    const passthrough = <T extends RTCPeerEventMap[keyof RTCPeerEventMap] | Event>(ev: T) => {
      console.log('passthrough:', ev);
      this.dispatchEvent(new IdentifiableEvent(id, ev));
    };
    const peer = new RTCPeer();
    peer.addEventListener('candidate', passthrough);
    peer.addEventListener('description', passthrough);
    peer.addEventListener('streams', passthrough);

    this.peers[id] = peer;
    this.disposables[id] = () => {
      peer.removeEventListener('candidate', passthrough);
      peer.removeEventListener('description', passthrough);
      peer.removeEventListener('streams', passthrough);
    };

    // send the peer any streams that are already getting transmitted, if any
    this.streams.forEach((stream) => this.addStreamForPeer(stream, peer));
  }

  private hasPeer(id: string): boolean {
    return !!this.peers[id];
  }

  // TODO: remove tracks from these peers
  removePeer(id: string): void {
    console.log('removePeer:', id);
    const dispose = this.disposables[id];
    if (dispose) dispose();

    delete this.peers[id];
  }

  // TODO: add removeStream
  addStream(stream: MediaStream) {
    Object.keys(this.peers).map(k => this.peers[k]!).forEach((peer) => {
      this.addStreamForPeer(stream, peer);
    });
    this.streams.push(stream);
  }

  private addStreamForPeer(stream: MediaStream, peer: RTCPeer) {
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
  }

  hasStream(stream: MediaStream): boolean {
    return this.streams.filter((other) => other.id == stream.id).length > 0;
  }
}
