/** @format */

import { useEffect } from "react";

const useScript = (url) => {
  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [url]);
};

export default useScript;
