# 💳 Credit Card Transaction Intelligence & Fraud Analytics Dashboard

A 4-page Power BI dashboard analyzing **1.3 million credit card transactions** using a star schema data model. The dashboard covers executive KPIs, fraud intelligence, spending behavior analysis, and customer segmentation — powered by **20+ custom DAX measures** including time intelligence and statistical functions.

![Power BI](https://img.shields.io/badge/Power%20BI-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)
![DAX](https://img.shields.io/badge/DAX-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)
![Status](https://img.shields.io/badge/Status-Complete-brightgreen?style=for-the-badge)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Data Model](#data-model)
- [Dashboard Pages](#dashboard-pages)
  - [Page 1 — Executive Overview](#page-1--executive-overview)
  - [Page 2 — Fraud Intelligence](#page-2--fraud-intelligence)
  - [Page 3 — Spending Analysis](#page-3--spending-analysis)
  - [Page 4 — Customer Segmentation](#page-4--customer-segmentation)
- [DAX Measures](#dax-measures)
- [Dataset](#dataset)
- [How to Use](#how-to-use)

---

## Overview

This project demonstrates end-to-end data analytics skills including:

- **Data Modeling** — Star schema design with 1 fact table and 4 dimension tables
- **Data Transformation** — Power Query ETL to clean and structure raw CSV data
- **DAX Calculations** — 20+ measures covering KPIs, fraud detection, time intelligence, and customer analytics
- **Data Visualization** — 4 purpose-built dashboard pages targeted at different stakeholders

---

## Data Model

The data model follows a **star schema** architecture:

```
                ┌──────────────┐
                │   Dim_Date   │
                └──────┬───────┘
                       │
┌──────────────┐  ┌────┴─────────────┐  ┌────────────────┐
│ Dim_Category ├──┤ Fact_Transactions ├──┤  Dim_Merchant  │
└──────────────┘  └────┬─────────────┘  └────────────────┘
                       │
                ┌──────┴───────┐
                │ Dim_Customer │
                └──────────────┘
```

| Table | Description | Key Columns |
|-------|-------------|-------------|
| **Fact_Transactions** | 1.3M credit card transactions | Amount, IsFraud, DateID, CustomerID |
| **Dim_Date** | Calendar table (DAX-generated) | Year, Quarter, MonthName, DayOfWeek, IsWeekend |
| **Dim_Customer** | Unique cardholders | Gender, DOB, Job, City, State, CityPopulation |
| **Dim_Category** | 14 spending categories | CategoryLabel, ChannelType (Online/In-Store) |
| **Dim_Merchant** | Unique merchants | MerchantClean, MerchantZip |

All relationships are **one-to-many** from dimension tables to the fact table with single-direction cross-filtering.

---

## Dashboard Pages

### Page 1 — Executive Overview

> **Target Audience:** Management / C-Suite Executives
>
> **Purpose:** Provide a high-level snapshot of overall transaction volume, total spend, fraud exposure, and category-level trends. Designed for quick decision-making at the executive level.

#### Visuals

| Visual | Type | Measure / Data | What It Shows |
|--------|------|----------------|---------------|
| **Total Spend** | Card | `[Total Spend]` | Aggregate dollar value of all 1.3M transactions |
| **Fraud Losses** | Card | `[Fraud Amount]` | Total dollar amount lost to fraudulent transactions |
| **Fraud Rate** | Card | `[Fraud Rate (%)]` | Percentage of transactions flagged as fraud |
| **Transaction Count** | Card | `[Transaction Count]` | Total number of transactions in the dataset |
| **Monthly Spend & Fraud Trend** | Dual-axis Line Chart | `[Total Spend]` + `[Fraud Amount]` by Month | Identifies seasonal spending patterns and correlates them with fraud activity over time |
| **Spend by Category** | Donut Chart | `[Total Spend]` by CategoryLabel | Breakdown of where customers are spending — reveals dominant categories |
| **YoY Spend Growth** | Card | `[YoY Spend Growth]` | Year-over-year percentage change in spending — indicates business growth or contraction |
| **Top 5 Categories** | Table | CategoryLabel, Total Spend, Fraud Rate | Summary table showing highest-spend categories alongside their fraud rates — highlights risk in high-volume areas |

---

### Page 2 — Fraud Intelligence

> **Target Audience:** Risk Management / Compliance / Fraud Investigation Team
>
> **Purpose:** Deep-dive into fraud patterns across categories, time-of-day, and geography. Enables fraud teams to identify high-risk segments and allocate investigation resources effectively.

#### Visuals

| Visual | Type | Measure / Data | What It Shows |
|--------|------|----------------|---------------|
| **Fraud Count** | Card | `[Fraud Count]` | Total number of fraudulent transactions detected |
| **Fraud Loss Rate** | Card | `[Fraud Loss Rate (%)]` | Percentage of total spend that was fraudulent — measures financial impact |
| **Avg Fraud Transaction** | Card | `[Avg Fraud Transaction]` | Average dollar value of a fraudulent transaction — useful for setting detection thresholds |
| **Fraud Victims** | Card | `[Fraud Victim Count]` | Number of unique customers affected by fraud |
| **Fraud Rate by Category** | Clustered Bar Chart | `[Fraud Rate (%)]` by CategoryLabel | Reveals which spending categories are most vulnerable to fraud (e.g., is online shopping riskier than grocery?) |
| **Fraud by Hour** | Clustered Column Chart | `[Fraud Count]` by TransactionHour | Time-of-day fraud distribution — shows peak fraud hours for targeted monitoring |
| **Fraud Geographic Hotspots** | Map / Shape Map | `[Fraud Count]` by State | Geographic concentration of fraud — identifies states requiring increased fraud prevention |
| **Fraud Trend with Forecast** | Line Chart + Forecast | `[Fraud Count]` by Month | Monthly fraud trend line with 3-month forecast — projects future fraud volume for resource planning |

---

### Page 3 — Spending Analysis

> **Target Audience:** Finance Team / Product Managers / Business Analysts
>
> **Purpose:** Analyze customer spending behavior across categories, channels (online vs. in-store), merchants, and time periods. Helps identify revenue drivers, seasonal patterns, and growth opportunities.

#### Visuals

| Visual | Type | Measure / Data | What It Shows |
|--------|------|----------------|---------------|
| **Category Treemap** | Treemap | `[Total Spend]` by CategoryLabel | Proportional view of spending — larger blocks = higher spend categories. Instantly shows which categories dominate |
| **Online vs In-Store** | Pie Chart | `[Total Spend]` by ChannelType | Split between digital and physical transactions — reveals the channel mix |
| **Monthly Spend Trend** | Area Chart | `[Total Spend]` by MonthName | Spending trajectory over time — highlights seasonal peaks (holidays, back-to-school, etc.) |
| **Top 10 Merchants** | Clustered Bar Chart | `[Total Spend]` by MerchantClean (Top 10) | Highest-grossing merchants — identifies key business partners or potential monopoly risks |
| **Day of Week Spending** | Clustered Column Chart | `[Total Spend]` by DayOfWeek | Spending distribution across weekdays — useful for timing promotions and staffing |

---

### Page 4 — Customer Segmentation

> **Target Audience:** Marketing Team / Relationship Managers / CRM Analysts
>
> **Purpose:** Segment and profile customers by demographics (gender, job, location) to identify high-value segments, target marketing campaigns, and understand fraud victim demographics.

#### Visuals

| Visual | Type | Measure / Data | What It Shows |
|--------|------|----------------|---------------|
| **Spend by Gender** | Donut Chart | `[Total Spend]` by Gender | Gender-based spending comparison — informs targeted marketing strategies |
| **Fraud Victims by Gender** | Donut Chart | `[Fraud Victim Count]` by Gender | Whether fraud disproportionately affects one gender — relevant for risk profiling |
| **Top 10 States by Spend** | Clustered Bar Chart | `[Total Spend]` by State (Top 10) | Geographic spending hotspots — identifies highest-revenue regions |
| **Top 10 Jobs by Spend** | Clustered Bar Chart | `[Total Spend]` by Job (Top 10) | Occupation-based spending — reveals which professions are the highest spenders |
| **Transactions Per Customer** | Card | `[Transactions Per Customer]` | Average engagement level — higher values indicate repeat/loyal customers |

---

## DAX Measures

### Spending KPIs

| Measure | Formula | Description |
|---------|---------|-------------|
| Total Spend | `SUM(Fact_Transactions[Amount])` | Sum of all transaction amounts |
| Transaction Count | `COUNTROWS(Fact_Transactions)` | Total number of transactions |
| Avg Transaction Value | `AVERAGE(Fact_Transactions[Amount])` | Mean transaction size |
| Avg Monthly Spend | `AVERAGEX(VALUES(Dim_Date[MonthNum]), [Total Spend])` | Average spend per month |

### Fraud Analytics

| Measure | Formula | Description |
|---------|---------|-------------|
| Fraud Count | `CALCULATE(COUNTROWS(...), IsFraud = 1)` | Count of fraudulent transactions |
| Fraud Amount | `CALCULATE(SUM(Amount), IsFraud = 1)` | Dollar value of fraud |
| Legitimate Spend | `CALCULATE(SUM(Amount), IsFraud = 0)` | Dollar value of legitimate transactions |
| Fraud Rate (%) | `DIVIDE([Fraud Count], [Transaction Count]) * 100` | Fraud as % of all transactions |
| Fraud Loss Rate (%) | `DIVIDE([Fraud Amount], [Total Spend]) * 100` | Fraud as % of total spend |
| Avg Fraud Transaction | `DIVIDE([Fraud Amount], [Fraud Count])` | Mean fraud transaction value |
| Avg Legit Transaction | `DIVIDE([Legitimate Spend], Count - FraudCount)` | Mean legitimate transaction value |

### Time Intelligence

| Measure | Description |
|---------|-------------|
| MoM Spend Growth | Month-over-month spending change (%) |
| YoY Spend Growth | Year-over-year spending change (%) |
| MoM Fraud Growth | Month-over-month fraud count change (%) |

### Risk & Customer

| Measure | Description |
|---------|-------------|
| Spending Volatility | Standard deviation of monthly spend |
| High Value Transactions | Count of transactions > $500 |
| Unique Customers | Distinct cardholder count |
| Transactions Per Customer | Avg transactions per cardholder |
| Fraud Victim Count | Distinct customers affected by fraud |

### Channel Analytics

| Measure | Description |
|---------|-------------|
| Online Spend | Total spend via online channels |
| In-Store Spend | Total spend via POS/in-store channels |

---

## Dataset

- **Source:** Credit card transactions dataset (1,296,676 rows, 24 columns)
- **Time Period:** 2019–2020
- **Key Fields:** Transaction amount, timestamp, merchant, category, customer demographics, fraud flag
- **File:** `credit_card_transactions.csv` (not included in repo due to size — see [Dataset Source](#dataset-source) below)

### Dataset Source

The dataset is publicly available on Kaggle:
[Credit Card Transactions Fraud Detection Dataset](https://www.kaggle.com/datasets/kartik2112/fraud-detection)

---

## How to Use

1. **Download** the `.pbix` file from this repository
2. **Download** the dataset from the Kaggle link above
3. Open the `.pbix` file in **Power BI Desktop**
4. If prompted, update the data source path to point to your local CSV file:
   - Go to **Home → Transform Data → Data Source Settings → Change Source**
5. Click **Refresh** to load the data
6. Explore the 4 dashboard pages using the tabs at the bottom

### Requirements

- [Power BI Desktop](https://powerbi.microsoft.com/desktop/) (free)
- ~500MB RAM for the 1.3M row dataset

---

## 📬 Contact

**Yeoh Zi Song**

---

*Built as a data analytics portfolio project demonstrating Power BI, DAX, data modeling, and business intelligence skills.*
