import { IdentifiableEvent } from '../../util/identifiable-event';

import {
  RTCPeerCandidateEvent,
  RTCPeerDescriptionEvent,
  RTCPeerStreamsEvent
} from '../peer/events';

export type RTCPeerManagerEventMap = {
  candidate: IdentifiableEvent<RTCPeerCandidateEvent>,
  description: IdentifiableEvent<RTCPeerDescriptionEvent>,
  streams: IdentifiableEvent<RTCPeerStreamsEvent>
}
