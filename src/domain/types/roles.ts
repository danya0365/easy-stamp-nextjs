export type Role = "platform_admin" | "shop_owner" | "branch_staff";

export const ROLES: Record<Role, Role> = {
  platform_admin: "platform_admin",
  shop_owner: "shop_owner",
  branch_staff: "branch_staff",
};

/** Default landing route per role after login. */
export const ROLE_HOME: Record<Role, string> = {
  platform_admin: "/admin",
  shop_owner: "/shop",
  branch_staff: "/staff",
};
