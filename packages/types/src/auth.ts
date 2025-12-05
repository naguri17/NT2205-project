export interface CustomJwtSession {
  realm_access: {
    roles?: "user" | "admin";
  };
}
