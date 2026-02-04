import { useEffect } from "react";

type AppSettings = {
  company_name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  logo_url: string;
};

export const useAppSettings = (settings: AppSettings | null|undefined) => {
 useEffect(() => {
  if (!settings) return;

  document.title = settings.company_name;

  let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = settings.logo_url + `?v=${Date.now()}`;
}, [settings]);

};



