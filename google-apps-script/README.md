# Google Sheets Reviews

1. Create or open a Google Sheet.
2. Open **Extensions > Apps Script** and paste `Code.gs` into the editor.
3. In **Project Settings**, enable **Show `appsscript.json` manifest file in editor**.
4. Replace the manifest scopes with the contents of `appsscript.json` in this folder. Do not keep old `userinfo`, legacy Google APIs, or unrecognized scope strings.
5. In the Apps Script editor, select `authorizeServices` in the function dropdown and click **Run**. Approve the requested spreadsheet and email permissions. This function does not send an email or modify sheet data.
6. Deploy it as a **Web app**.
7. Set **Execute as** to your account and **Who has access** to **Anyone**.
8. Copy the `/exec` URL into `.env`:

```env
VITE_REVIEW_SHEETS_URL=https://script.google.com/macros/s/your-script-id/exec
```

Restart Vite after changing `.env`. The first submitted review creates a `Reviews` sheet and its header row automatically. The script needs permission to edit the spreadsheet on its first run.

The manifest uses only these valid scopes:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/script.send_mail`

If the OAuth error continues, open the Apps Script manifest and delete any other `oauthScopes` entries, save, then create a new web-app deployment. The manifest is applied in Apps Script, not by the React build.

If no permission dialog appears, make sure you are running `authorizeServices` from the Apps Script editor under the Google account that owns the script. Opening the deployed `/exec` URL does not open the editor authorization dialog. Also check **Executions** for a completed run, then redeploy the web app with **Execute as: Me**.

## Products sheet

Create a `Products` tab with these columns:

| Item ID | Item | Item Weight | Price |
| --- | --- | --- | --- |
| 1 | Goda Masala | 100 g | 120 |

The order page reads this tab through the same Apps Script URL as reviews. The `Item ID` must match the product IDs used by the app. If the tab is empty or unavailable, the app uses its built-in catalog values.

## Delivery configuration

Create a `Settings` tab with `Key` and `Value` columns:

| Key | Value |
| --- | --- |
| shopCity | Bangalore |
| shopState | Karnataka |
| buffer | 15 |
| zoneCities | Mumbai, Delhi, Hyderabad |
| upiId | yourname@upi |
| orderNotificationEmail | shop@example.com |

Create a `DeliveryConfig` tab with these exact columns:

| Weight Slab | Local | Within State | Zone / Metro | Other States |
| --- | ---: | ---: | ---: | ---: |
| Upto 500 grams | 28 | 76 | 82 | 90 |
| 501 - 1000 grams | 48 | 101 | 137 | 143 |
| 1001 - 1500 grams | 60 | 130 | 182 | 228 |
| 1501 - 2000 grams | 87 | 178 | 254 | 319 |
| 2001 - 3000 grams | 116 | 243 | 355 | 450 |
| 3001 - 4000 grams | 145 | 298 | 441 | 560 |
| 4001 - 5000 grams | 174 | 361 | 539 | 686 |
| Additional 1 kilogram | 35 | 60 | 95 | 120 |

The app fetches this configuration as JSON on load. Cart weight is calculated from each selected product weight and quantity. The configured buffer is added to the selected tariff. For weights above 5 kg, the additional-kilogram tariff is applied for every started kilogram.

`upiId` enables the dynamic UPI QR option. The QR amount is generated from the invoice total. QR scanning alone does not confirm payment, so UPI QR orders are saved with `Pending` status until payment is verified separately. `orderNotificationEmail` receives the order ID, customer details, items, payment method, status, and total after the order is saved.