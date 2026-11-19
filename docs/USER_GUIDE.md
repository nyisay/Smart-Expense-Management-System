# Smart Expense website user guide

Guide for the current project version, reviewed on **12 November 2026**. A deployed website must be updated to include these features; an older deployment may look or behave differently.

Smart Expense records personal income and expenses, shows spending reports, reviews receipt suggestions and tracks shared bills. Currency is **MMK (Ks), in whole kyat**. Reporting uses **Asia/Yangon**. The website does not connect to your bank or send payments.

## 1. Start here

1. Open the website address supplied by the project owner.
2. Choose **Create an account**, enter your name, email and a password of **12–128 characters**, then select **Register**.
3. The website opens **Login** automatically. Enter your email and password, then select **Sign in**.
4. Open **Transactions** and create an income or expense record.
5. Return to **Dashboard** to see your saved records in the summaries and charts.

Registration requires a separate sign-in. Its confirmation is intentionally generic. If you already registered that email, use the account's existing password. Invalid or failed registration stays on sign-up with feedback.

Use the eye icon to show or hide a password while typing. The application currently has no password-reset or email-change screen.

## 2. Find your way around

| Navigation item | What you can do | Page path |
| --- | --- | --- |
| Dashboard | View totals, category spending, monthly trends, insights and recent transactions | `/dashboard` |
| Transactions | Create, view, edit, delete, search and filter personal entries | `/transactions` |
| Receipt Scanner | Upload an image, extract suggestions, correct them and save an expense | `/receipts/new` |
| Groups & Splitting | Manage groups, uneven bills and recorded repayments | `/groups` |
| Analytics | Compare income, expenses and cash-flow trends | `/analytics` |
| Budgets | Set monthly spending limits by expense category | `/budgets` |
| Settings | Edit your name/photo, view account information and change your password | `/app` |

On desktop, use the left sidebar. **Collapse sidebar** switches it to icons; hover an icon for its label. On mobile, use **Open navigation** in the header. The profile menu also opens **Account settings**. Back links return to the relevant list or Dashboard.

Dialogs and dropdowns have brief opening/closing animations. Your system's reduced-motion preference disables the added motion.

## 3. Enter amounts and dates

- Enter an amount as digits, such as `12500`. The website formats it as MMK 12,500.
- Personal income/expense amounts and bill totals must be positive whole kyat. Choose the transaction type rather than entering a negative amount.
- Group shares can be zero when someone does not share a bill. Percentage shares can have up to two decimal places.
- Use the calendar icon to choose a date. You can also type `YYYY-MM-DD`, such as `2026-11-12`.
- The calendar supports month navigation, direct year entry, **Today** and **Clear**. Required dates cannot remain empty.
- Budget months use `YYYY-MM`, such as `2026-11`, or the month picker.
- A reporting range includes both its **From** and **To** dates. The end must not precede the start.
- Dashboard/Analytics custom ranges support up to 120 calendar months.

## 4. Manage personal transactions

### Add income or an expense

1. Open **Transactions**, then **New transaction**. Dashboard also offers **Add transaction**.
2. Select **Type**: Income or Expense.
3. Enter **Amount (MMK)**.
4. Select a matching **Category** and the transaction **Date**.
5. Optionally enter the merchant/source and a note.
6. Select **Create transaction**. Check the saved detail page and confirmation.

Changing Type clears the category selection, so choose a category again. Categories are supplied by the application; there is currently no category-management screen.

### Find records

Use the filters above the list, then select **Apply**:

- **Type** and **Category** narrow the kind of entry.
- **From** and **To** restrict its date.
- **Search merchant or note** searches those text fields.
- **Minimum (MMK)** and **Maximum (MMK)** restrict the amount, including the boundary values.

You can combine filters. **Reset** clears them. Use **Previous** and **Next** when more than 20 matching records span multiple pages. Filters are retained through pagination and the normal detail/edit/back links.

### Edit or delete

Open the record, select **Edit transaction**, change its fields and select **Save changes**. For deletion, choose **Delete**, review the confirmation and select **Delete permanently** only when you intend to remove the record. Cancel keeps it.

Editing or deleting a personal expense changes the relevant reports and budget spending. Deletion cannot be undone through the website. If a record changed in another tab, reload its latest version before editing again.

## 5. Understand Dashboard

Dashboard starts with the current calendar month. Choose **This month**, **Month to date**, **Last 6 months**, **Year to date**, or enter a custom range and select **Apply filters**.

### Summary cards

- **Income**: recorded personal income matching the selection.
- **Expenses**: recorded personal expenses matching the selection.
- **Balance**: selected income minus selected expenses. This is not a bank balance or an opening balance.
- **Savings rate**: recorded net cash flow as a percentage of income. It is unavailable when the selection contains no income.

Group bills and repayments are separate from these personal totals.

### Income, expenses and net cash flow

The cash-flow chart compares monthly income/expense bars with a net cash-flow line. Open **View exact cash flow amounts** for its table. Use Analytics for selectable cash-flow modes and month drill-down.

### Category donut and related transactions

Select a donut segment or its category button to filter the report and related transactions. Choose **Clear category selection**, select the category again, or select **All categories** in the filter to clear it.

An expense-category filter also applies to the summary cards. For example, selecting Food excludes income records, so Income can show zero and Balance can become negative. Clear the category to see all income and expenses again.

### Monthly expense line chart

**Monthly expense trend** defaults to **Line chart**. **Trend view** also offers **Bar chart**, using the same totals.

- Select several months to see a connected trend. A one-month range correctly shows one point.
- Months without expenses count as zero.
- Hover a point, or focus the chart and use its arrow keys, for the exact MMK tooltip.
- Open **View exact monthly amounts** for the table.

The charts use saved account data. Date/category changes recalculate the report. They do not continuously stream changes from other devices; refresh when you need to check changes made elsewhere.

### Recent transactions and insights

The recent list shows up to eight matching entries. Open a record or use the list's transaction link to investigate further.

**Spending insights** shows the largest category, cash-flow savings rate, available spending comparisons and budget notices. These are rules based on recorded entries. Missing history can make a comparison unavailable. For a current-month comparison, **Month to date** avoids including future days.

## 6. Explore Analytics

1. Open **Analytics** and choose your date range/category.
2. Use **Chart view** to choose **Income vs expenses**, **Monthly net cash flow** or **Cumulative cash flow**.
3. Hover chart marks for exact values or open **View exact cash flow amounts**.
4. Click a cash-flow bar/line point, or use a month link in the exact table, to inspect that month.

Monthly net is income minus expenses for each month. Cumulative cash flow adds those monthly net values starting from zero at the beginning of the selection. It does not include an opening bank balance. Month drill-down retains the category and stays within any partial-month boundaries you selected.

Dashboard and Analytics retain reporting filters when switching between them. Analytics also includes the category donut and monthly expense Line/Bar view.

## 7. Set monthly category budgets

1. Open **Budgets**.
2. Pick the budget month and select **Choose month**.
3. Enter a positive whole-MMK limit beside an expense category.
4. Select **Save [category] budget**.

Each category shows actual spending, the saved limit, remaining amount or overspend, and a progress bar with numeric labels. Notices appear at 80%, at the limit and when over budget. A progress bar can stop visually at 100% while the overspend amount still shows the excess.

To change a limit, enter its new value and save. To stop budgeting that category/month, choose **Remove [category] limit**. Removing a budget preserves the transactions; entering zero is not the way to remove a limit.

Budget rules:

- Each calendar month is independent; unused allowance does not roll forward.
- A category without a saved limit is **Unbudgeted**.
- Actual spending covers the full selected month. Partial dashboard ranges do not prorate the budget.
- Only personal expenses count. Confirmed receipt expenses count as personal expenses; group bills and repayments do not.
- Dashboard/Analytics budget notices require a full calendar month. Use Budgets to inspect a full month's spending when viewing a partial report range.

## 8. Scan and review a receipt

1. Open **Receipt Scanner**. The page heading is **Receipt to expense**.
2. Choose one static **JPG, PNG or WebP** image, or drag it into the upload area. The limit is **4 MB (4,000,000 bytes)** and **20 megapixels**.
3. Check **Selected image preview**. Use a clear, well-lit image with the merchant, date and final total visible.
4. Select **Extract receipt**. Dropping or selecting an image alone does not start extraction.
5. Wait for the result. Extraction can take up to two minutes.
6. Review **Merchant**, **Final total (whole kyat)**, **Transaction date**, **Currency**, **Expense category** and any optional note.
7. Correct mistakes and enter any missing/uncertain fields. Check the final total rather than a subtotal, tax line or change amount.
8. Tick the review confirmation checkbox, then select **Confirm and save expense**.

Extraction is a suggestion. It never automatically saves a transaction. **Ks/kyat means MMK**, but automatic foreign-currency conversion is unavailable. Only select MMK when it is the receipt's actual currency.

The configured provider is shown on the page. Local processing uses Ollama; cloud processing sends the image to Ollama Cloud. Provider selection is configured by the project owner. The application does not permanently store receipt images. Cloud-provider handling is separate from application storage.

If extraction fails, use **Enter manually**. **Extract another image** starts a replacement extraction; check that the displayed review belongs to the receipt you intend to save. A failed replacement can leave the previous review visible.

Before saving, check that you have not already entered the purchase manually or saved another scan of the same receipt. Fresh scans are not a guarantee of duplicate detection.

## 9. Split group bills

### Create a group and participants

1. Open **Groups & Splitting**, then **Create group**.
2. Enter the group name and **Your participant name**, then create it.
3. Use **Add participant** to add each other person or guest by name.

The creator manages the group's records. Named guests do not automatically receive accounts, invitations or access. This version uses MMK and supports one payer per bill.

### Add an unequal bill

1. Choose **Add group expense**.
2. Enter **Bill title**, **Bill total (MMK)** and **Date**.
3. Select **Who paid?**.
4. In **Allocate shares by**, choose **Exact amounts (MMK)** or **Percentages**.
5. Enter every participant's share. Use zero for someone who does not share this bill.
6. Check **Exact saved shares**, then select **Save group expense**.

Exact amounts must sum to the bill total. Percentages must total exactly 100%, with at most two decimal places per percentage. Percentage calculations produce whole-kyat shares and allocate rounding remainders consistently so the final total remains exact. Check the preview before saving.

Choose the allocation mode before entering shares: changing modes resets the entered shares.

Example: Alice pays MMK 100,000. Alice's share is 40,000, Bob's is 35,000 and Carol's is 25,000. Alice is owed 60,000; Bob owes 35,000 and Carol owes 25,000. The same shares can be entered as 40%, 35% and 25%.

### Read balances and record repayments

**Who owes whom** suggests repayments based on all group bills and recorded repayments. Member cards distinguish amounts paid, shares owed, repayments sent/received and the net balance. A positive net means the member is owed money; a negative net means the member owes money.

After a real repayment happens outside the website:

1. Choose **Record repayment**.
2. Select **Who repaid?** and **Who received it?** carefully.
3. Enter **Repaid amount (MMK)** and **Repayment date**.
4. Confirm that the repayment actually happened and record it.

In the example, recording Bob's MMK 35,000 repayment to Alice settles Bob's balance and leaves Alice owed MMK 25,000 by Carol. Recording a repayment does not send money or create a personal transaction. Individual repayment editing/deletion is currently unavailable, so verify the direction and amount before confirming.

### Edit or delete group history

Use a bill's edit control to change it and **Save bill changes**. Editing replaces that bill's shares while keeping recorded repayments. **Delete bill** removes the bill and shares after confirmation; repayments still remain, so balances can change.

On the group list, **Delete group** opens a confirmation describing the whole history. **Delete group permanently** removes that group's participants, bills, shares and repayments. This cannot be undone through the website. Personal transactions remain unchanged, and deleting history does not refund anyone.

Group records never automatically enter personal reports. Avoid treating a group total as personal spending unless you intentionally create the appropriate personal entry yourself.

## 10. Manage your account

Open **Settings** or **Account settings** from the profile menu.

### Name and photo

- Change **Display name**, then select **Save profile**. **Reset changes** restores the last saved name.
- Choose a static JPG, PNG or WebP up to **2 MB**, then select **Upload photo**. Keep the subject centered: the application creates a square thumbnail. Source images must be within 12 megapixels.
- Upload another image to replace it, or choose **Remove photo** to restore initials.
- The saved photo appears in your account and navigation and is private to your signed-in workspace.

Email, currency and reporting timezone are read-only. Frosted Glass is the current appearance; there is no theme selector.

### Change your password

1. Under **Password & security**, enter your current password.
2. Enter a different new password of 12–128 characters and matching confirmation.
3. Select **Update password and sign out**.
4. Sign in again using the new password. Other sessions are rejected on their next authenticated request.

## 11. Sign out

Choose **Log out** in navigation or **Sign out** in Settings. In the confirmation, **No** or Escape keeps you signed in. **Yes** signs out and returns to Login. Password changes already explicitly sign out all sessions.

## 12. Keyboard controls

- Use Tab/Shift+Tab to move between controls and Enter/Space to activate buttons.
- Open a dropdown with its trigger, then use arrow keys/typeahead to choose an option. Escape closes it and returns focus.
- Activate a date's calendar icon, or press Alt+ArrowDown in its text field. Escape closes the calendar.
- Use the exact chart tables when hover or chart navigation is inconvenient.
- Required fields, inline messages and toast notifications explain unsuccessful actions. Wait for pending actions to finish before retrying.

## 13. Common questions and problems

| What you see | What to check |
| --- | --- |
| Empty Dashboard or Analytics | Save a personal transaction and check the date/category selection. A new account has no automatic financial demo data. |
| One dot in the monthly line chart | Only one month is selected. Choose Last 6 months or a longer custom range. |
| Income is zero after selecting a donut category | The expense-category filter excludes income. Clear it to restore the full range. |
| Savings rate or comparison unavailable | There is no matching income or enough earlier comparable history. Try Month to date or an ended range. |
| A budget shows a different amount from a partial report | Budgets use the full calendar month; the report may use a shorter range or another category. |
| Receipt Save is disabled | Complete/correct required review fields, use the actual supported MMK currency, tick confirmation and wait for extraction to finish. |
| Image rejected | Export a supported static image and check file size/pixel limits. Renaming an unsupported file's extension does not convert it. |
| No categories are available | Ask the project owner to initialize the supplied categories. Categories cannot currently be created in the website. |
| Receipt extraction fails | Check the error, retry with a clearer supported image, or choose Enter manually. The owner may need to check the configured provider. |
| Bill shares do not save | Exact shares must equal the total, or percentages must equal 100%. Check the payer and all participants. |
| A record changed in another tab | Preserve any unsaved notes you need, reload the latest record and reapply your intended change. |
| Login fails or a session expires | Check your credentials and sign in again. If attempts are limited, wait before retrying. A password change requires the new password. |
| Pages load slowly | Wait for loading to finish. If it persists, report the two pages and approximate delay to the owner, without sharing your password or private receipt. |
| The live website differs from this guide | Ask the project owner whether the latest version and required database migrations have been deployed. |

Currently unavailable: bank synchronization, automatic transfers, exchange-rate conversion, recurring transactions, CSV import/export, password recovery, email changes, account deletion and guest group invitations.

For installation and owner configuration, see [SETUP.md](SETUP.md). For the latest verification scope and remaining issues, see [SYSTEM_RECHECK.md](SYSTEM_RECHECK.md).
