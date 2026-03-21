export interface Facility {
  facility_name: string;
  state: string;
  zip_code: string;
  smr_date: string;
  mortality_rate_facility: string;
  mortality_rate_upper_confidence_limit_975: string;
  mortality_rate_lower_confidence_limit_25: string;
  citytown: string;
  cms_certification_number_ccn: string;
  // parsed fields
  _year: number | null;
  _month: number | null;
  _mortality: number | null;
}

export interface FilterParams {
  year?: string;
  month?: string;
  state?: string;
  zip?: string;
  name?: string;
}

export interface SummaryResponse {
  total: number;
  avgMortality: number | null;
  minMortality: number | null;
  maxMortality: number | null;
  stdDev: number | null;
  outlierThreshold: number | null;
  top10Highest: FacilityRow[];
  top10Lowest: FacilityRow[];
}

export interface FacilityRow {
  ccn: string;
  name: string;
  state: string;
  zip: string;
  city: string;
  mortality: number | null;
  upperCI: number | null;
  lowerCI: number | null;
  period: string;
  isOutlier?: boolean;
}

export interface TableResponse {
  data: FacilityRow[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AnalysisResponse {
  monthlyTrend: { month: number; avgMortality: number; count: number }[];
  byState: { state: string; avgMortality: number; count: number }[];
  byZip: { zip: string; avgMortality: number; count: number }[];
  distribution: { bucket: string; min: number; max: number; count: number }[];
  nationalAvg: number | null;
}
