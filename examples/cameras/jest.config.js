module.exports = {
    preset: "jest-preset-preact",
    setupFiles: [
        "<rootDir>/src/tests/__mocks__/setupTests.js",
        "<rootDir>/src/tests/__mocks__/browserMocks.js"
    ],
    testURL: "http://localhost:8080",
    moduleNameMapper: {
        "^react$": "preact/compat",
        "^react-dom$": "preact/compat",
        "^react-dom/test-utils$": "preact/test-utils",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/tests/__mocks__/fileMocks.js",
    }
}
