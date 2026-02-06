import { GoogleGenAI, Type } from "@google/genai";
import { ParsedExpense, Expense, Language } from "../types";

const EXPENSE_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The cost of this specific item. Set to 0 if no valid expense is detected." },
    category: { 
      type: Type.STRING, 
      description: "The category of the expense. Choose from: Food, Transport, Shopping, Bills, Entertainment, Health, Other.",
    },
    description: { type: Type.STRING, description: "A brief description of what was purchased." },
    date: { type: Type.STRING, description: "The date of the expense in ISO 8601 format (YYYY-MM-DD). Use today's date if not specified." },
    wallet: { type: Type.STRING, description: "The name of the wallet or payment method used (e.g., Cash, Visa, Bkash). Matches closest available wallet." }
  },
  required: ["amount", "category", "description"],
};

const EXPENSE_LIST_SCHEMA = {
  type: Type.ARRAY,
  items: EXPENSE_ITEM_SCHEMA,
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const parseExpenseFromAudio = async (base64Audio: string, mimeType: string, currencyCode: string, availableWallets: string[], language: Language): Promise<ParsedExpense[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const result = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        {
          text: `Listen to this audio log. Extract all expenses mentioned. Return a list of expenses. 
          If multiple items are listed, split them.
          User's preferred currency: ${currencyCode}. If no currency is spoken, assume ${currencyCode}.
          Available Wallets/Payment Methods: [${availableWallets.join(', ')}].
          If the user mentions a payment method (e.g. "paid by card", "from bKash"), map it to the closest name in the available list. If unsure or not mentioned, leave the wallet field empty.
          Date default: ${new Date().toISOString().split('T')[0]}.
          Output Language: Translate the 'description' field to ${language}.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: EXPENSE_LIST_SCHEMA,
    },
  });

  try {
    const parsed = JSON.parse(result.text || "[]");
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return [];
  }
};

export const parseExpenseFromImage = async (base64Image: string, mimeType: string, currencyCode: string, availableWallets: string[], language: Language): Promise<ParsedExpense[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const result = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        {
          text: `Analyze this image (receipt). Extract expenses.
          User's preferred currency: ${currencyCode}.
          Available Wallets: [${availableWallets.join(', ')}].
          Try to identify payment method from the receipt text (e.g. Cash, Card ****1234) and map to available list.
          Date default: ${new Date().toISOString().split('T')[0]}.
          Output Language: Translate the 'description' field to ${language} if possible.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: EXPENSE_LIST_SCHEMA,
    },
  });

  try {
    const parsed = JSON.parse(result.text || "[]");
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return [];
  }
};

export const parseExpenseFromText = async (text: string, currencyCode: string, language: Language): Promise<ParsedExpense[]> => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";
    const result = await ai.models.generateContent({
      model,
      contents: `Extract expenses from: "${text}".
      User currency: ${currencyCode}.
      Date default: ${new Date().toISOString().split('T')[0]}.
      Output Language: Translate description to ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: EXPENSE_LIST_SCHEMA,
      },
    });
  
    try {
      const parsed = JSON.parse(result.text || "[]");
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error("Failed to parse JSON", e);
      return [];
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string, language: Language): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const result = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        {
          text: `Transcribe the spoken language in this audio exactly. Return only the text. If silence, return empty string. 
          The user is likely speaking in ${language} or English.`,
        },
      ],
    },
  });

  return result.text?.trim() || "";
};

export const askAiAboutExpenses = async (query: string, expenses: Expense[], currencyCode: string, language: Language): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  
  const dataContext = expenses
    .slice(0, 500)
    .map(e => `${e.date}|${e.category}|${e.description}|${e.amount}`)
    .join('\n');

  const systemInstruction = `You are a helpful financial assistant for 'xPense'. 
  Access to user's expense history (CSV: Date|Category|Description|Amount).
  Currency: ${currencyCode}.
  Today: ${new Date().toISOString().split('T')[0]}.
  Reply in the ${language} language.
  Answer concisely.`;

  const result = await ai.models.generateContent({
    model,
    contents: `Expense Data:\n${dataContext}\n\nUser Question: ${query}`,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return result.text || "I couldn't analyze the data at this moment.";
};