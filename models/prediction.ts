export interface AggregatePredictionsRequest {
  project: string;
  area: string;
  end_data: string;
  lookback_hours: number;
  half_moving_avg_size: number;
}

export interface Prediction {
    timestamp: string;
    value: number;
}

export interface AggregatePredictionsResponse {
    time_series: Prediction[];
    source_ids: string[];
}