# YellowDoc.ai — Android App

A native Android client for the YellowDoc.ai FastAPI backend, built with **Kotlin + Jetpack Compose (Material 3)**.

Premium dark fintech design: near-black surfaces, emerald accent, Space Grotesk display type and Manrope body type, hairline-bordered cards, animated progress states and chat bubbles.

## Features

| Screen | What it does |
|---|---|
| **Home** | Editorial dashboard with pipeline overview and server status |
| **PDF → Excel** | Pick a PDF, name the workbook, watch the docling → LLM → Excel pipeline run, then download the generated `.xlsx` straight into your Downloads folder |
| **Ask your documents** | RAG chat over your indexed files — structured answers with summary, key points, examples and a confidence chip |
| **Server settings** | Bottom sheet to point the app at any FastAPI instance (persisted via DataStore) |

## Project layout

```
android/
├── app/src/main/java/com/yellowdoc/app/
│   ├── MainActivity.kt / YellowDocApplication.kt
│   ├── core/            AppConfig (DataStore), NetworkModule (Retrofit/OkHttp), AppContainer
│   ├── data/
│   │   ├── api/         Retrofit interface for /excel/generate, /query, /excel/download
│   │   ├── model/       DTOs mirroring the backend responses
│   │   ├── file/        MediaStore-based Excel downloader
│   │   └── repo/        YellowRepository (Result-wrapped calls)
│   └── ui/
│       ├── theme/       Color, Type (variable fonts), Theme
│       ├── components/  Cards, buttons, chips, top bar, typing indicator
│       ├── navigation/  Compose Navigation host with transitions
│       ├── home/ convert/ chat/ settings/
└── gradle/              Version catalog + wrapper
```

## Prerequisites

- **Android Studio** (Koala or newer recommended)
- JDK 17 (bundled with recent Android Studio versions)
- The YellowDoc backend running (`uvicorn backend.main:app --reload` from the repo root)

## Build & run

1. Open the `android/` folder in Android Studio (**File → Open**).
2. Let Gradle sync — it downloads AGP 8.5.2, Kotlin 2.0.20 and all dependencies automatically.
3. Run the `app` configuration on an emulator or device.

Or from the command line:

```bash
cd android
./gradlew installDebug
```

## Connecting to the backend

The app ships with `http://172.20.7.18:8000/` as the default base URL — that's the Android-emulator alias for your machine's `localhost`.

- **Emulator:** just start your backend on port 8000 and launch the app.
- **Physical device:** open the ⚙ settings sheet on the Home screen and enter your computer's LAN address, e.g. `http://192.168.1.20:8000`. Make sure the phone and computer share the same Wi-Fi network and that uvicorn listens on all interfaces:

  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port 8000
  ```

The chosen address is saved on-device; you only configure it once.

## Backend endpoints used

| Method | Path | Purpose |
|---|---|---|
| POST | `/excel/generate?excel_filename=…` | Multipart PDF upload → conversion pipeline |
| GET | `/excel/download/{filename}` | Streams the generated workbook *(added for this app)* |
| POST | `/query?query=…` | RAG question over indexed documents |

## Notes

- Fonts are variable TTFs (Space Grotesk, Manrope) under the SIL Open Font License.
- Cleartext HTTP is enabled in the manifest because development servers are plain HTTP; switch to HTTPS before any production deployment.
- Downloads land in the public **Downloads** folder on Android 10+ (no permission needed); older devices save into the app's documents directory.
