//
import React from 'react';





const walkthroughable =
  WrappedComponent =>
    ({ copilot, ...props }       ) =>
      <WrappedComponent {...copilot} {...props} />;

export default walkthroughable;
