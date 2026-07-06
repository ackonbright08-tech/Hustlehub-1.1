import { Gig } from '../types';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

// Fetch HustleHub spreadsheets from the user's Google Drive
export const listHustleHubSpreadsheets = async (accessToken: string): Promise<SpreadsheetInfo[]> => {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and name contains 'HustleHub' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      throw new Error('Failed to list spreadsheets from Google Drive');
    }
    
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    throw error;
  }
};

// Create a brand new Google Sheet for HustleHub
export const createHustleHubSpreadsheet = async (accessToken: string, title = 'HustleHub Ghana Gigs'): Promise<SpreadsheetInfo> => {
  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
      }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to create new spreadsheet');
    }
    
    const data = await res.json();
    
    // Get the web view link of the newly created file via Drive API
    let webViewLink = '';
    try {
      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.spreadsheetId}?fields=webViewLink`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        webViewLink = driveData.webViewLink;
      }
    } catch (e) {
      console.warn('Failed to fetch webViewLink for spreadsheet:', e);
    }
    
    return {
      id: data.spreadsheetId,
      name: title,
      webViewLink,
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
};

// Export active gigs to a specific Google Sheet
export const exportGigsToSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string,
  gigs: Gig[]
): Promise<void> => {
  try {
    // 1. Fetch spreadsheet metadata to get the first sheet's real name
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!metaRes.ok) {
      throw new Error('Failed to fetch spreadsheet metadata');
    }
    
    const metaData = await metaRes.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
    
    // 2. Format columns as rows
    const headerRow = [
      'Gig ID',
      'Title',
      'Category',
      'Budget (GHS)',
      'WhatsApp Contact',
      'Location',
      'Poster Name',
      'Duration',
      'Key Requirements',
      'Created At',
      'Description',
      'User Phone'
    ];
    
    const dataRows = gigs.map(gig => [
      gig.id,
      gig.title,
      gig.customCategory || gig.category,
      gig.budget,
      `+${gig.whatsapp}`,
      gig.location,
      gig.posterName,
      gig.duration || 'One-time',
      (gig.requirements || []).join(', '),
      gig.createdAt,
      gig.description,
      gig.userPhone || ''
    ]);
    
    const values = [headerRow, ...dataRows];
    
    // 3. Clear existing content to avoid leaving trails from shorter lists
    // We use a safe broad range to clear
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    // 4. Update the sheet values
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );
    
    if (!updateRes.ok) {
      throw new Error('Failed to update spreadsheet data');
    }
    
    // 5. Stylize the spreadsheet headers for an extremely professional look (Bold header, frozen top row)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Freeze first row
          {
            updateSheetProperties: {
              properties: {
                sheetId: metaData.sheets?.[0]?.properties?.sheetId || 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          // Format first row as bold text with light grey background
          {
            repeatCell: {
              range: {
                sheetId: metaData.sheets?.[0]?.properties?.sheetId || 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headerRow.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.95, blue: 0.95 },
                  textFormat: {
                    bold: true,
                    fontSize: 10,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
    
  } catch (error) {
    console.error('Error exporting gigs:', error);
    throw error;
  }
};

// Import gigs from a specific Google Sheet
export const importGigsFromSpreadsheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<Gig[]> => {
  try {
    // 1. Fetch spreadsheet metadata to get the first sheet's real name
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!metaRes.ok) {
      throw new Error('Failed to fetch spreadsheet metadata');
    }
    
    const metaData = await metaRes.json();
    const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
    
    // 2. Fetch the values
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:L1000`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      throw new Error('Failed to read spreadsheet values');
    }
    
    const data = await res.json();
    const rows = data.values as string[][];
    
    if (!rows || rows.length <= 1) {
      return [];
    }
    
    // 3. Parse headers and rows
    const importedGigs: Gig[] = [];
    
    // Header format: ['Gig ID', 'Title', 'Category', 'Budget (GHS)', 'WhatsApp Contact', 'Location', 'Poster Name', 'Duration', 'Key Requirements', 'Created At', 'Description', 'User Phone']
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2 || !row[1]) continue; // Title is required
      
      const requirementsStr = row[8] || '';
      const requirements = requirementsStr
        ? requirementsStr.split(',').map(r => r.trim()).filter(Boolean)
        : [];
      
      // Attempt clean WhatsApp number
      let rawWhatsApp = row[4] || '';
      const cleanedWhatsApp = rawWhatsApp.replace(/\D/g, '') || '233240000000';
      
      importedGigs.push({
        id: row[0] || `gig-imported-${Date.now()}-${i}`,
        title: row[1],
        category: (row[2] || 'other').toLowerCase(),
        budget: parseFloat(row[3]) || 0,
        whatsapp: cleanedWhatsApp,
        location: row[5] || 'Accra',
        posterName: row[6] || 'Community Poster',
        duration: row[7] || 'One-time',
        requirements,
        createdAt: row[9] || new Date().toISOString(),
        description: row[10] || '',
        userPhone: row[11] || '',
      });
    }
    
    return importedGigs;
  } catch (error) {
    console.error('Error importing gigs:', error);
    throw error;
  }
};
