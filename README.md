# Myralis AI

A personal AI assistant app powered by the Google Gemini API.

## Overview

Myralis AI is a lightweight, personal AI assistant built to run directly on an Android device via [Termux](https://termux.dev/). It uses Google's Gemini models as its backend for generating responses.

## Features

- Conversational AI assistant powered by Gemini
- Runs entirely on-device through Termux — no separate server required
- Simple, extensible architecture for adding new capabilities

## Tech Stack

- **Backend:** Google Gemini API (`gemini-2.5-flash-lite`)
- **Runtime:** Termux (Android)

## Getting Started

### Prerequisites

- [Termux](https://termux.dev/) installed on your Android device
- A Google Gemini API key ([get one here](https://ai.google.dev/))

### Installation

```bash
git clone https://github.com/akuruloagoziem2006-tech/myralis-ai.git
cd myralis-ai
```

### Configuration

Create a `.env` file in the project root (this file is git-ignored and should never be committed):

```
GEMINI_API_KEY=your_api_key_here
```

> **Note:** Never hardcode API keys directly in source files. Always load them from environment variables.

### Running

```bash
# add your run command here, e.g.:
python main.py
```

## Roadmap

- [ ] Finish migrating hardcoded API key to environment variables
- [ ] Additional feature ideas here

## License

Specify a license here (e.g. MIT).

## Author

Akurulo — [github.com/akuruloagoziem2006-tech](https://github.com/akuruloagoziem2006-tech)

