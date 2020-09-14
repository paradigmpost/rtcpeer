import { IdentifiableEvent } from '../../util/identifiable-event';
import { TypedEventTarget } from '../../util/typed-event-target';
import { unexpectedError } from '../../util/unexpected-error';

import {
  RTCPeerEventMap,
} from '../peer/events';
import { RTCPeer } from '../peer/index';
import { RTCPeerManagerEventMap, RTCPeerManagerStreamsEvent } from './events';

/**
 * Provides mechanisms for sending and receiving streams with multiple, probably remote, RTCPeer objects.
 *
 * The goal of RTCPeerManager is to make it easy to send the same content to many RTCPeer's at once, possibly while also receiving contents from those peers. Currently, only addTrack (via [[addStream]]) is managed. Regardless of whether you call [[addPeer]] before or after you call [[addStream]], all peers should receive the content sent via addStream once they are connected.
 *
 * ### Signaling server message handlers
 *
 * When setting up a signaling server mechanism, messages from a corresponding (and likely remote) RTCPeerManager's corresponding peer's `candidate` and `description` events should call these methods. You can use the `id` of [[IdentifiableEvent]] to match messages between peers.
 *
 */
export class RTCPeerManager extends TypedEventTarget<RTCPeerManagerEventMap> {
  private readonly peers: { [key: string]: RTCPeer | null } = {};
  private readonly disposables: { [key: string]: (() => void) | null } = {};
  private readonly streams: MediaStream[] = [];

  /**
   * Fires a [[RTCPeerManagerStreamsEvent]] whenever the underlying connection fires a "track" event.
   * @event EVENT_STREAMS
   */
  static readonly EVENT_STREAMS: keyof RTCPeerManagerEventMap = 'streams';

  /**
   * Initialize a new RTCPeerManager with the given ID. This ID is never used internally, and is a convenience property for consumers of RTCPeerManager to identify the object unique (e.g., when coordinating with a signaling server).
   *
   * @param id a uniquely identifiable string for this RTCPeerManager, for when communicating outside of peer-to-peer/RTC channels, such as via a signaling server
   */
  constructor(public readonly id: string) {
    super();
  }

  /**
   * Passes the candidate to be handled by the RTCPeer specified by `id`.
   *
   * This method, along with [[handleDescription]], is used in the negotiation process in order for 2 (likely remote) RTCPeer's to establish a connection with each other. Use this method to respond to messages from an associated (likely remote) RTCPeerManager's `candidate` event, which is an [[IdentifiableEvent]] wrapping a [[RTCPeerCandidateEvent]].
   */
  async handleCandidate(id: string, candidate: RTCIceCandidate): Promise<void> {
    console.log('handleCandidate('+id+'):', candidate);
    if (!this.hasPeer(id)) this.addPeer(id);
    this.peers[id]!.handleCandidate(candidate);
  }

  /**
   * Passes the session description to be handled by the RTCPeer specified by `id`.
   *
   * This method, along with [[handleCandidate]], is used in the negotiation process in order for 2 (likely remote) RTCPeer's to establish a connection with each other. Use this method to respond to messages from an associated (likely remote) RTCPeerManager's `description` event, which is an [[IdentifiableEvent]] wrapping a [[RTCPeerDescriptionEvent]].
   */
  async handleDescription(id: string, description: RTCSessionDescription): Promise<void> {
    console.log('handleDescription('+id+'):', description);
    if (!this.hasPeer(id)) this.addPeer(id);
    this.peers[id]!.handleDescription(description);
  }

  /**
   * Creates a new RTCPeer, internally identified by the specified `id`, and adds to the managed array of peer objects.
   *
   * If a stream has already been shared via [[addStream]], then that stream is automatically shared with the newly created RTCPeer.
   *
   * @param id a unique string used to identify the underlying RTCPeer event when `candidate` and `description` events are fired and when the consumer wants to remove the peer via [[removePeer]].
   */
  addPeer(id: string): void {
    console.log('addPeer:', id);
    if (this.peers[id]) {
      throw unexpectedError('peer is already managed');
    }

    const passthrough = 
    <T extends RTCPeerEventMap[keyof RTCPeerEventMap] | RTCTrackEvent | Event>(ev: T) => {
      if (this.isTrackEvent(ev)) {
        this.dispatchEvent(new IdentifiableEvent(id, new RTCPeerManagerStreamsEvent(ev.streams)));
      } else {
        this.dispatchEvent(new IdentifiableEvent(id, ev));
      }
    };
    const peer = new RTCPeer();
    peer.addEventListener('candidate', passthrough);
    peer.addEventListener('description', passthrough);
    peer.media.addEventListener('track', passthrough);

    this.peers[id] = peer;
    this.disposables[id] = () => {
      peer.removeEventListener('candidate', passthrough);
      peer.removeEventListener('description', passthrough);
      peer.media.removeEventListener('track', passthrough);
    };

    // send the peer any streams that are already getting transmitted, if any
    this.streams.forEach((stream) => this.addStreamForPeer(stream, peer));
  }

  private hasPeer(id: string): boolean {
    return !!this.peers[id];
  }

  private isTrackEvent(ev: Event): ev is RTCTrackEvent {
    return Object.getPrototypeOf(ev).constructor === RTCTrackEvent;
  }

  /**
   * Removes the RTCPeer identified by the given ID from management
   *
   * @param id the id by which the RTCPeer that should be removed was identified when it was added via [[addPeer]]
   */
  removePeer(id: string): void {
    console.log('removePeer:', id);
    const dispose = this.disposables[id];
    if (dispose) dispose();

    delete this.peers[id];
  }

  /**
   * Start sharing a MediaStream object with any peers currently under management (and any peers added in the future)
   *
   * @param stream A MediaStream that will be shared to current and future peers
   */
  addStream(stream: MediaStream) {
    Object.keys(this.peers).map((k) => this.peers[k]!).forEach((peer) => {
      this.addStreamForPeer(stream, peer);
    });
    this.streams.push(stream);
  }

  private addStreamForPeer(stream: MediaStream, peer: RTCPeer) {
    stream.getTracks().forEach((track) => peer.media.addTrack(track, stream));
  }

  /**
   * Check to see if the RTCPeerManager is currently sharing a MediaStream that originated from **this machine**.
   *
   * Note that this method does not check for MediaStream's that are being received.
   *
   * @param stream The MediaStream to check whether is currently streaming
   */
  hasStream(stream: MediaStream): boolean {
    return this.streams.filter((other) => other.id == stream.id).length > 0;
  }
}
