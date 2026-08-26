import React, { Suspense } from "react";
import Loader from "./Loader";

// Higher-order component that wraps lazy-loaded components with a Suspense fallback
const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );

export default Loadable;
