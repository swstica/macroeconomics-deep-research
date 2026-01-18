An AI Macroeconomics Research Assistant that actually does real economic research- not vibes. Ask it anything about inflation, GDP, interest rates, crises, it pulls academic sources + summarizes trends for you.

## Tech Stack
- **Next.js**
- **Vercel AI SDK** for chat experience
- **Valyu DeepSearch** for academic + economic retrieval
- **OpenAI** for synthesis

## Features

- **Dual Mode Comparison**: Toggle between Valyu + OpenAI and OpenAI-only modes
- **Structured Markdown Responses**: Formatted responses with headings, lists, and emphasis
- **Mock Mode**: Test the app without using real API keys (saves credits!)

## Getting Started

### Option 1: Mock Mode (No API Keys Required)

To test the app without using real API keys:

1. Create a `.env.local` file in the root directory:
```bash
USE_MOCK_DATA=true
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser

**Note**: In mock mode, the app uses simulated data to demonstrate the difference between Valyu+OpenAI and OpenAI-only responses. No API credits are used.

### Option 2: Real API Mode

To use real APIs:

1. Create a `.env.local` file with your API keys:
```bash
VALYU_API_KEY=your_valyu_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
USE_MOCK_DATA=false
```

2. Run the development server:
```bash
npm run dev
```

## Environment Variables

- `USE_MOCK_DATA` or `MOCK_MODE`: Set to `"true"` to enable mock mode (no API calls)
- `VALYU_API_KEY`: Your Valyu API key (required only if not using mock mode and Valyu is enabled)
- `OPENAI_API_KEY`: Your OpenAI API key (required only if not using mock mode)

## Usage

1. Toggle between "Valyu + OpenAI" and "OpenAI Only" modes using the switch in the header
2. Ask macroeconomics questions
3. Compare responses to see the difference between data-enhanced and standard responses
4. Responses are formatted with markdown (headings, lists, bold, etc.)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
