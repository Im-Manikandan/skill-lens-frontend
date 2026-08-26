// Imports
import React from "react";
import { Outlet } from "react-router";

// Minimal layout wrapper with no chrome (used for auth pages, etc.)
const BlankLayout = () => (
  <>
    <Outlet />
  </>
);

export default BlankLayout;
