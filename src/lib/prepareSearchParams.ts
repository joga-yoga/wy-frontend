export const prepareSearchParams = (params: URLSearchParams) => {
  if (!params.has("limit")) {
    params.append("limit", "10");
  }
  if (!params.has("skip")) {
    params.append("skip", "0");
  }
  if (!params.has("sortBy")) {
    params.append("sortBy", "published_at");
    params.append("sortOrder", "desc");
  }
  return params;
};
