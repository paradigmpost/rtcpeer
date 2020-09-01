# RTCPeer

`RTCPeer` is thin wrapper for RTCPeerConnection that implements perfect negotiation; just provide
event listeners that act as a communication channel to other (likely remote) peers, and RTCPeer
takes care of the negotiation logic that allows them to establish a peer-to-peer connection.

`RTCPeerManager`, another small abstraction, manages a collection of peers, simplifying sending
and receiving media between many users, regardless of whether the peer joined first or media was
"shared" before there were any peers listening.

The package is tiny (4kb of gzipped JavaScript), built on top of the WebRTC 1.0 specification and
other modern DOM and JavaScript features. Support for older browsers is explicitly a non-goal;
similarly, maintaining a light-weight abstraction over the modern specification is a primary goal.

## Installation

```shell
$ npm install rtcpeer
```

## Should I use this?

Probably :doughnut:.

- RTCPeer's public API is subject to change to improve readability and support more WebRTC use-cases
- RTCPeer is not battle-tested
- RTCPeerManager is unfinished / still in progress

That said, the project, including sub-zero releases, will attempt to respect semantic versioning.
Semantic versioning does not cover sub-zero releases; in this case, any MINOR version change should
be considered a breaking change, with non-breaking changes reserved for PATCH.

## License

This repository and its artifacts are freely distributable under the terms of the
[Revised BSD License](/LICENSE).
