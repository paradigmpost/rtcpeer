import { IdentifiableEvent } from '../../util/identifiable-event';

import {
  RTCPeerCandidateEvent,
  RTCPeerDescriptionEvent,
} from '../peer/events';

export type RTCPeerManagerEventMap = {
  candidate: IdentifiableEvent<RTCPeerCandidateEvent>,
  description: IdentifiableEvent<RTCPeerDescriptionEvent>,
  streams: IdentifiableEvent<RTCPeerManagerStreamsEvent>
}

/**
 * Contains a readonly array of [[MediaStream]]'s forwarded from an [[RTCPeerConnection]] instance.
 *
 * A listener of this event would be the "receiver" of the contained streams, i.e. not the "sender".
 *
 * @noInheritDoc
 */
export class RTCPeerManagerStreamsEvent extends Event {
  constructor(public streams: ReadonlyArray<MediaStream>) {
    super('streams');
  }
}

