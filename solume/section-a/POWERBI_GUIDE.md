# Section A ΓÇö Power BI Step-by-Step Guide

Dataset: `BMW_global_sales_2018-2025.zip` ΓåÆ `bmw_global_sales_2018_2025.csv`

---

## Step 1 ΓÇö Load the Data

1. Open **Power BI Desktop**.
2. Click **Home ΓåÆ Get Data ΓåÆ Text/CSV**.
3. Select `bmw_global_sales_2018_2025.csv`.
4. In the preview window click **Transform Data** (do NOT click Load yet ΓÇö we need to clean first).

---

## Step 2 ΓÇö Power Query: Data Cleaning

You are now in the **Power Query Editor**.

### Fix 1 ΓÇö Clamp negative BEV_Share to 0

1. Select the `BEV_Share` column.
2. In the ribbon: **Add Column ΓåÆ Custom Column**.
3. Name it `BEV_Share_Clean`, formula:
   ```
   if [BEV_Share] < 0 then 0 else [BEV_Share]
   ```
4. Right-click the original `BEV_Share` column ΓåÆ **Remove**.
5. Right-click `BEV_Share_Clean` ΓåÆ **Rename** ΓåÆ `BEV_Share`.

### Fix 2 ΓÇö Flag pre-launch i4/iX rows (before 2021)

1. **Add Column ΓåÆ Custom Column**, name `DataQualityFlag`, formula:
   ```
   if ([Model] = "i4" or [Model] = "iX") and [Year] < 2021
   then "Pre-launch noise"
   else "Clean"
   ```

### Fix 3 ΓÇö Correct column types

Ensure these types are set (click column header ΓåÆ **Data Type**):
- `Year`, `Month`: Whole Number
- `Units_Sold`, `Avg_Price_EUR`, `Revenue_EUR`: Whole Number / Fixed Decimal
- `BEV_Share`, `Premium_Share`, `GDP_Growth`, `Fuel_Price_Index`: Decimal Number
- `Region`, `Model`, `DataQualityFlag`: Text

### Apply & Close

Click **Home ΓåÆ Close & Apply**.

---

## Step 3 ΓÇö Create a Calculated Column (for Q B)

In **Data view** (table icon on left sidebar), select the table, then:

**Table Tools ΓåÆ New Column**:
```
GDP_Bucket = 
IF([GDP_Growth] < 2, "Low (<2%)",
   IF([GDP_Growth] <= 4, "Medium (2ΓÇô4%)",
   "High (>4%)"))
```

---

## Step 4 ΓÇö Page 0: Data Quality

1. Right-click the page tab ΓåÆ **Rename** ΓåÆ `0 - Data Quality`.
2. Add a **Card** visual:
   - Field: count of rows where `DataQualityFlag = "Pre-launch noise"` ΓÇö create a measure:
     ```
     FlaggedRows = COUNTROWS(FILTER('bmw_global_sales_2018_2025', [DataQualityFlag] = "Pre-launch noise"))
     ```
   - Place this measure in the Card.
3. Add another **Card** for clean rows:
   ```
   CleanRows = COUNTROWS(FILTER('bmw_global_sales_2018_2025', [DataQualityFlag] = "Clean"))
   ```
4. Add a **Table** visual with columns: `Year`, `Month`, `Region`, `Model`, `BEV_Share`, `DataQualityFlag`.
   - In the Filters pane on the right, filter `DataQualityFlag` to show only flagged rows.

---

## Step 5 ΓÇö Page 1: Question A (BEV & Electrification)

Add a new page, rename it `1 - Q A: Electrification`.

### Chart 1 ΓÇö BEV_Share trend by Region
- Visual: **Line Chart**
- X-axis: `Year`
- Y-axis: `Average of BEV_Share`
- Legend: `Region`
- Title: "BEV Share Trend by Region (2018ΓÇô2025)"

### Chart 2 ΓÇö BEV_Share vs Units_Sold correlation
- Visual: **Line and Clustered Column Chart**
- X-axis: `Year`
- Column Y-axis: `Sum of Units_Sold`
- Line Y-axis: `Average of BEV_Share`
- Title: "Units Sold vs BEV Share"
- Add a **Slicer** on `Region` so the user can filter per region.

### Chart 3 ΓÇö BEV_Share vs Revenue_EUR correlation
- Visual: **Line and Clustered Column Chart**
- X-axis: `Year`
- Column Y-axis: `Sum of Revenue_EUR`
- Line Y-axis: `Average of BEV_Share`
- Title: "Revenue EUR vs BEV Share"
- Same Region slicer applies.

### Chart 4 ΓÇö Region comparison matrix
- Visual: **Matrix**
- Rows: `Region`
- Columns: `Year`
- Values: `Average of BEV_Share`
- Apply conditional formatting: **Home ΓåÆ Conditional Formatting ΓåÆ Background Color** (gradient lowΓåÆhigh) to highlight strongest transitions.

### Chart 5 ΓÇö KPI: Highest BEV_Share region in 2025
- Create a measure:
  ```
  BEV_2025_Max = CALCULATE(MAX([BEV_Share]), [Year] = 2025)
  ```
- Visual: **Card** showing this measure.
- Add a **Card** or **Slicer** to show which Region has max BEV in 2025.

---

## Step 6 ΓÇö Page 2: Question B (Price Elasticity)

Add a new page, rename it `2 - Q B: Price Elasticity`.

### Chart 1 ΓÇö Scatter: Price vs Demand
- Visual: **Scatter Chart**
- X-axis: `Average of Avg_Price_EUR`
- Y-axis: `Sum of Units_Sold`
- Legend: `Model`
- Play Axis: `Year` (optional ΓÇö shows evolution over time)
- Title: "Price vs Units Sold by Model (Elasticity Signal)"
- *Downward slope = negative elasticity (higher price ΓåÆ fewer units sold)*

### Chart 2 ΓÇö Price elasticity by GDP bucket
- Visual: **Clustered Bar Chart**
- Y-axis: `Model`
- X-axis: `Average of Units_Sold`
- Legend: `GDP_Bucket`
- Title: "Avg Units Sold by Model and GDP Conditions"

### Chart 3 ΓÇö Matrix: Model ├ù GDP_Bucket
- Visual: **Matrix**
- Rows: `Model`
- Columns: `GDP_Bucket`
- Values: `Average of Units_Sold` and `Average of Avg_Price_EUR`
- This shows how price levels and demand volumes differ across economic conditions per model.

### Slicer
- Add a `Year` slicer for drill-down.

---

## Step 7 ΓÇö Page 3: Question C (Seasonality)

Add a new page, rename it `3 - Q C: Seasonality`.

### Chart 1 ΓÇö Revenue_EUR seasonal pattern
- Visual: **Line Chart**
- X-axis: `Month`
- Y-axis: `Average of Revenue_EUR`
- Legend: `Region`
- Title: "Avg Monthly Revenue EUR by Region"
- *Tip: collapse all years by NOT adding Year to the axis ΓÇö Power BI averages across all years automatically.*

### Chart 2 ΓÇö Units_Sold seasonal pattern
- Visual: **Line Chart**
- X-axis: `Month`
- Y-axis: `Average of Units_Sold`
- Legend: `Region`
- Title: "Avg Monthly Units Sold by Region"

### Chart 3 ΓÇö Economic indicators vs Revenue_EUR
- Visual: **Line and Clustered Column Chart**
- X-axis: `Month`
- Column Y-axis: `Average of Revenue_EUR`
- Line Y-axis: `Average of GDP_Growth` (add a second line for `Average of Fuel_Price_Index`)
- Title: "Economic Indicators vs Revenue EUR (Seasonal)"

### Chart 4 ΓÇö Economic indicators vs Units_Sold
- Same as Chart 3 but Column Y-axis: `Average of Units_Sold`
- Title: "Economic Indicators vs Units Sold (Seasonal)"

### Slicers
- Add `Year` and `Region` slicers for interactive filtering.

---

## Step 8 ΓÇö Save and Export

1. **File ΓåÆ Save As** ΓåÆ `bmw_analysis.pbix`
2. Save it to the `section-a/` folder.

---

## Tips

- Keep `DataQualityFlag = "Clean"` filter active on all analysis pages (Pages 1ΓÇô3) using the **Filters pane** ΓåÆ add `DataQualityFlag` as a page-level filter set to `"Clean"`. This excludes the 9 negative BEV and 288 pre-launch rows from analysis.
- Use **Format ΓåÆ Title** on each visual to add descriptive titles.
- Use **View ΓåÆ Themes** for a consistent colour scheme.
