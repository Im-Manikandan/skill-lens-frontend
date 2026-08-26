import React from "react";
import "./loader.scss";
import { Spinner } from "reactstrap";

// Full-screen loading spinner used as Suspense fallback
const Loader = () => (
  <div className="fallback-spinner">
    <div className="loading">
      <Spinner color="primary" />
    </div>
  </div>
);
export default Loader;
