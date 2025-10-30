# Claude Code Prompt: UK Self Assessment Tax Tracker

Build a local-first Python + Streamlit app that helps UK sole traders maintain Self Assessment records throughout the year and simplifies filing day.

## Core Requirements

**Target User**: Jemma, a UK taxpayer banking with NatWest, who exports monthly CSV transaction files.

**Key Features**:
1. Import NatWest CSV bank statements
2. Auto-categorize transactions using customizable rules
3. Quick personal vs business classification
4. Track expenses, income, mileage, and Gift Aid donations
5. Real-time year-to-date dashboard
6. Generate HMRC Self Assessment copy/paste summary
7. Export clean Excel workbook at year-end

## Technical Stack

- **Python 3.9+** with Streamlit for UI
- **SQLite + SQLAlchemy** for local data persistence
- **Pandas** for CSV processing
- **openpyxl** for Excel export
- **No cloud services** - completely offline and local-first

## Data Model

### Transactions (Inbox)
```
- id, date, description, paid_in, paid_out, balance
- transaction_type, guessed_type, guessed_category
- is_personal, reviewed, posted_to_ledger, notes
- import_hash (for duplicate detection)
```

### Income Ledger
```
- id, date, source, description, amount_gross, tax_deducted
- income_type: Employment/Self-employment/Interest/Dividends/Property/Other
- notes, transaction_id
```

### Expenses Ledger
```
- id, date, supplier, description, category, amount
- receipt_link, notes, transaction_id
```

### Mileage
```
- id, date, purpose, from_location, to_location, miles
- rate_per_mile (default £0.45), allowable (calculated)
- notes
```

### Donations
```
- id, date, charity, amount_paid, gift_aid (bool), notes
```

### Rules (Auto-categorization)
```
- id, match_mode (Contains/Equals/Regex), text_to_match
- map_to (Income/Expense/Ignore)
- income_type, expense_category, priority, enabled
```

### Settings
```
- key/value pairs for: tax_year, accounting_basis, timezone, 
  currency, mileage_rate, column mappings
```

## NatWest CSV Format

**Expected columns**: `Date, Type, Description, Paid out, Paid in, Balance`

**Handle variations**:
- Date formats: DD/MM/YYYY, YYYY-MM-DD, etc.
- Column names: "Paid out"/"Debit Amount", "Paid in"/"Credit Amount"
- Include column mapping UI for unexpected formats

**Test CSV**:
```csv
Date,Type,Description,Paid out,Paid in,Balance
01/04/2025,POS,SAINSBURYS 1234,-12.50,,1234.56
02/04/2025,CR,CLIENT PAYMENT REF 9876,,450.00,1684.56
03/04/2025,DD,NETFLIX,-15.99,,1668.57
04/04/2025,CR,NATWEST INTEREST,,0.85,1669.42
05/04/2025,POS,UBER TRIP,-18.20,,1651.22
```

## User Interface (Streamlit Pages)

### 1. Dashboard (Home)
**Display year-to-date totals**:
- Total income (all types)
- Self-employment turnover
- Employment income + PAYE tax deducted
- Total expenses
- Mileage allowance
- Gift Aid donations
- **Estimated self-employment profit** (turnover - expenses - mileage)

Use metrics, charts, and clear GBP formatting.

### 2. Inbox (Monthly Import Workflow)
**Step 1**: Upload CSV button → preview table
**Step 2**: Auto-apply rules → show guessed categories
**Step 3**: Quick classification:
- Toggle switches or checkboxes: Business / Personal / Ignore
- Filter to show only unreviewed items
- Inline category dropdown (if Business)
**Step 4**: "Post to Ledgers" button
- Moves Business Income → Income ledger
- Moves Business Expenses → Expense ledger
- Archives Personal/Ignore transactions
**Features**:
- Duplicate detection (warn if same date+description+amount)
- Keyboard shortcuts for fast review
- Bulk select/actions

### 3. Rules Editor
**Table of rules** with:
- Match mode dropdown (Contains/Equals/Regex)
- Text to match
- Map to (Income/Expense/Ignore)
- If Income → income type dropdown
- If Expense → expense category dropdown
- Priority (sorting)
- Enable/Disable toggle
- Add/Edit/Delete actions

**Default rules** (pre-populated):
```
Contains "SALARY" → Income (Employment)
Contains "CLIENT" → Income (Self-employment)
Contains "INTEREST" → Income (Interest)
Contains "DIVIDEND" → Income (Dividends)
Contains "NETFLIX" → Ignore
Contains "SAINSBURY" → Expense (Office costs)
Contains "UBER" → Expense (Travel)
```

### 4. Income
**Ledger table** showing:
- Date, Source, Description, Amount (gross), Tax deducted, Type
- Filter by income type
- Add manual entry form
- Edit/Delete actions
- Running total

### 5. Expenses
**Ledger table** showing:
- Date, Supplier, Description, Category, Amount, Receipt icon
- Filter by category
- Add manual entry form (with receipt link/file field)
- Edit/Delete actions
- Running total by category

### 6. Mileage
**Simple entry form**:
- Date, Purpose, From, To, Miles
- Rate per mile (default £0.45, editable)
- Auto-calculate: Allowable = Miles × Rate
- **Helper note**: "Over 10,000 miles, the rate is typically £0.25 for excess miles"
- Table view with total allowable amount

### 7. Donations
**Entry form**:
- Date, Charity name, Amount paid
- Gift Aid checkbox (default: Yes)
- Notes
- **Explanation**: "Record the amount you paid. HMRC will gross this up on the return."
- Table view with total

### 8. HMRC Summary (Copy/Paste Ready)
**Display formatted summary**:

```
Employment Income
├─ Gross pay: £X,XXX.XX → Copy to SA100 Box 1
└─ Tax deducted: £X,XXX.XX → Copy to SA100 Box 2

Self-Employment (Cash Basis)
├─ Turnover: £X,XXX.XX → Copy to SA103S Box 1
├─ Allowable expenses: £X,XXX.XX → Copy to SA103S Box 2
└─ Net profit: £X,XXX.XX → Copy to SA103S Box 3

Other Income
├─ UK Interest: £XXX.XX → Copy to SA100 Box 3
├─ UK Dividends: £X,XXX.XX → Copy to SA100 Box 4
└─ UK Property: £X,XXX.XX → Copy to SA105

Gift Aid Donations
└─ Total paid: £XXX.XX → Copy to SA100 Box 6
```

Include "Copy" buttons for each value.

### 9. Export
**Year-end export features**:
- **Excel workbook** with sheets:
  - Profile (settings)
  - Income
  - Expenses
  - Mileage
  - Donations
  - Summary (HMRC figures)
  - Rules
  - Archived Inbox (all reviewed transactions)
- **Individual CSV exports** for each ledger
- **Database backup** (download .db file)
- **Restore from backup** (upload .db file)

### 10. Settings
**Configuration form**:
- Tax year (e.g., 2024/25)
- Accounting basis (Cash/Accruals)
- Default mileage rate
- Currency symbol
- NatWest column mapping overrides
- Clear all data (with confirmation)

## Key Features & Rules

### Duplicate Detection
Generate hash: `md5(date + description + amount)`
- Warn user before importing duplicates
- Show: "5 transactions already exist in database"
- Allow user to skip or force import

### UK Formatting
- **Dates**: DD/MM/YYYY input, flexible parsing
- **Currency**: £X,XXX.XX format everywhere
- **Timezone**: Europe/London

### Expense Categories (Standard UK)
```
- Advertising & marketing
- Bank charges
- Insurance
- Legal & professional fees
- Office costs
- Phone & internet
- Postage & stationery
- Rent & rates
- Repairs & maintenance
- Software & subscriptions
- Staff costs
- Travel
- Other
```

### Income Types
```
- Employment (PAYE)
- Self-employment
- Interest
- Dividends
- Property
- Other
```

### Mileage Rates (2024/25)
- First 10,000 miles: £0.45/mile
- Over 10,000 miles: £0.25/mile
(App doesn't auto-split, just shows helper note)

## File Structure
```
uk-tax-tracker/
├── app.py                 # Main Streamlit app with all pages
├── models.py              # SQLAlchemy models & database setup
├── utils.py               # CSV parsing, date/currency helpers
├── requirements.txt       # Dependencies
├── README.md              # Setup & usage instructions
├── test_data.csv          # Example NatWest CSV
└── tax_records.db         # SQLite database (created on first run)
```

## Acceptance Criteria

✅ Upload test CSV → rules auto-apply → user marks business/personal → post to ledgers
✅ Dashboard shows correct YTD totals immediately
✅ HMRC Summary displays clearly labeled copy/paste fields
✅ Year-end Excel export generates all sheets with correct totals
✅ App runs completely offline (no external API calls)
✅ Duplicate transactions are detected and prevented
✅ Robust date parsing for UK formats
✅ Column mapping works for variations in CSV format

## Non-Functional Requirements

- **Privacy**: No analytics, no external calls, all data local
- **Performance**: Handle 1000+ transactions smoothly
- **Error handling**: Friendly messages for bad CSV, date parse failures
- **Simple setup**: `pip install -r requirements.txt && streamlit run app.py`
- **Keyboard friendly**: Tab navigation, Enter to submit, shortcuts for review

## Out of Scope (v1)

- Multiple businesses
- Property schedule
- Capital gains
- Payments on account calculator
- VAT tracking
- Receipt OCR/scanning
- Bank API integration
- Mobile app

---

## Implementation Notes

1. Start with `models.py` - define all SQLAlchemy models
2. Build `utils.py` - CSV parsing, date/currency helpers, rule application
3. Create `app.py` with Streamlit multipage structure:
   - Use `st.sidebar` for navigation
   - Each page as a function
   - Session state for database connection
4. Add default rules and settings on first run
5. Test with provided CSV data
6. Build HMRC summary with clear labeling
7. Implement Excel export with openpyxl
8. Write README with NatWest export instructions

## Success Metrics

- User can import a month's transactions in under 2 minutes
- Rules reduce manual categorization by 70%+
- HMRC summary is copy/paste ready (no mental math needed)
- Year-end export is comprehensive and professional

---

**Build this app to be simple, robust, and genuinely useful for UK sole traders doing Self Assessment. Focus on reducing friction in the monthly routine and making filing day stress-free.**
