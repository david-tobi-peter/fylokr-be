export type APIResponseType = {
  data: unknown;
  metadata?: {
    total: number;
    count: number;
    page: number;
  };
};
