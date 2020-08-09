import { h } from "preact";
// See: https://github.com/preactjs/enzyme-adapter-preact-pure
import { shallow } from "enzyme";
import App from "../app";

describe("basic app rendering", () => {
    test("h1 renders Cameras App", () => {
        const context = shallow(<App />);
        expect(context.find("h1").text()).toBe("Cameras App");
    });
});
