# Premium Architecture, Multimodal AI & LSTM Upgrade Plan

## User Review Required

> [!IMPORTANT]
> I have incorporated your requests for the Matrix Dot background, forced dark mode, and Multimodal AI. Please review this finalized plan. Once approved, I will begin execution immediately to meet your 6-hour deadline!

## 1. Upgrading the ML Model (PyTorch LSTM)
Currently, `AlphaEngine` uses a Prophet + XGBoost hybrid. We will upgrade this to a **Long Short-Term Memory (LSTM)** neural network using **PyTorch**.
- LSTMs are the gold standard for financial time-series forecasting.
- We will construct a PyTorch `nn.Module`, normalize the stock data using `MinMaxScaler`, and use a rolling window to predict the next 7 days.

## 2. Multimodal AI Integration (Gemini 1.5)
Since you are using Gemini 1.5, we have access to **Multimodal** capabilities (vision + text).
- **The Feature:** We will add the ability for users to upload screenshots of stock charts, SEC filings, or financial statements directly into the Nexus chat.
- **How it works:** The LangGraph agent will process the image alongside the user's prompt, allowing the AI to perform technical analysis on visual charts.

## 3. Redesigning to a "Premium Fintech" Aesthetic
We will transition the app from a "flashy" look to a sleek, high-end institutional terminal.

- **Forced Dark Mode:** We will lock the app into a premium dark theme. Deep Obsidian Black (`#09090b`) backgrounds, crisp Zinc borders (`#27272a`), and pure white text.
- **Hero Section (Matrix Dots):** I will design a subtle, animated "matrix dot" or grid pattern for the background of the hero section. This gives a highly technical, quantitative feel (reminiscent of high-frequency trading dashboards).
- **Fintech UI Elements:** We will add stark "Terminal Green" for positive trends and "Alert Red" for negative trends. All heavy blurs and gradients will be replaced by crisp 1px borders and solid flat surfaces.

## Verification Plan
1. I will write the new PyTorch LSTM `AlphaEngine` and run backend tests.
2. I will update `ai.py` to handle multimodal image inputs.
3. I will overwrite `index.css` and the React components to implement the Matrix Dot background and forced dark mode.
