export function guidFromDescription(description: RTCSessionDescription): string {
  return description.sdp
    .split("\n")
    .filter(str => str.match(/^o=/))
    .pop()!
    .replace(/^o=/, '');
}
