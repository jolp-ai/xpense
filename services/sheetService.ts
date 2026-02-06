import { Expense, UserProfile, Wallet } from '../types';

const SHEET_TITLE = 'xPense_Expenses';
// drive.file access is required to create the sheet in the user's Drive without asking for full Drive access.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

let tokenClient: any;
let accessToken: string | null = null;

// The previous default ID was restricted. Users must provide their own Client ID for their specific domain.
const DEFAULT_CLIENT_ID = '75565530040-44sq4qh3ael2b1k7enseeulphv986opu.apps.googleusercontent.com';

const getClientId = () => {
  // Priority: Environment Variable -> Hardcoded Default.
  // We strictly ignore localStorage here to prevent the app from using an old, invalid, or deleted Client ID 
  // that might have been saved by the user in a previous version of the settings.
  return process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
};

export const initGoogleAuth = (onSuccess: () => void) => {
  const clientId = getClientId();
  
  if (!clientId) {
    return;
  }

  // @ts-ignore
  if (window.google) {
    try {
        // @ts-ignore
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          ux_mode: 'popup',
          callback: (response: any) => {
            if (response.access_token) {
              accessToken = response.access_token;
              localStorage.setItem('google_access_token', accessToken);
              onSuccess();
            } else if (response.error) {
                console.error("Google Auth Error:", response);
                if (response.error === 'access_denied') {
                    alert("Access denied. If you are the developer, please ensure your email is added to the 'Test Users' list in Google Cloud Console > OAuth Consent Screen.");
                } else {
                    alert(`Google Sign-In failed: ${response.error}`);
                }
            }
          },
        });
    } catch (e) {
        console.error("Error initializing Google Auth", e);
    }
    
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      accessToken = storedToken;
      onSuccess();
    }
  }
};

export const signInToGoogle = () => {
  const clientId = getClientId();
  if (!clientId) {
      alert("Please configure your Google Client ID in Settings > Advanced to enable sync.");
      return;
  }

  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    initGoogleAuth(() => {});
    // Retry once after short delay if not initialized
    setTimeout(() => {
        if(tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.error("Google Auth not initialized");
             alert("Google Auth failed to load. Please refresh the page or check your Client ID.");
        }
    }, 1000);
  }
};

export const signOutFromGoogle = () => {
  accessToken = null;
  localStorage.removeItem('google_access_token');
  // @ts-ignore
  if (window.google && accessToken) google.accounts.oauth2.revoke(accessToken, () => {});
};

export const isAuthenticated = () => !!accessToken;

export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!accessToken) return null;
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return { name: data.given_name || data.name, picture: data.picture };
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch profile", e);
    return null;
  }
};

const findOrCreateSheet = async (): Promise<string | null> => {
  if (!accessToken) return null;

  try {
    // 1. Search for file
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // 2. Create if not exists
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: SHEET_TITLE,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      }),
    });
    const fileData = await createRes.json();
    const spreadsheetId = fileData.id;

    // 3. Add Header Row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:F1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['Date', 'Category', 'Description', 'Amount', 'Currency', 'Wallet']],
        }),
      }
    );

    return spreadsheetId;
  } catch (error) {
    console.error("Error finding/creating sheet:", error);
    return null;
  }
};

export const syncExpenseToSheet = async (expense: Expense, currency: string, walletName: string) => {
  if (!accessToken) return;

  try {
    const spreadsheetId = await findOrCreateSheet();
    if (!spreadsheetId) return;

    const values = [[
      expense.date.split('T')[0], // Simple date format
      expense.category,
      expense.description,
      expense.amount,
      currency,
      walletName
    ]];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
  } catch (error) {
    console.error("Failed to sync row:", error);
  }
};

export const fetchExpensesFromSheet = async (wallets: Wallet[]): Promise<Expense[]> => {
  if (!accessToken) return [];

  try {
    const spreadsheetId = await findOrCreateSheet();
    if (!spreadsheetId) return [];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:F?valueRenderOption=FORMATTED_VALUE`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!response.ok) return [];

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) return [];

    return rows.map((row: string[]) => {
       // Row structure: [Date, Category, Description, Amount, Currency, Wallet]
       // Formatted values come as strings.
       
       const dateStr = row[0];
       const category = row[1];
       const description = row[2];
       // Remove any currency symbols or commas for parsing
       const amountStr = row[3] ? row[3].toString().replace(/[^0-9.-]+/g,"") : "0";
       const amount = parseFloat(amountStr);
       const walletName = row[5];
       
       const wallet = wallets.find(w => w.name.toLowerCase() === (walletName || '').toLowerCase());
       
       return {
         id: crypto.randomUUID(), // Generate temp ID
         date: new Date(dateStr).toISOString(),
         category: category || 'Other',
         description: description || 'Synced',
         amount: isNaN(amount) ? 0 : amount,
         walletId: wallet ? wallet.id : wallets[0]?.id,
         createdAt: Date.now()
       } as Expense;
    }).filter((e: Expense) => e.amount > 0 && !isNaN(new Date(e.date).getTime()));

  } catch (e) {
    console.error("Error fetching sheet", e);
    return [];
  }
};