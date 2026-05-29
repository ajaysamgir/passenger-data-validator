export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiFailureResponse = {
  success: false;
  errors: string[];
};
