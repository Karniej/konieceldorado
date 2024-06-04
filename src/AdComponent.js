/** @format */

import { useEffect } from "react";
import useScript from "./useScript";

export function AdComponent() {
  useScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("Ad push error:", error);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-your-client-id"
      data-ad-slot="your-ad-slot-id"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
