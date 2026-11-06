# EVA PWA Starter — iPhone-first

This is a standalone installable-web-app starter for EVA. It is not PocketPal and contains no analytics, no backend, no cloud AI API, and no outbound network requests from the app code.

## What works now
- EVA-branded chat UI
- Local conversation persistence using IndexedDB
- Local notes/memory notebook
- JSON export and delete controls
- WebGPU capability detection
- PWA manifest and offline app-shell service worker
- Clear notice when the AI engine is not connected

## What does NOT work yet
- It does not generate real AI answers yet.
- It does not import or run GGUF models yet.
- The Qwen GGUF downloaded in PocketPal is not directly usable by WebLLM. WebLLM uses its own MLC-format model artifacts.
- The app shell must be served from HTTPS to install as a Home Screen web app and use service workers reliably.

## iPhone-only reality
A native SwiftUI `.ipa` build requires Xcode on a Mac. With only an iPhone, the practical development path is a PWA (Progressive Web App). On iOS 26+, Safari lets users add a website to the Home Screen and open it as a web app. See Apple's instructions:
https://support.apple.com/en-lb/guide/iphone/iphea86e5236/ios

## $0 deployment choices and trade-offs
To install this PWA, it needs an HTTPS address. A free static host can serve the app files, but that means the host sees normal page requests and the source may be public depending on the service/repository configuration. **The app does not send chat contents or notes to the host.** If you require absolutely no third-party hosting, you need a device/server you control to serve the files over HTTPS; an iPhone-only setup cannot provide a robust, always-available public HTTPS origin by itself.

A practical free prototype route is a public static repository + static hosting. Keep private notes and chat data out of the source repository. Only publish the app code. Later, move hosting to your own server.

## How to install after hosting
1. Deploy the contents of this folder to an HTTPS static host.
2. Open the HTTPS site in Safari on iPhone.
3. Tap Share (or the Page Menu), then Add to Home Screen.
4. Enable Open as Web App if shown, then tap Add.
5. Open EVA from its new Home Screen icon.
Apple's guide: https://support.apple.com/en-lb/guide/iphone/iphea86e5236/ios

## Local AI engine roadmap
Safari on iOS 26 supports WebGPU, but browser ML compatibility, memory limits and sustained performance vary by model and device. Test actual capability before choosing a runtime:
- WebGPU status: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebLLM docs: https://webllm.mlc.ai/

A later version can integrate WebLLM with a compatible MLC model or another browser-compatible local runtime. This requires downloading model artifacts to the device. Model downloads contact their hosting origin; inference can then be local. Do not claim fully offline operation until you have verified the app in Airplane Mode and checked network behavior.

## Privacy notes
- IndexedDB stores chat and notes in the browser's site storage.
- Clearing Safari website data, deleting the Home Screen app, or iOS storage pressure can remove site data.
- This is not yet encrypted application-level storage. iOS protects the device using its passcode and platform security, but do not store highly sensitive secrets in this prototype.
- Export creates a JSON file. Treat it as sensitive.
- The app code currently has no fetch/XHR/WebSocket/analytics/remote API calls.
